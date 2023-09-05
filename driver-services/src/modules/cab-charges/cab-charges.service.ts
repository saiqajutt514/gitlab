import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { errorMessage } from "src/constants/error-message-constant";
import { LoggerHandler } from "src/helpers/logger-handler";
import { RedisHandler } from "src/helpers/redis-handler";
import { getEntryNumber } from "src/utils/generate-ccn";
import { ResponseData } from "transportation-common/dist/helpers/responseHandler";
import { In, IsNull, Not } from "typeorm";
import { CabChargeQueryParams } from "./cab-charges.interface";
import { CabChargesRepository } from "./cab-charges.repository";
import { CityRepository } from "./city.repository";
import { CountryRepository } from "./country.repository";
import { CreateCabChargeDto } from "./dto/create-cab-charge.dto";
import { UpdateCabChargeDto } from "./dto/update-cab-charge.dto";
import {
  AddCountryDto,
  AddCityDto,
  UpdateCountryDto,
  UpdateCityDto,
} from "./dto/country-city-master.dto";
@Injectable()
export class CabChargesService {
  private readonly logger = new LoggerHandler(
    CabChargesService.name
  ).getInstance();
  constructor(
    @InjectRepository(CabChargesRepository)
    private cabChargesRepository: CabChargesRepository,
    @InjectRepository(CountryRepository)
    private countryRepository: CountryRepository,
    @InjectRepository(CityRepository) private cityRepository: CityRepository,
    private redisHandler: RedisHandler
  ) {}

  // (typeorm Unique will omit null values while comparing, so created this function)
  async checkDuplicateEntry(query, id?: string) {
    let conditions = {
      cabId: query?.cabId || IsNull(),
      country: query?.country || IsNull(),
      city: query?.city || IsNull(),
    };
    // day value ranges from 0 to 6 (Sunday to Saturday)
    if (query?.day >= 0) {
      conditions = { ...conditions, ...{ day: String(query.day) } };
    } else {
      conditions = { ...conditions, ...{ day: IsNull() } };
    }
    // For update mode, need to exclude the updating row
    if (id) {
      conditions = { ...conditions, ...{ id: Not(In([id])) } };
    }
    const rowExists = await this.cabChargesRepository.findOne({
      select: ["id"],
      where: conditions,
    });
    if (rowExists) {
      this.logger.error(
        `[checkDuplicateEntry] duplicate row found with ${JSON.stringify(
          conditions
        )}`
      );
      throw new Error(errorMessage.CAB_CHARGE_DUPLICATE_EXISTS);
    }
    return;
  }

  async create(createCabChargeDto: CreateCabChargeDto) {
    try {
      // check for duplicate entry with cab,country,city,day combination
      await this.checkDuplicateEntry(createCabChargeDto);

      const cabChargeEntry = this.cabChargesRepository.create(
        createCabChargeDto
      );
      this.logger.log(`create -> ${JSON.stringify(cabChargeEntry)}`);
      await this.cabChargesRepository.save(cabChargeEntry);

      const cabCharge = await this.findOne(cabChargeEntry.id);
      if (cabCharge.statusCode === HttpStatus.OK) {
        // update charge data in redis
        this.logger.log(`[create] data in redis`);
        this.updateRedisEntry(cabCharge.data);
      }
      return cabCharge;
    } catch (err) {
      this.logger.error(`create -> ${JSON.stringify(err.message)}`);

      let message = err.message;
      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        // foreign key issue
        if (message.indexOf("cabId") >= 0) {
          // reference cab id not found in cab-type table
          message = errorMessage.INPUT_CAB_TYPE_NOT_FOUND;
        } else if (message.indexOf("country") >= 0) {
          // reference country id not found in countries table
          message = errorMessage.INPUT_COUNTRY_NOT_FOUND;
        } else if (message.indexOf("city") >= 0) {
          // reference city id not found in cities table
          message = errorMessage.INPUT_CITY_NOT_FOUND;
        }
      } else if (err.code === "ER_DUP_ENTRY") {
        // duplicate row found of Unique fields
        message = errorMessage.CAB_CHARGE_DUPLICATE_EXISTS;
      }
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async update(id: string, updateCabChargeDto: UpdateCabChargeDto) {
    try {
      // check for duplicate entry with cab,country,city,day combination
      await this.checkDuplicateEntry(updateCabChargeDto, id);
      const cabChargePrev = await this.findOne(id);

      await this.cabChargesRepository.update(id, updateCabChargeDto);

      const cabCharge = await this.findOne(id);
      if (cabCharge.statusCode === HttpStatus.OK) {
        // remove old key
        this.logger.log(`[remove] old key from redis`);
        this.removeRedisEntry(cabChargePrev.data);

        // update charge data in redis
        this.logger.log(`[update] new key in redis`);
        this.updateRedisEntry(cabCharge.data);
      }
      return cabCharge;
    } catch (err) {
      this.logger.error(`[update] -> ${JSON.stringify(err.message)}`);

      let message = err.message;
      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        // foreign key issue
        if (message.indexOf("cabId") >= 0) {
          // reference cab id not found in cab-type table
          message = errorMessage.INPUT_CAB_TYPE_NOT_FOUND;
        } else if (message.indexOf("country") >= 0) {
          // reference country id not found in countries table
          message = errorMessage.INPUT_COUNTRY_NOT_FOUND;
        } else if (message.indexOf("city") >= 0) {
          // reference city id not found in cities table
          message = errorMessage.INPUT_CITY_NOT_FOUND;
        }
      } else if (err.code === "ER_DUP_ENTRY") {
        // duplicate row found of Unique fields
        message = errorMessage.CAB_CHARGE_DUPLICATE_EXISTS;
      }
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async remove(id: string) {
    try {
      const cabCharge = await this.findOne(id);
      if (cabCharge.statusCode == HttpStatus.OK) {
        await this.cabChargesRepository.delete(id);

        // remove charge data from redis
        this.logger.log(`[remove] data from redis`);
        this.removeRedisEntry(cabCharge.data);
      }
      return cabCharge;
    } catch (err) {
      this.logger.error(`[remove] -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async findAll(query?: CabChargeQueryParams) {
    try {
      const chargeFields = [
        "cc.id",
        "cc.day",
        "cc.passengerBaseFare",
        "cc.passengerCostPerMin",
        "cc.passengerCostPerKm",
        "cab.id",
        "cab.name",
        "country.id",
        "country.name",
        "city.id",
        "city.name",
      ];
      const cabChargeQry = this.cabChargesRepository.createQueryBuilder("cc");
      cabChargeQry.leftJoin("cc.cab", "cab");
      cabChargeQry.leftJoin("cc.country", "country");
      cabChargeQry.leftJoin("cc.city", "city");
      cabChargeQry.select(chargeFields);
      if (query) {
        cabChargeQry.where(query);
      }
      cabChargeQry.orderBy({
        "cab.name": "ASC",
        "country.name": "ASC",
        "city.name": "ASC",
        "cc.day": "ASC",
      });
      const cabCharges = await cabChargeQry.getMany();

      // Update all row data in redis
      this.updateRedisEntries(cabCharges);

      return ResponseData.success(cabCharges);
    } catch (err) {
      this.logger.error(`findAll -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async findOne(id: string) {
    try {
      const cabChargeQry = this.cabChargesRepository.createQueryBuilder("cc");
      cabChargeQry.leftJoin("cc.cab", "cab");
      cabChargeQry.leftJoin("cc.country", "country");
      cabChargeQry.leftJoin("cc.city", "city");
      cabChargeQry.select([
        "cc.id",
        "cc.day",
        "cc.passengerBaseFare",
        "cc.passengerCostPerMin",
        "cc.passengerCostPerKm",
        "cab.id",
        "cab.name",
        "country.id",
        "country.name",
        "country.name",
        "city.id",
        "city.name",
      ]);
      cabChargeQry.where("cc.id = :id", { id });
      const cabCharge = await cabChargeQry.getOne();
      if (!cabCharge) {
        throw new Error(errorMessage.NO_DATA_FOUND);
      }
      return ResponseData.success(cabCharge);
    } catch (err) {
      this.logger.error(`findOne -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async getCountries() {
    try {
      const countries = await this.countryRepository.find({
        select: ["id", "name"],
        order: { name: "ASC" },
      });
      return ResponseData.success(countries);
    } catch (err) {
      this.logger.error(`getCountries -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async getCities(countryId?: string, keyword?: string) {
    try {
      const cityQry = this.cityRepository.createQueryBuilder("cc");
      cityQry.leftJoin("cc.country", "country");
      cityQry.select(["cc.id", "cc.name", "country.id", "country.name"]);
      if (countryId) {
        cityQry.where("cc.country = :countryId", { countryId });
      }
      if (keyword) {
        cityQry.where("cc.name LIKE :keyword", { keyword: `${keyword}%` });
      }
      cityQry.orderBy({ "cc.name": "ASC" });
      const cities = await cityQry.getMany();
      return ResponseData.success(cities);
    } catch (err) {
      this.logger.error(`getCities -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async getRowList() {
    try {
      const listQry = this.cityRepository.createQueryBuilder("c");
      listQry.leftJoin("c.country", "country");
      listQry.select([
        "c.entryNo",
        "c.id",
        "c.name",
        "country.id",
        "country.name",
      ]);
      listQry.orderBy({
        "country.name": "ASC",
        "c.name": "ASC",
      });
      let rowList: any = await listQry.getMany();
      if (rowList.length) {
        rowList.map((row) => {
          row.entryNo = getEntryNumber(row.entryNo);
          return row;
        });
      }

      return ResponseData.success(rowList);
    } catch (err) {
      this.logger.error(`findAll -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  // Redis data handling functions
  updateRedisEntry(result) {
    const cabChargeKeys = [result.country?.name || "", result.city?.name || ""];
    if (result.day >= 0) {
      cabChargeKeys.push(result.day);
    }

    // updating hash key of particular cab
    this.redisHandler.client.hset(
      `cab-charge-${result.cab?.id}`,
      cabChargeKeys.join("-"),
      JSON.stringify(result),
      function (err) {
        Logger.log(
          `[CabChargeService] redis-hset::${cabChargeKeys.join(
            "-"
          )} > ${JSON.stringify(err)}`
        );
      }
    );
  }

  removeRedisEntry(result) {
    const cabChargeKeys = [result.country?.name || "", result.city?.name || ""];
    if (result.day >= 0) {
      cabChargeKeys.push(result.day);
    }

    // removing hash key of particular cab
    this.redisHandler.client.hdel(
      `cab-charge-${result.cab?.id}`,
      cabChargeKeys.join("-"),
      function (err) {
        Logger.log(
          `[CabChargeService] redis-hdel::${cabChargeKeys.join(
            "-"
          )} > ${JSON.stringify(err)}`
        );
      }
    );
  }

  async updateRedisEntries(results) {
    let lastSynced = await this.redisHandler.getRedisKey("cab-charges-synced");
    if (!lastSynced) {
      this.logger.log(`updating all data in redis`);
      let cabChargeHashes = {},
        hkey,
        hikeys,
        hikey;

      results.map((cabCharge) => {
        // cabid wise redis key
        hkey = `cab-charge-${cabCharge.cab.id}`;

        // redis hash key generation
        hikeys = [cabCharge.country?.name || "", cabCharge.city?.name || ""];
        if (cabCharge.day >= 0) {
          hikeys.push(cabCharge.day);
        }
        hikey = hikeys.join("-");

        if (!cabChargeHashes[hkey]) {
          this.redisHandler.client.del(hkey);
          cabChargeHashes[hkey] = {};
        }
        cabChargeHashes[hkey][hikey] = JSON.stringify(cabCharge);
      });

      // cabid wise data updates
      Object.keys(cabChargeHashes).map((hashKey) => {
        this.redisHandler.client.hmset(
          hashKey,
          cabChargeHashes[hashKey],
          function (err) {
            Logger.log(
              "[CabChargesService] redis-hmset::" +
                hashKey +
                " > " +
                JSON.stringify(err)
            );
          }
        );
      });

      this.redisHandler.client.mset(
        ["cab-charges-synced", Date.now()],
        function (err) {
          Logger.log(
            "[CabChargesService] redis-mset::cab-charges-synced > " +
              JSON.stringify(err)
          );
        }
      );
    }
    return;
  }

  async addCountry(body: AddCountryDto) {
    try {
      const country = this.countryRepository.create(body);
      this.logger.log(`addCountry -> ${JSON.stringify(country)}`);
      await this.countryRepository.save(country);
      return ResponseData.success(country);
    } catch (err) {
      this.logger.error(`addCountry -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async updateCountry(body: UpdateCountryDto) {
    try {
      this.logger.log(`updateCountry -> ${JSON.stringify(body)}`);
      const { id, name } = body;
      await this.countryRepository.update(id, body);
      return ResponseData.success(body);
    } catch (err) {
      this.logger.error(`updateCountry -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async addCity(body: AddCityDto) {
    try {
      const city = this.cityRepository.create({
        name: body.name,
        country: <any>body.countryId,
      });
      this.logger.log(`addCity -> ${JSON.stringify(city)}`);
      await this.cityRepository.save(city);
      return ResponseData.success(city);
    } catch (err) {
      this.logger.error(`addCity -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async updateCity(body: UpdateCityDto) {
    try {
      this.logger.log(`updateCity -> ${JSON.stringify(body)}`);
      const { id, name } = body;
      await this.cityRepository.update(id, body);
      const city = await this.cityRepository.findOne({ id });
      return ResponseData.success(city);
    } catch (err) {
      this.logger.error(`updateCity -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async deleteCity(id: string) {
    try {
      this.logger.log(`deleteCity -> ${id}`);
      const city = await this.cityRepository.delete({ id });
      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`deleteCity -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }
}

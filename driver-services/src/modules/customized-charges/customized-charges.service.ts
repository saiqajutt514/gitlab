import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { errorMessage } from "src/constants/error-message-constant";
import { LoggerHandler } from "src/helpers/logger-handler";
import { RedisHandler } from "src/helpers/redis-handler";
import { getIsoDateTime } from "src/utils/get-timestamp";
import { ResponseData } from "transportation-common/dist/helpers/responseHandler";
import { CustomizedChargeQueryParams } from "./customized-charges.interface";
import { CustomizedChargesRepository } from "./customized-charges.repository";
import { CreateCustomizedChargeDto } from "./dto/create-customized-charge.dto";
import { UpdateCustomizedChargeDto } from "./dto/update-customized-charge.dto";

@Injectable()
export class CustomizedChargesService {
  private readonly logger = new LoggerHandler(
    CustomizedChargesService.name
  ).getInstance();

  constructor(
    @InjectRepository(CustomizedChargesRepository)
    private readonly customizedChargesRepository: CustomizedChargesRepository,
    private redisHandler: RedisHandler
  ) {}

  async create(createEntry: CreateCustomizedChargeDto) {
    try {
      const createRow = this.customizedChargesRepository.create(createEntry);

      if (createRow.fromDate > createRow.toDate) {
        throw new Error(errorMessage.CUSTOMIZED_CHARGE_DATE_RANGE_ERROR);
      }

      const dtFromDate = new Date(createRow.fromDate);
      dtFromDate.setMinutes(dtFromDate.getMinutes() + 30);
      const dtToDate = new Date(createRow.toDate);
      if (dtToDate < dtFromDate) {
        throw new Error(errorMessage.CUSTOMIZED_CHARGE_DATE_MIN_ERROR);
      }

      await this.customizedChargesRepository.save(createRow);
      this.logger.log(`[create] Entry created successfully`);
      const rowDetail = await this.findOne(createRow.id);
      this.updateRedisEntry(rowDetail.data);
      return rowDetail;
    } catch (err) {
      let message = err.message;
      this.logger.error(`[create] Error in catch | ${message}`);
      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        // foreign key issue
        message = errorMessage.INPUT_CITY_NOT_FOUND;
      } else if (err.code === "ER_DUP_ENTRY") {
        // duplicate row found of Unique fields
        message = "Duplicate row found with same configuration";
      }
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async update(id: string, updateEntry: UpdateCustomizedChargeDto) {
    try {
      const rowResponse = await this.findOne(id);
      if (rowResponse.statusCode !== HttpStatus.OK) {
        this.logger.error(`[update] Entry not found | ${id}`);
        throw new Error(rowResponse.message);
      }
      const updatingRow = { ...rowResponse.data, ...updateEntry };

      if (updatingRow.fromDate > updatingRow.toDate) {
        throw new Error(errorMessage.CUSTOMIZED_CHARGE_DATE_RANGE_ERROR);
      }

      const dtFromDate = new Date(updatingRow.fromDate);
      dtFromDate.setMinutes(dtFromDate.getMinutes() + 30);
      const dtToDate = new Date(updatingRow.toDate);
      if (dtToDate < dtFromDate) {
        throw new Error(errorMessage.CUSTOMIZED_CHARGE_DATE_MIN_ERROR);
      }

      await this.customizedChargesRepository.update(id, updateEntry);
      rowResponse.data = updatingRow;
      this.updateRedisEntry(updatingRow);
      this.logger.log(`[update] Entry updated successfully`);
      return rowResponse;
    } catch (err) {
      let message = err.message;
      this.logger.error(`[update] Error in catch | ${message}`);
      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        // foreign key issue
        message = errorMessage.INPUT_CITY_NOT_FOUND;
      } else if (err.code === "ER_DUP_ENTRY") {
        // duplicate row found of Unique fields
        message = "Duplicate row found with same configuration";
      }
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async remove(id: string) {
    try {
      const rowResponse = await this.findOne(id);
      if (rowResponse.statusCode !== HttpStatus.OK) {
        this.logger.error(`[remove] Entry not found | ${id}`);
        throw new Error(rowResponse.message);
      }
      await this.customizedChargesRepository.delete(id);

      const keyList = [rowResponse.data.city?.name || "", rowResponse.data.id];
      const dataKey = `fare-multiplier-${keyList.join("-")}`;
      this.redisHandler.client.del(dataKey, function (err) {
        Logger.log(`[remove] redis-del::${dataKey} > ${JSON.stringify(err)}`);
      });
      this.logger.log(`[remove] Entry removed successfully`);
      return rowResponse;
    } catch (err) {
      this.logger.error(`[remove] Error in catch | ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async findAll(query?: CustomizedChargeQueryParams) {
    try {
      const chargeQry = this.customizedChargesRepository.createQueryBuilder(
        "cc"
      );
      chargeQry.leftJoin("cc.city", "city");
      chargeQry.select([
        "cc.id",
        "cc.title",
        "cc.createdAt",
        "cc.fromDate",
        "cc.toDate",
        "cc.multiplyRate",
        "city.id",
        "city.name",
      ]);
      if (query) {
        chargeQry.where(query);
      }
      const rowList = await chargeQry.getMany();
      let entryList = [];
      if (rowList.length) {
        entryList = rowList.map((row) => {
          let yearList = [];
          yearList.push(row.fromDate.getFullYear());
          yearList.push(row.toDate.getFullYear());
          if (yearList[0] === yearList[1]) {
            yearList.pop();
          }
          return {
            ...row,
            year: yearList.join("-"),
          };
        });
      }
      this.logger.log(`[findAll] results found | ${entryList.length}`);
      return ResponseData.success(entryList);
    } catch (err) {
      this.logger.error(`[findAll] Error in catch | ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async findOne(id: string) {
    try {
      const rowDetail = await this.customizedChargesRepository.findOne(id, {
        select: [
          "id",
          "title",
          "createdAt",
          "fromDate",
          "toDate",
          "multiplyRate",
        ],
        relations: ["city"],
      });
      if (!rowDetail) {
        this.logger.error(`[findOne] Entry not found | ${id}`);
        throw new Error(errorMessage.NO_DATA_FOUND);
      }
      return ResponseData.success(rowDetail);
    } catch (err) {
      this.logger.error(`[findOne] Error in catch | ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  // Redis data handling functions
  updateRedisEntry(result) {
    const keyList = [result.city?.name || "", result.id];
    const keyData = {
      fromDate: result.fromDate,
      toDate: result.toDate,
      multiplyRate: result.multiplyRate,
    };
    const dataKey = `fare-multiplier-${keyList.join("-")}`;
    this.redisHandler.client.set(
      dataKey,
      JSON.stringify(keyData),
      function (err) {
        Logger.log(`[update] redis-set::${dataKey} > ${JSON.stringify(err)}`);
      }
    );
    const expiryAt = new Date(
      getIsoDateTime(new Date(result.toDate))
    ).getTime();
    this.redisHandler.client.expireat(
      dataKey,
      Math.round(expiryAt / 1000),
      function (err) {
        Logger.log(`[update] expiry-set::${dataKey} > ${JSON.stringify(err)}`);
      }
    );
  }
}

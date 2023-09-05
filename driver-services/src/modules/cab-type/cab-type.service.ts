import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'src/helpers/responseHandler';
import { IsNull, Not } from 'typeorm';

import { GetCabTypeLocationInterface } from './cab-type.interface';
import { CabTypeRepository } from './cab-type.repository';
import {
  CreateCabTypeDto,
  UpdateCabTypeOrderDto,
} from './dto/create-cab-type.dto';
import { UpdateCabTypeDto } from './dto/update-cab-type.dto';
import { CabTypeEntity } from './entities/cab-type.entity';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { calculateFareDistance } from 'src/helpers/googleDistanceCalculation';
import { RedisHandler } from 'src/helpers/redis-handler';
import { plainToClass } from 'class-transformer';
import { CabTypeAdmin } from './dto/cab-type-admin.dto';
import { CaptainService } from '../captain/captain.service';
import { concat } from 'rxjs';

@Injectable()
export class CabTypeService {
  private readonly logger = new LoggerHandler(
    CabTypeService.name,
  ).getInstance();
  constructor(
    @InjectRepository(CabTypeRepository)
    private cabTypeRepository: CabTypeRepository,
    private redisHandler: RedisHandler,
    private captainService: CaptainService,
  ) {}

  async create(createCabTypeDto: CreateCabTypeDto) {
    try {
      // default cab waiting charge added from setting

      let order: number = 1;
      let orderData = await this.cabTypeRepository.findOne({
        select: ['id', 'order'],
        order: { order: 'DESC' },
      });
      if (orderData && orderData?.order) {
        order = Number(orderData.order) + 1;
      }

      const defaultParams = {
        waitChargePerMin: await this.redisHandler.getRedisKey(
          'SETTING_WAITING_CHARGE_PER_MINUTE',
        ),
        order: order,
      };
      createCabTypeDto = { ...createCabTypeDto, ...defaultParams };
      const cabType = this.cabTypeRepository.create(createCabTypeDto);
      this.logger.log(`create -> ${JSON.stringify(cabType)}`);
      await this.cabTypeRepository.save(cabType);
      this.redisHandler.client.set(
        `cab-type-${cabType.id}`,
        JSON.stringify(cabType),
        function (err) {
          Logger.log(
            '[cabTypeService] [create] redis-set::' +
              cabType.id +
              ' > ' +
              JSON.stringify(err),
          );
        },
      );
      return ResponseData.success(cabType);
    } catch (err) {
      this.logger.log(`create -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAll(
    query?: GetCabTypeLocationInterface,
    options?: { adminList: boolean },
  ) {
    try {
      const cabList = await this.cabTypeRepository.find({
        where: { isDeleted: IsNull() },
        order: { order: 'ASC' },
      });
      // Save list into redis
      let lastSynced = await this.redisHandler.getRedisKey('cab-types-synced');
      if (!lastSynced) {
        let cabRedis = [];
        cabList.map((cab) => {
          cabRedis.push(`cab-type-${cab.id}`);
          cabRedis.push(JSON.stringify(cab));
        });
        cabRedis.push('cab-types-synced');
        cabRedis.push(Date.now());
        this.redisHandler.client.mset(cabRedis, function (err) {
          Logger.log(
            '[cabTypeService] [findAll] redis-set::' +
              cabRedis.length / 2 +
              ' > ' +
              JSON.stringify(err),
          );
        });
      }

      let cabs;
      if (options?.adminList === true) {
        cabs = cabList.map((cab) => {
          return plainToClass(CabTypeAdmin, cab, {
            excludeExtraneousValues: true,
          });
        });
      } else {
        cabs = cabList;
      }
      if (JSON.stringify(query) !== '{}' && !!query && cabs.length) {
        let response = {};
        if (Object.keys(query).length !== 4) {
          return ResponseData.success(cabs);
        }
        const origin = {
          lat: Number(query.originAddressLat),
          lng: Number(query.originAddressLng),
        };
        const destination = {
          lat: Number(query.destinationAddressLat),
          lng: Number(query.destinationAddressLng),
        };
        this.logger.log(
          `[cabTypeService] findAll -> origin -> ${JSON.stringify(origin)}`,
        );
        this.logger.log(
          `[cabTypeService] findAll -> destination -> ${JSON.stringify(
            destination,
          )}`,
        );
        const calculatedResponse = await calculateFareDistance(
          origin,
          destination,
        );
        this.logger.log(
          `[cabTypeService] findAll -> calculatedResponse -> ${JSON.stringify(
            calculatedResponse,
          )}`,
        );
        // 000

        const fccdRes = await this.captainService.findCabCaptainsDistance(
          Number(query.originAddressLat),
          Number(query.originAddressLng),
        );

        response['cabs'] = (await Promise.all(
          cabs.map(async (cab) => {
            let estimateCost = Number(
              cab.passengerBaseFare +
                (cab.passengerCostPerKm || 1) * calculatedResponse.distance +
                (cab.passengerCostPerMin || 1) * calculatedResponse.time +
                (await this.getTripProcessingFee()) +
                (await this.getTripWaslFee()),
              // 0.5 // replace with mot fee
              // .toFixed(2),
            );
            const estimateTaxCost =
              (estimateCost / 100) * (await this.getTripTaxPercentage());
            estimateCost = Number((estimateCost + estimateTaxCost).toFixed(2));
            this.logger.log(
              `[cabTypeService][findAll] estimate cost for cab, ${estimateCost}`,
            );
            // console.log(cab);
            // check if cabId match with captain service cabId then attach expected time.

            let estimatedArrivalTime = 'No captain found';
            fccdRes?.data.map(
              (item) =>
                (estimatedArrivalTime =
                  item.cabId === cab.id
                    ? `${item?.time} away`
                    : estimatedArrivalTime),
            );
            this.logger.log(
              `[cabTypeService][findAll] estimated Arrival Time, ${estimatedArrivalTime}`,
            );
            return {
              ...cab,
              estimateCost,
              estimatedArrivalTime,
            };
          }),
        )) as CabTypeEntity[];

        this.logger.log(`[cabTypeService][findAll] cabs calculated`);
        response['estimate'] = { ...calculatedResponse };

        return ResponseData.success(response);
      } else {
        return ResponseData.success(cabs);
      }
    } catch (err) {
      this.logger.error(`findAll -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findOne(id: string, query?: GetCabTypeLocationInterface) {
    try {
      const cabType = await this.cabTypeRepository.findOne(id);
      if (!cabType) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.CAB_TYPE_NOT_FOUND,
        );
      }
      let response = cabType;
      if (JSON.stringify(query) !== '{}' && !!query) {
        const origin = {
          lat: Number(query.originAddressLat),
          lng: Number(query.originAddressLng),
        };
        const destination = {
          lat: Number(query.destinationAddressLat),
          lng: Number(query.destinationAddressLng),
        };

        this.logger.log(
          `[cabTypeService] findOne -> origin -> ${JSON.stringify(origin)}`,
        );
        this.logger.log(
          `[cabTypeService] findOne -> destination -> ${JSON.stringify(
            destination,
          )}`,
        );
        const calculatedResponse = await calculateFareDistance(
          origin,
          destination,
        );
        const estimateCost = Number(
          (
            cabType.passengerBaseFare +
            (cabType.passengerCostPerKm || 1) * calculatedResponse.distance +
            (cabType.passengerCostPerMin || 1) * calculatedResponse.time +
            0.5
          ) // replace with mot fee
            .toFixed(2),
        );
        this.logger.log(
          `[cabTypeService][findOne] estimate cost for cab, ${estimateCost}`,
        );
      }
      return ResponseData.success(response);
    } catch (err) {
      this.logger.error(`findOne -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async update(id: string, updateCabTypeDto: UpdateCabTypeDto) {
    try {
      let { order } = updateCabTypeDto;
      let orderData = await this.isValidOrder(id, order);
      if (orderData) {
        throw new Error(errorMessage.CAB_TYPE_ORDER_EXIST);
      }
      await this.cabTypeRepository.update(id, updateCabTypeDto);
      let cabType = await this.findOne(id);
      if (cabType.statusCode === HttpStatus.OK) {
        this.redisHandler.client.set(
          `cab-type-${id}`,
          JSON.stringify(cabType.data),
          function (err) {
            Logger.log(
              '[cabTypeService] [update] redis-set::' +
                id +
                ' > ' +
                JSON.stringify(err),
            );
          },
        );
      }
      return cabType;
    } catch (err) {
      let message = err.message || errorMessage.SOMETHING_WENT_WRONG;
      if (err.code === 'ER_DUP_ENTRY') {
        message = `Duplicate entry '${updateCabTypeDto.name}' for name`;
      }
      this.logger.error(`update -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, message);
    }
  }

  async remove(id: string) {
    try {
      const cabType = await this.findOne(id);
      if (cabType.statusCode == HttpStatus.OK) {
        await this.cabTypeRepository.delete(id);
        this.redisHandler.client.del(`cab-type-${id}`, function (err) {
          Logger.log(
            '[cabTypeService] [remove] redis-del::' +
              id +
              ' > ' +
              JSON.stringify(err),
          );
        });
      }
      return cabType;
    } catch (err) {
      this.logger.error(`remove -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async isValidOrder(id: string, order: number) {
    return await this.cabTypeRepository.findOne({
      select: ['id', 'order'],
      where: { order: order, id: Not(id) },
    });
  }

  async updateCabTypeOrder(params: UpdateCabTypeOrderDto) {
    try {
      let { id, order } = params;
      let orderData = await this.isValidOrder(id, order);
      if (orderData) {
        throw new Error(errorMessage.CAB_TYPE_ORDER_EXIST);
      }

      await this.cabTypeRepository.update(id, params);
      let cabType = await this.findOne(id);
      if (cabType.statusCode === HttpStatus.OK) {
        this.redisHandler.client.set(
          `cab-type-${id}`,
          JSON.stringify(cabType.data),
          function (err) {
            Logger.log(
              '[cabTypeService] [update] redis-set::' +
                id +
                ' > ' +
                JSON.stringify(err),
            );
          },
        );
      }
      return ResponseData.success(cabType);
    } catch (err) {
      this.logger.error(`update -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getTripWaslFee() {
    return (
      Number(await this.redisHandler.getRedisKey('SETTING_TRIP_WASL_FEE')) ||
      0.5
    );
  }
  async getTripProcessingFee() {
    return (
      Number(
        await this.redisHandler.getRedisKey('SETTING_TRIP_PROCESSING_FEE'),
      ) || 1
    );
  }
  async getTripTaxPercentage() {
    return (
      (await this.redisHandler.getRedisKey('SETTING_TRIP_TAX_PERCENTAGE')) || 15
    );
  }
}

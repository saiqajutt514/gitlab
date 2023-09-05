import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'src/helpers/responseHandler';

import { CarInfoListSort } from './car-info.enum';
import { ListSearchSortDto, SyncCarParams } from './car-info.interface';
import { CarInfoRepository } from './car-info.repository';
import { CreateCarInfoDto } from './dto/create-car-info.dto';
import { UpdateCarInfoDto } from './dto/update-car-info.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { getIsoDateTime } from 'src/utils/get-timestamp';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import {
  authKafkaMicroServiceConfig,
  authTCPMicroServiceConfig,
} from 'src/microServicesConfigs/auth.microservice.config';

import {
  FETCH_CAR_INFO,
  GET_VEHICLE_MASTER_INFO,
} from 'src/constants/kafka-constant';
import { IsNull, Repository } from 'typeorm';
import { CaptainEntity } from '../captain/captain.entity';
import { VehicleEntity } from '../vehicle/entities/vehicle.entity';
import { response } from 'express';
@Injectable()
export class CarInfoService {
  // @Client(authKafkaMicroServiceConfig)
  // authKafkaClient: ClientKafka;

  // @Client(authTCPMicroServiceConfig)
  // authTcpClient: ClientProxy;

  private readonly logger = new LoggerHandler(
    CarInfoService.name,
  ).getInstance();

  constructor(
    @InjectRepository(CaptainEntity)
    private captainRepository: Repository<CaptainEntity>,
    @InjectRepository(VehicleEntity)
    private vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(CarInfoRepository)
    private carInfoRepository: CarInfoRepository,
    @Inject('CLIENT_AUTH_SERVICE_TCP') private authTcpClient: ClientProxy,
    @Inject('CLIENT_ADMIN_SERVICE_TCP') private clientAdminTCP: ClientProxy,
  ) {}

  onModuleInit() {
    // this.authKafkaClient.subscribeToResponseOf(FETCH_CAR_INFO)
  }

  async create(createCarInfoDto: CreateCarInfoDto) {
    try {
      this.logger.log(`create -> ${JSON.stringify(createCarInfoDto)}`);
      let carInfoDetail = await this.carInfoRepository.findOne({
        where: { carSequenceNo: createCarInfoDto?.carSequenceNo },
      });
      // if (carInfoDetail) {
      //   return ResponseData.success(carInfoDetail);
      // }
      if (!carInfoDetail) {
        const carInfo = this.carInfoRepository.create(createCarInfoDto);
        carInfoDetail = await this.carInfoRepository.save(carInfo);
      }
      const vehicleResponse = await this.clientAdminTCP
        .send(GET_VEHICLE_MASTER_INFO, JSON.stringify(carInfoDetail))
        .pipe()
        .toPromise();
      this.logger.debug(
        `kafka::captain::${GET_VEHICLE_MASTER_INFO}::vehicleMasterInfoResponse -> ${JSON.stringify(
          vehicleResponse,
        )}`,
      );
      const response: any = carInfoDetail;
      response.makerIcon = null;
      if (
        vehicleResponse.statusCode === HttpStatus.OK &&
        vehicleResponse?.data?.makerIcon
      ) {
        response.makerIcon = vehicleResponse?.data?.makerIcon;
      }
      return ResponseData.success(response);
    } catch (err) {
      this.logger.log(`create -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCarSequenceNo(model) {
    try {
      let numArray = [];
      const res = await this.carInfoRepository
        .createQueryBuilder('car')
        .select('car.carSequenceNo AS carSequenceNo')
        .where('car.vehicleModel LIKE :model', { model: `%${model}%` })
        .getRawMany();
      res.map((x) => numArray.push(x.carSequenceNo));

      this.logger.log(`[getCarSequenceNo] res : ${JSON.stringify(numArray)}`);
      return ResponseData.success(numArray);
    } catch (err) {
      this.logger.error(`updateCabsId catch error :  ${err?.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async findAll(params: ListSearchSortDto) {
    try {
      const fields = [
        'car_info.id',
        'car_info.createdAt',
        'car_info.updatedAt',
        'car_info.carSequenceNo',
        'car_info.chassisNumber',
        'car_info.cylinders',
        'car_info.lkVehicleClass',
        'car_info.licenseExpiryDate',
        'car_info.licenseExpiryDateEnglish',
        'car_info.bodyType',
        'car_info.bodyTypeEnglish',
        'car_info.majorColor',
        'car_info.majorColorEnglish',
        'car_info.modelYear',
        'car_info.plateNumber',
        'car_info.ownerName',
        'car_info.ownerNameEnglish',
        'car_info.plateText1',
        'car_info.plateText1English',
        'car_info.plateText2',
        'car_info.plateText2English',
        'car_info.plateText3',
        'car_info.plateText3English',
        'car_info.plateTypeCode',
        'car_info.vehicleCapacity',
        'car_info.regplace',
        'car_info.regplaceEnglish',
        'car_info.vehicleMaker',
        'car_info.vehicleMakerEnglish',
        'car_info.vehicleModel',
        'car_info.vehicleModelEnglish',
        'driver.id',
        'driver.driverName',
        'driver.externalId',
      ];
      const carQryInstance = this.carInfoRepository.createQueryBuilder(
        'car_info',
      );
      carQryInstance.select(fields);
      carQryInstance.leftJoin('car_info.driver', 'driver');

      //Admin Filters
      if (params?.filters?.driverName) {
        carQryInstance.andWhere('driver.driverName LIKE :driverName', {
          driverName: `${params?.filters?.driverName}%`,
        });
      }
      if (typeof params?.filters?.externalId === 'number') {
        carQryInstance.andWhere('driver.externalId = :externalId', {
          externalId: params?.filters?.externalId,
        });
      }
      if (params?.filters?.carSequenceNo) {
        carQryInstance.andWhere('car_info.carSequenceNo LIKE :carSequenceNo', {
          carSequenceNo: `${params?.filters?.carSequenceNo}%`,
        });
      }
      if (params?.filters?.chassisNumber) {
        carQryInstance.andWhere('car_info.chassisNumber LIKE :chassisNumber', {
          chassisNumber: `${params?.filters?.chassisNumber}%`,
        });
      }
      if (typeof params?.filters?.cylinders === 'number') {
        carQryInstance.andWhere('car_info.cylinders = :cylinders', {
          cylinders: params?.filters?.cylinders,
        });
      }
      if (typeof params?.filters?.lkVehicleClass === 'number') {
        carQryInstance.andWhere('car_info.lkVehicleClass = :lkVehicleClass', {
          lkVehicleClass: params?.filters?.lkVehicleClass,
        });
      }
      if (params?.filters?.licenseExpiryDate) {
        carQryInstance.andWhere(
          'car_info.licenseExpiryDate LIKE :licenseExpiryDate',
          { licenseExpiryDate: `${params?.filters?.licenseExpiryDate}%` },
        );
      }
      if (params?.filters?.licenseExpiryDateEnglish) {
        carQryInstance.andWhere(
          'car_info.licenseExpiryDateEnglish LIKE :licenseExpiryDateEnglish',
          {
            licenseExpiryDateEnglish: `${params?.filters?.licenseExpiryDateEnglish}%`,
          },
        );
      }
      if (params?.filters?.bodyType) {
        carQryInstance.andWhere('car_info.bodyType LIKE :bodyType', {
          bodyType: `${params?.filters?.bodyType}%`,
        });
      }
      if (params?.filters?.bodyTypeEnglish) {
        carQryInstance.andWhere(
          'car_info.bodyTypeEnglish LIKE :bodyTypeEnglish',
          { bodyTypeEnglish: `${params?.filters?.bodyTypeEnglish}%` },
        );
      }
      if (params?.filters?.majorColor) {
        carQryInstance.andWhere('car_info.majorColor LIKE :majorColor', {
          majorColor: `${params?.filters?.majorColor}%`,
        });
      }
      if (params?.filters?.majorColorEnglish) {
        carQryInstance.andWhere(
          'car_info.majorColorEnglish LIKE :majorColorEnglish',
          { majorColorEnglish: `${params?.filters?.majorColorEnglish}%` },
        );
      }
      if (typeof params?.filters?.modelYear === 'number') {
        carQryInstance.andWhere('car_info.modelYear = :modelYear', {
          modelYear: params?.filters?.modelYear,
        });
      }
      if (params?.filters?.ownerName) {
        carQryInstance.andWhere('car_info.ownerName LIKE :ownerName', {
          ownerName: `${params?.filters?.ownerName}%`,
        });
      }
      if (params?.filters?.ownerNameEnglish) {
        carQryInstance.andWhere(
          'car_info.ownerNameEnglish LIKE :ownerNameEnglish',
          { ownerNameEnglish: `${params?.filters?.ownerNameEnglish}%` },
        );
      }
      if (typeof params?.filters?.plateNumber === 'number') {
        carQryInstance.andWhere('car_info.plateNumber = :plateNumber', {
          plateNumber: params?.filters?.plateNumber,
        });
      }
      if (params?.filters?.plateText1) {
        carQryInstance.andWhere('car_info.plateText1 = :plateText1', {
          plateText1: params?.filters?.plateText1,
        });
      }
      if (params?.filters?.plateText1English) {
        carQryInstance.andWhere(
          'car_info.plateText1English = :plateText1English',
          { plateText1English: params?.filters?.plateText1English },
        );
      }
      if (params?.filters?.plateText2) {
        carQryInstance.andWhere('car_info.plateText2 = :plateText2', {
          plateText2: params?.filters?.plateText2,
        });
      }
      if (params?.filters?.plateText2English) {
        carQryInstance.andWhere(
          'car_info.plateText2English = :plateText2English',
          { plateText2English: params?.filters?.plateText2English },
        );
      }
      if (params?.filters?.plateText3) {
        carQryInstance.andWhere('car_info.plateText3 = :plateText3', {
          plateText3: params?.filters?.plateText3,
        });
      }
      if (params?.filters?.plateText3English) {
        carQryInstance.andWhere(
          'car_info.plateText3English = :plateText3English',
          { plateText3English: params?.filters?.plateText3English },
        );
      }
      if (typeof params?.filters?.plateTypeCode === 'number') {
        carQryInstance.andWhere('car_info.plateTypeCode = :plateTypeCode', {
          plateTypeCode: params?.filters?.plateTypeCode,
        });
      }
      if (params?.filters?.regplace) {
        carQryInstance.andWhere('car_info.regplace LIKE :regplace', {
          regplace: `${params?.filters?.regplace}%`,
        });
      }
      if (params?.filters?.regplaceEnglish) {
        carQryInstance.andWhere(
          'car_info.regplaceEnglish LIKE :regplaceEnglish',
          { regplaceEnglish: `${params?.filters?.regplaceEnglish}%` },
        );
      }
      if (typeof params?.filters?.vehicleCapacity === 'number') {
        carQryInstance.andWhere('car_info.vehicleCapacity = :vehicleCapacity', {
          vehicleCapacity: params?.filters?.vehicleCapacity,
        });
      }
      if (params?.filters?.vehicleMaker) {
        carQryInstance.andWhere('car_info.vehicleMaker LIKE :vehicleMaker', {
          vehicleMaker: `${params?.filters?.vehicleMaker}%`,
        });
      }
      if (params?.filters?.vehicleMakerEnglish) {
        carQryInstance.andWhere(
          'car_info.vehicleMakerEnglish LIKE :vehicleMakerEnglish',
          { vehicleMakerEnglish: `${params?.filters?.vehicleMakerEnglish}%` },
        );
      }
      if (params?.filters?.vehicleModel) {
        carQryInstance.andWhere('car_info.vehicleModel LIKE :vehicleModel', {
          vehicleModel: `${params?.filters?.vehicleModel}%`,
        });
      }
      if (params?.filters?.vehicleModelEnglish) {
        carQryInstance.andWhere(
          'car_info.vehicleModelEnglish LIKE :vehicleModelEnglish',
          { vehicleModelEnglish: `${params?.filters?.vehicleModelEnglish}%` },
        );
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        carQryInstance.andWhere('car_info.createdAt >= :fromDate', {
          fromDate,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setUTCHours(
              23,
              59,
              59,
              999,
            ),
          ),
        );
        carQryInstance.andWhere('car_info.createdAt <= :toDate', { toDate });
      }
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = CarInfoListSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          carQryInstance.orderBy(sortField, sortOrder);
        }
      }
      carQryInstance.skip(params.skip);
      carQryInstance.take(params.take);
      const [result, total] = await carQryInstance.getManyAndCount();

      const totalCount: number = total;
      const vehicles: any = result;

      return ResponseData.success({ vehicles, totalCount });
    } catch (err) {
      this.logger.error(`findAll -> error -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findOne(id: string) {
    try {
      const carInfo = await this.carInfoRepository.findOne({
        join: {
          alias: 'car_info',
          leftJoinAndSelect: {
            driver: 'car_info.driver',
          },
        },
        where: {
          id: id,
        },
      });
      if (!carInfo) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.CAR_INFO_NOT_FOUND,
        );
      }
      return ResponseData.success(carInfo);
    } catch (err) {
      this.logger.error(`findOne -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findOneBySequenceNo(carSequenceNo: string) {
    try {
      const carInfo = await this.carInfoRepository.findOne({
        where: { carSequenceNo },
      });
      if (!carInfo) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.CAR_INFO_NOT_FOUND,
        );
      }
      return ResponseData.success(carInfo);
    } catch (err) {
      this.logger.error(`findOne -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async update(id: string, updateCarInfoDto: UpdateCarInfoDto) {
    try {
      await this.carInfoRepository.update(id, updateCarInfoDto);
      const carInfo = await this.findOne(id);
      return carInfo;
    } catch (err) {
      this.logger.error(`update -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async remove(id: string) {
    try {
      const carInfo = await this.findOne(id);
      if (carInfo.statusCode === HttpStatus.OK) {
        await this.carInfoRepository.delete(id);
      }
      return carInfo;
    } catch (err) {
      this.logger.error(`remove -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async syncCarInfo(data: SyncCarParams, sessionId: string) {
    const { cabId, driverId, carSequenceNo } = data;
    try {
      const carInfoDetail = await this.carInfoRepository.findOne({
        select: ['id'],
        where: { carSequenceNo, userId: data?.userId },
      });
      if (!carInfoDetail) {
        const apiParams = {
          sessionId,
          sequenceNumber: carSequenceNo,
        };

        this.logger.log(
          `fetchCarInfo -> params -> ${JSON.stringify(apiParams)}`,
        );
        this.logger.log(
          `kafka::auth::${FETCH_CAR_INFO}::send -> ${JSON.stringify(
            apiParams,
          )}`,
        );
        const carResponse = await this.authTcpClient
          .send(FETCH_CAR_INFO, JSON.stringify(apiParams))
          .pipe()
          .toPromise();
        this.logger.debug(
          `kafka::auth::${FETCH_CAR_INFO}::carResponse -> ${JSON.stringify(
            carResponse,
          )}`,
        );

        if (carResponse.statusCode === HttpStatus.OK) {
          const rowInfo = {
            ...carResponse.data,
            carSequenceNo,
          };

          this.logger.log(
            `kafka::captain::${GET_VEHICLE_MASTER_INFO}::send -> ${JSON.stringify(
              rowInfo,
            )}`,
          );
          const vehicleResponse = await this.clientAdminTCP
            .send(GET_VEHICLE_MASTER_INFO, JSON.stringify(rowInfo))
            .pipe()
            .toPromise();
          this.logger.debug(
            `kafka::captain::${GET_VEHICLE_MASTER_INFO}::vehicleMasterInfoResponse -> ${JSON.stringify(
              vehicleResponse,
            )}`,
          );
          if (vehicleResponse.statusCode === HttpStatus.OK) {
            rowInfo.vehicleMakerEnglish =
              vehicleResponse.data?.makerEnglish || null;
            rowInfo.vehicleModelEnglish =
              vehicleResponse.data?.modelEnglish || null;
          }

          // const parentDetail = await this.carInfoRepository.findOne({
          //   select: ['id'],
          //   where: {
          //     majorColor: rowInfo.majorColor,
          //     vehicleMaker: rowInfo.vehicleMaker,
          //     vehicleModel: rowInfo.vehicleModel,
          //     parentId: IsNull()
          //   },
          //   order: {
          //     createdAt: 'ASC'
          //   }
          // });
          // if (parentDetail) {
          //   rowInfo['parentId'] = parentDetail.id
          // }

          this.logger.debug(
            `[syncCarInfo] inserted data : ${JSON.stringify(rowInfo)}`,
          );
          const rowCreatedInfo = this.carInfoRepository.create(rowInfo);
          const carInfo = await this.carInfoRepository.save(rowCreatedInfo);

          this.logger.log(`[updateCaptainCarId] captainId (${carInfo['id']})`);
          await this.captainRepository.update(driverId, { car: carInfo['id'] });

          //TODO: Add vehicle info
          const vehicleMaster = await this.vehicleRepository.findOne({
            where: {
              majorColor: rowInfo.majorColor,
              vehicleMaker: rowInfo.vehicleMaker,
              vehicleModel: rowInfo.vehicleModel,
            },
          });

          if (!vehicleMaster) {
            const vehicle = {
              majorColor: rowInfo.majorColor,
              vehicleMaker: rowInfo.vehicleMaker,
              vehicleModel: rowInfo.vehicleModel,
            };
            this.logger.log(
              `[addVehicleInfo] Vehicle info adding ${JSON.stringify(vehicle)}`,
            );
            const vehicleData = this.vehicleRepository.create(vehicle);
            vehicleData.save();
            this.logger.log(`[addVehicleInfo] > Entry added`);
          }

          this.logger.log(
            `[syncCarInfo] carSequenceNo(${carSequenceNo}) > entry added`,
          );
        } else {
          this.logger.error(
            `[syncCarInfo] carSequenceNo(${carSequenceNo}) > failed from YakeenApi`,
          );
        }
      } else {
        this.logger.error(
          `[syncCarInfo] carSequenceNo(${carSequenceNo}) > already exists`,
        );
      }
    } catch (err) {
      this.logger.error(
        `[syncCarInfo] carSequenceNo(${carSequenceNo}) > error :: ${JSON.stringify(
          err.message,
        )}`,
      );
    }
  }
}

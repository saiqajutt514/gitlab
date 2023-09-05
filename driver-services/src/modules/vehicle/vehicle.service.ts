import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { errorMessage } from "src/constants/error-message-constant";
import { ResponseData } from "src/helpers/responseHandler";

import { VehicleListSort } from "./vehicle.enum";
import { ListSearchSortDto } from "./vehicle.interface";
import { VehicleRepository } from "./vehicle.repository";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { LoggerHandler } from "src/helpers/logger-handler";
import { getIsoDateTime } from "src/utils/get-timestamp";

@Injectable()
export class VehicleService {
  private readonly logger = new LoggerHandler(
    VehicleService.name
  ).getInstance();

  constructor(
    @InjectRepository(VehicleRepository)
    private vehicleRepository: VehicleRepository
  ) {}

  async create(createVehicleDto: CreateVehicleDto) {
    try {
      const vehicle = this.vehicleRepository.create(createVehicleDto);
      this.logger.log(`create -> ${JSON.stringify(vehicle)}`);
      await this.vehicleRepository.save(vehicle);
      return ResponseData.success(vehicle);
    } catch (err) {
      this.logger.log(`create -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async findAll(params: ListSearchSortDto) {
    try {
      const fields = [
        "vehicle.id",
        "vehicle.createdAt",
        "vehicle.updatedAt",
        "vehicle.vehicleMaker",
        "vehicle.vehicleMakerEnglish",
        "vehicle.vehicleModel",
        "vehicle.vehicleModelEnglish",
        "vehicle.majorColor",
        "vehicle.majorColorEnglish",
        "vehicle.bodyType",
        "vehicle.bodyTypeEnglish",
        "vehicle.modelYear",
        "vehicle.vehicleCapacity",
        "vehicle.lkVehicleClass",
        "vehicle.cylinders",
        "vehicle.vehicleImage",
        "cab.id",
        "cab.name",
      ];
      const vehicleQryInstance = this.vehicleRepository.createQueryBuilder(
        "vehicle"
      );
      vehicleQryInstance.select(fields);
      vehicleQryInstance.leftJoin("vehicle.cab", "cab");

      //Admin Filters
      if (params?.filters?.cabName) {
        vehicleQryInstance.andWhere("cab.name LIKE :cabName", {
          cabName: `${params?.filters?.cabName}%`,
        });
      }
      if (typeof params?.filters?.cylinders === "number") {
        vehicleQryInstance.andWhere("vehicle.cylinders = :cylinders", {
          cylinders: params?.filters?.cylinders,
        });
      }
      if (typeof params?.filters?.lkVehicleClass === "number") {
        vehicleQryInstance.andWhere(
          "vehicle.lkVehicleClass = :lkVehicleClass",
          { lkVehicleClass: params?.filters?.lkVehicleClass }
        );
      }
      if (params?.filters?.bodyType) {
        vehicleQryInstance.andWhere("vehicle.bodyType LIKE :bodyType", {
          bodyType: `${params?.filters?.bodyType}%`,
        });
      }
      if (params?.filters?.bodyTypeEnglish) {
        vehicleQryInstance.andWhere(
          "vehicle.bodyTypeEnglish LIKE :bodyTypeEnglish",
          { bodyTypeEnglish: `${params?.filters?.bodyTypeEnglish}%` }
        );
      }
      if (params?.filters?.majorColor) {
        vehicleQryInstance.andWhere("vehicle.majorColor LIKE :majorColor", {
          majorColor: `${params?.filters?.majorColor}%`,
        });
      }
      if (params?.filters?.majorColorEnglish) {
        vehicleQryInstance.andWhere(
          "vehicle.majorColorEnglish LIKE :majorColorEnglish",
          { majorColorEnglish: `${params?.filters?.majorColorEnglish}%` }
        );
      }
      if (typeof params?.filters?.modelYear === "number") {
        vehicleQryInstance.andWhere("vehicle.modelYear = :modelYear", {
          modelYear: params?.filters?.modelYear,
        });
      }
      if (typeof params?.filters?.vehicleCapacity === "number") {
        vehicleQryInstance.andWhere(
          "vehicle.vehicleCapacity = :vehicleCapacity",
          { vehicleCapacity: params?.filters?.vehicleCapacity }
        );
      }
      if (params?.filters?.vehicleMaker) {
        vehicleQryInstance.andWhere("vehicle.vehicleMaker LIKE :vehicleMaker", {
          vehicleMaker: `${params?.filters?.vehicleMaker}%`,
        });
      }
      if (params?.filters?.vehicleMakerEnglish) {
        vehicleQryInstance.andWhere(
          "vehicle.vehicleMakerEnglish LIKE :vehicleMakerEnglish",
          { vehicleMakerEnglish: `${params?.filters?.vehicleMakerEnglish}%` }
        );
      }
      if (params?.filters?.vehicleModel) {
        vehicleQryInstance.andWhere("vehicle.vehicleModel LIKE :vehicleModel", {
          vehicleModel: `${params?.filters?.vehicleModel}%`,
        });
      }
      if (params?.filters?.vehicleModelEnglish) {
        vehicleQryInstance.andWhere(
          "vehicle.vehicleModelEnglish LIKE :vehicleModelEnglish",
          { vehicleModelEnglish: `${params?.filters?.vehicleModelEnglish}%` }
        );
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0])
        );
        vehicleQryInstance.andWhere("vehicle.createdAt >= :fromDate", {
          fromDate,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setUTCHours(23, 59, 59, 999)
          )
        );
        vehicleQryInstance.andWhere("vehicle.createdAt <= :toDate", { toDate });
      }
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = VehicleListSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === "desc" ? "DESC" : "ASC";
          vehicleQryInstance.orderBy(sortField, sortOrder);
        }
      }
      vehicleQryInstance.skip(params.skip);
      vehicleQryInstance.take(params.take);
      const [result, total] = await vehicleQryInstance.getManyAndCount();

      const totalCount: number = total;
      const vehicle: any = result;

      return ResponseData.success({ vehicle, totalCount });
    } catch (err) {
      this.logger.error(`findAll -> error -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async findOne(id: string) {
    try {
      const vehicle = await this.vehicleRepository.findOne({
        join: {
          alias: "vehicle",
          leftJoinAndSelect: {
            cab: "vehicle.cab",
          },
        },
        where: {
          id: id,
        },
      });
      if (!vehicle) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.CAR_INFO_NOT_FOUND
        );
      }
      return ResponseData.success(vehicle);
    } catch (err) {
      this.logger.error(`findOne -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    try {
      await this.vehicleRepository.update(id, updateVehicleDto);
      const vehicle = await this.findOne(id);
      return vehicle;
    } catch (err) {
      this.logger.error(`update -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }

  async remove(id: string) {
    try {
      const vehicle = await this.findOne(id);
      if (vehicle.statusCode == HttpStatus.OK) {
        await this.vehicleRepository.delete(id);
      }
      return vehicle;
    } catch (err) {
      this.logger.error(`remove -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG
      );
    }
  }
}

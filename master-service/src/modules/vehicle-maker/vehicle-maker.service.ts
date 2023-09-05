import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseHandler } from 'src/helpers/responseHandler';

import { VehicleMakerRepository } from './repositories/vehicle-maker.repository';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { RedisHandler } from 'src/helpers/redis-handler';
import {
  VehicleMasterInfoDto,
  UpdateVehicleMakerDto,
  AddVehicleMakerDto,
} from './dto/vehicle-maker.dto';
import { VehicleModelService } from '../vehicle-model/vehicle-model.service';

@Injectable()
export class VehicleMakerService {
  private readonly logger = new LoggerHandler(
    VehicleMakerService.name,
  ).getInstance();

  constructor(
    @InjectRepository(VehicleMakerRepository)
    private vehicleMakerRepository: VehicleMakerRepository,
    private vehicleModelService?: VehicleModelService,
  ) {}

  async addVehicleMaker(body: AddVehicleMakerDto) {
    try {
      const response = this.vehicleMakerRepository.create({
        maker: body.maker,
        makerEnglish: body?.makerEnglish,
        status: body?.status,
        makerIcon: body?.makerIcon,
      });
      this.logger.log(`addVehicleMaker -> ${JSON.stringify(response)}`);
      await this.vehicleMakerRepository.save(response);
      return ResponseHandler.success(response);
    } catch (err) {
      this.logger.error(`addVehicleMaker -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST, err.message);
    }
  }

  async findAll() {
    try {
      const fields = [
        'vehiclemakers.id',
        'vehiclemakers.maker',
        'vehiclemakers.makerEnglish',
        'vehiclemakers.status',
        'vehiclemakers.makerIcon',
        'vehiclemakers.createdAt',
        'vehiclemakers.updatedAt',
      ];
      const vehicleMakerInstance =
        this.vehicleMakerRepository.createQueryBuilder('vehiclemakers');
      vehicleMakerInstance.select(fields);
      const [result, total] = await vehicleMakerInstance.getManyAndCount();
      const totalCount: number = total;
      const makers: any = result;
      this.logger.debug('[findAll] get list with count: ' + totalCount);
      return ResponseHandler.success({ makers, totalCount });
    } catch (err) {
      this.logger.error('[findAll] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(maker: string) {
    try {
      const fields = ['vehiclemakers.makerIcon'];
      const vehicleMakerInstance =
        this.vehicleMakerRepository.createQueryBuilder('vehiclemakers');
      vehicleMakerInstance
        .select(fields) //.where({ maker: maker });
        .where('vehiclemakers.maker LIKE :maker', {
          maker: `%${maker}%`,
        });
      const result = await vehicleMakerInstance.getOne();
      if (result) {
        return ResponseHandler.success(result);
      } else {
        return ResponseHandler.error(HttpStatus.NOT_FOUND);
      }
    } catch (err) {
      this.logger.error('[findOne] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findVehicleMasterInfo(params: VehicleMasterInfoDto) {
    try {
      const vehicleMakerInstance =
        this.vehicleMakerRepository.createQueryBuilder('vehiclemakers');
      vehicleMakerInstance.select([
        'vehiclemakers.id',
        'vehiclemakers.makerIcon',
        'vehiclemakers.makerEnglish',
      ]);
      vehicleMakerInstance.where('vehiclemakers.maker LIKE :maker', {
        maker: `%${params.vehicleMaker}%`,
      });
      // .where('vehiclemakers.maker = :maker',
      // {
      //   maker: params.vehicleMaker,
      // });
      let makerResult;
      makerResult = await vehicleMakerInstance.getOne();
      if (!makerResult) {
        //creating maker
        await this.addVehicleMaker({
          maker: params.vehicleMaker,
          status: 1,
        });
        makerResult = await this.findOne(params?.vehicleMaker);
        makerResult = makerResult?.date;
      }
      const modelResult = await this.vehicleModelService.findVehicleModelInfo({
        vehicleModel: params.vehicleModel,
        vehicleMakerId: makerResult.id,
      });
      const result = { ...makerResult, ...modelResult.data };

      this.logger.debug(
        '[findVehicleMaterInfo] get list: ' + JSON.stringify(result),
      );
      return ResponseHandler.success(result);
    } catch (err) {
      this.logger.error('[findVehicleMaterInfo] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async updateVehicleMaker(body: UpdateVehicleMakerDto) {
    try {
      this.logger.log(`updateVehicleMaker -> ${JSON.stringify(body)}`);
      const { id, maker, makerEnglish } = body;
      await this.vehicleMakerRepository.update(id, body);
      const response = await this.vehicleMakerRepository.findOne({ id });
      return ResponseHandler.success(response);
    } catch (err) {
      this.logger.error(`updateVehicleMaker -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async deleteVehicleMaker(id: string) {
    try {
      this.logger.log(`deleteVehicleMaker -> ${id}`);
      const response = await this.vehicleMakerRepository.delete({ id });
      return ResponseHandler.success({});
    } catch (err) {
      this.logger.error(`deleteVehicleMaker -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }
}

import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseHandler } from 'src/helpers/responseHandler';

import { VehicleClassRepository } from './repositories/vehicle-class.repository';

import { LoggerHandler } from 'src/helpers/logger-handler';
import { RedisHandler } from 'src/helpers/redis-handler';
import {
  AddVehicleClassDto,
  UpdateVehicleClassDto,
} from './dto/vehicle-class.dto';

@Injectable()
export class VehicleClassService {
  private readonly logger = new LoggerHandler(
    VehicleClassService.name,
  ).getInstance();

  constructor(
    @InjectRepository(VehicleClassRepository)
    private vehicleClassRepository: VehicleClassRepository,
    private redisHandler: RedisHandler,
  ) {}

  async addVehicleClass(body: AddVehicleClassDto) {
    try {
      const response = this.vehicleClassRepository.create({
        name: body.name,
        description: body.description,
      });
      this.logger.log(`addVehicleClass -> ${JSON.stringify(response)}`);
      await this.vehicleClassRepository.save(response);
      return ResponseHandler.success(response);
    } catch (err) {
      this.logger.error(`addVehicleClass -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    try {
      const fields = [
        'vehicleclass.id',
        'vehicleclass.name',
        'vehicleclass.description',
        'vehicleclass.createdAt',
        'vehicleclass.updatedAt',
      ];
      const vehicleClassInstance =
        this.vehicleClassRepository.createQueryBuilder('vehicleClass');
      vehicleClassInstance.select(fields);
      const [result, total] = await vehicleClassInstance.getManyAndCount();
      const totalCount: number = total;
      const vehileClasses: any = result;
      this.logger.debug('[findAll] get list with count: ' + totalCount);
      return ResponseHandler.success({ vehileClasses, totalCount });
    } catch (err) {
      this.logger.error('[findAll] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  /*async findVehicleClassInfo(params){
        try {
         const vehicleClassInstance = this.vehicleClassRepository.createQueryBuilder("vehicleClass");
         vehicleClassInstance.select(['vehicleClass.name']);
         vehicleClassInstance.where("vehicleClass.name = :name",{name:params.name})
         const classResult = await vehicleClassInstance.getOne();
         this.logger.debug("[findVehicleClassInfo] get list: "+JSON.stringify(classResult))
          return ResponseHandler.success(classResult);
        } catch (err) {
          this.logger.error("[findVehicleMaterInfo] error " + err.message)
          return ResponseHandler.error(HttpStatus.BAD_REQUEST);
        }
      }*/

  async updateVehicleClass(body: UpdateVehicleClassDto) {
    try {
      this.logger.log(`updateVehicleClass -> ${JSON.stringify(body)}`);
      const { id, name, description } = body;
      await this.vehicleClassRepository.update(id, body);
      const response = await this.vehicleClassRepository.findOne({ id });
      return ResponseHandler.success(response);
    } catch (err) {
      this.logger.error(`updateVehicleClass -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async deleteVehicleClass(id: string) {
    try {
      this.logger.log(`deleteVehicleClass -> ${id}`);
      const response = await this.vehicleClassRepository.delete({ id });
      return ResponseHandler.success({});
    } catch (err) {
      this.logger.error(`deleteVehicleClass -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }
}

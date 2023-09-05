import { Controller } from '@nestjs/common';

import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { ADD_VEHICLE_CLASS, DELETE_VEHICLE_CLASS, GET_ALL_VEHICLE_CLASS, UPDATE_VEHICLE_CLASS } from 'src/constants/kafka-constant';
import {VehicleClassService} from './vehicle-class.service'
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('vehicle-class')
export class VehicleClassController {
    private readonly logger = new LoggerHandler(VehicleClassController.name).getInstance();

    constructor(private VehicleClassService: VehicleClassService) {}

    @MessagePattern(ADD_VEHICLE_CLASS, Transport.TCP)
    async addVehicleClass(@Payload() payload) {
      const message = { value: JSON.parse(payload) };
      this.logger.log(`tcp::addVehicleClass::${ADD_VEHICLE_CLASS}::recv -> ${JSON.stringify(message.value)}`);
      return await this.VehicleClassService.addVehicleClass(message.value);
    }
  
    @MessagePattern(GET_ALL_VEHICLE_CLASS, Transport.TCP)
    async findAllVehicleClass(@Payload() payload) {
      const message = { value: JSON.parse(payload) };
      this.logger.debug(`tcp::vehicle-class::${GET_ALL_VEHICLE_CLASS}::recv -> ${JSON.stringify(message.value)}`);
      const status: number = message.value?.status || null;
      return await this.VehicleClassService.findAll();
    }

    @MessagePattern(UPDATE_VEHICLE_CLASS, Transport.TCP)
    async updateVehicleClass(@Payload() payload) {
      const message = { value: JSON.parse(payload) };
      this.logger.log(`tcp::updateVehicleClass::${UPDATE_VEHICLE_CLASS}::recv -> ${JSON.stringify(message.value)}`);
      return await this.VehicleClassService.updateVehicleClass(message.value);
    }

    @MessagePattern(DELETE_VEHICLE_CLASS, Transport.TCP)
    async deleteVehicleClass(@Payload() payload) {
      const message = { value: JSON.parse(payload) };
      this.logger.log(`tcp::deleteVehicleClass::${DELETE_VEHICLE_CLASS}::recv -> ${JSON.stringify(message.value)}`);
      return await this.VehicleClassService.deleteVehicleClass(message.value?.id);
    }
}

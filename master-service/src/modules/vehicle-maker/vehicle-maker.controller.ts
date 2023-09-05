import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';

import {
  GET_ALL_VEHICLE_MAKERS,
  GET_VEHICLE_MASTER_INFO,
  UPDATE_VEHICLE_MAKER,
  DELETE_VEHICLE_MAKER,
  ADD_VEHICLE_MAKER,
  GET_VEHICLE_MAKERS,
} from 'src/constants/kafka-constant';
import { VehicleMakerService } from './vehicle-maker.service';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('vehicle-maker')
export class VehicleMakerController {
  private readonly logger = new LoggerHandler(
    VehicleMakerController.name,
  ).getInstance();

  constructor(private VehicleMakerService: VehicleMakerService) {}

  @MessagePattern(ADD_VEHICLE_MAKER, Transport.TCP)
  async addVehicleMaker(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::addVehicleMaker::${ADD_VEHICLE_MAKER}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.VehicleMakerService.addVehicleMaker(message.value);
  }

  @MessagePattern(GET_VEHICLE_MAKERS, Transport.TCP)
  async findVehicleMakers(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(
      `tcp::vehicle-maker::${GET_VEHICLE_MAKERS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.VehicleMakerService.findOne(message.value.maker);
  }

  @MessagePattern(GET_ALL_VEHICLE_MAKERS, Transport.TCP)
  async findAllVehicleMakers(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(
      `tcp::vehicle-maker::${GET_ALL_VEHICLE_MAKERS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.VehicleMakerService.findAll();
  }

  @MessagePattern(UPDATE_VEHICLE_MAKER, Transport.TCP)
  async updateVehicleMaker(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::updateVehicleMaker::${UPDATE_VEHICLE_MAKER}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.VehicleMakerService.updateVehicleMaker(message.value);
  }

  @MessagePattern(DELETE_VEHICLE_MAKER, Transport.TCP)
  async deleteVehicleMaker(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::deleteVehicleMaker::${DELETE_VEHICLE_MAKER}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.VehicleMakerService.deleteVehicleMaker(message.value?.id);
  }

  @MessagePattern(GET_VEHICLE_MASTER_INFO, Transport.TCP)
  async findVehicleMaterInfo(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(
      `tcp::vehicle-master-info::${GET_VEHICLE_MASTER_INFO}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.VehicleMakerService.findVehicleMasterInfo(message?.value);
  }
}

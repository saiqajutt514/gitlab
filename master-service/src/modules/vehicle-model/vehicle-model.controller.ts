import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';

import {
  ADD_VEHICLE_MODEL,
  DELETE_VEHICLE_MODEL,
  GET_ALL_UNASSIGNED_VEHICLE_MODELS,
  GET_ALL_VEHICLE_MODELS,
  UPDATE_VEHICLE_MODEL,
} from 'src/constants/kafka-constant';
import { VehicleModelService } from './vehicle-model.service';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('vehicle-model')
export class VehicleModelController {
  private readonly logger = new LoggerHandler(
    VehicleModelController.name,
  ).getInstance();

  constructor(private VehicleModelService: VehicleModelService) {}

  @MessagePattern(ADD_VEHICLE_MODEL, Transport.TCP)
  async addVehicleModel(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::addVehicleModel::${ADD_VEHICLE_MODEL}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.VehicleModelService.addVehicleModel(message.value);
  }

  @MessagePattern(GET_ALL_VEHICLE_MODELS, Transport.TCP)
  async findAllVehicleModles(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(
      `tcp::vehicle-model::${GET_ALL_VEHICLE_MODELS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const status: number = message.value?.status || null;
    return await this.VehicleModelService.findAll();
  }

  @MessagePattern(GET_ALL_UNASSIGNED_VEHICLE_MODELS, Transport.TCP)
  async findAllUnAssigned(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(
      `tcp::vehicle-model::${GET_ALL_UNASSIGNED_VEHICLE_MODELS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const status: number = message.value?.status || null;
    return await this.VehicleModelService.findAllUnAssigned();
  }

  @MessagePattern(UPDATE_VEHICLE_MODEL, Transport.TCP)
  async updateVehicleModel(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::updateVehicleModel::${UPDATE_VEHICLE_MODEL}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.VehicleModelService.updateVehicleModel(message.value);
  }

  @MessagePattern(DELETE_VEHICLE_MODEL, Transport.TCP)
  async deleteVehicleModel(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::deleteVehicleModel::${DELETE_VEHICLE_MODEL}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.VehicleModelService.deleteVehicleModel(message.value?.id);
  }
}

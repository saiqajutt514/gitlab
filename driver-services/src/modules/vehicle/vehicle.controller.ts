import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_VEHICLE,
  UPDATE_VEHICLE,
  DELETE_VEHICLE,
  GET_ALL_VEHICLES,
  GET_VEHICLE_DETAIL,
} from "src/constants/kafka-constant";

import { VehicleService } from "./vehicle.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { LoggerHandler } from "src/helpers/logger-handler";

@Controller("vehicle")
export class VehicleController {
  private readonly logger = new LoggerHandler(
    VehicleController.name
  ).getInstance();

  constructor(private readonly vehicleService: VehicleService) {}

  @MessagePattern(CREATE_VEHICLE, Transport.TCP)
  async create(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${CREATE_VEHICLE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const data: CreateVehicleDto = message.value;
    return await this.vehicleService.create(data);
  }

  @MessagePattern(GET_ALL_VEHICLES, Transport.TCP)
  async findAll(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_ALL_VEHICLES}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    return await this.vehicleService.findAll(message?.value?.criteria);
  }

  @MessagePattern(GET_VEHICLE_DETAIL, Transport.TCP)
  async findOne(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_VEHICLE_DETAIL}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    return await this.vehicleService.findOne(id);
  }

  @MessagePattern(UPDATE_VEHICLE, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${UPDATE_VEHICLE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    const data: UpdateVehicleDto = message.value?.data;
    return await this.vehicleService.update(id, data);
  }

  @MessagePattern(DELETE_VEHICLE, Transport.TCP)
  async remove(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${DELETE_VEHICLE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    return await this.vehicleService.remove(id);
  }
}

import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_CAR_INFO,
  UPDATE_CAR_INFO,
  DELETE_CAR_INFO,
  GET_ALL_CARS_INFO,
  GET_CAR_INFO_DETAIL,
} from "src/constants/kafka-constant";

import { CarInfoService } from "./car-info.service";
import { CreateCarInfoDto } from "./dto/create-car-info.dto";
import { UpdateCarInfoDto } from "./dto/update-car-info.dto";
import { LoggerHandler } from "src/helpers/logger-handler";

@Controller("car-info")
export class CarInfoController {
  private readonly logger = new LoggerHandler(
    CarInfoController.name
  ).getInstance();
  constructor(private readonly carInfoService: CarInfoService) {}

  @MessagePattern(CREATE_CAR_INFO, Transport.TCP)
  async create(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${CREATE_CAR_INFO}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const data: CreateCarInfoDto = message.value;
    return await this.carInfoService.create(data);
  }

  @MessagePattern(GET_ALL_CARS_INFO, Transport.TCP)
  async findAll(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_ALL_CARS_INFO}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    return await this.carInfoService.findAll(message?.value?.criteria);
  }

  @MessagePattern(GET_CAR_INFO_DETAIL, Transport.TCP)
  async findOne(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_CAR_INFO_DETAIL}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    return await this.carInfoService.findOne(id);
  }

  @MessagePattern(UPDATE_CAR_INFO, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${UPDATE_CAR_INFO}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    const data: UpdateCarInfoDto = message.value?.data;
    return await this.carInfoService.update(id, data);
  }

  @MessagePattern(DELETE_CAR_INFO, Transport.TCP)
  async remove(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${DELETE_CAR_INFO}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    return await this.carInfoService.remove(id);
  }
}

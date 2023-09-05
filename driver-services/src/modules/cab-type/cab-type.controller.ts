import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_CAB_TYPE,
  UPDATE_CAB_TYPE,
  DELETE_CAB_TYPE,
  GET_ALL_CAB_TYPES,
  GET_CAB_TYPE_DETAIL,
  UPDATE_CAB_TYPE_ORDER,
} from "src/constants/kafka-constant";

import { CabTypeService } from "./cab-type.service";
import {
  CreateCabTypeDto,
  UpdateCabTypeOrderDto,
} from "./dto/create-cab-type.dto";
import { UpdateCabTypeDto } from "./dto/update-cab-type.dto";
import { LoggerHandler } from "src/helpers/logger-handler";

@Controller("cab-type")
export class CabTypeController {
  private readonly logger = new LoggerHandler(
    CabTypeController.name
  ).getInstance();
  constructor(private readonly cabTypeService: CabTypeService) {}

  @MessagePattern(CREATE_CAB_TYPE, Transport.TCP)
  async create(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${CREATE_CAB_TYPE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const data: CreateCabTypeDto = message.value;
    return await this.cabTypeService.create(data);
  }

  @MessagePattern(GET_ALL_CAB_TYPES, Transport.TCP)
  async findAll(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_ALL_CAB_TYPES}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const query = message.value?.query;
    const options = message.value?.options ?? {};
    return await this.cabTypeService.findAll(query, options);
  }

  @MessagePattern(GET_CAB_TYPE_DETAIL, Transport.TCP)
  async findOne(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_CAB_TYPE_DETAIL}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    const query = message.value?.query;
    return await this.cabTypeService.findOne(id, query);
  }

  @MessagePattern(UPDATE_CAB_TYPE, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${UPDATE_CAB_TYPE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    const data: UpdateCabTypeDto = message.value?.data;
    return await this.cabTypeService.update(id, data);
  }

  @MessagePattern(DELETE_CAB_TYPE, Transport.TCP)
  async remove(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${DELETE_CAB_TYPE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    return await this.cabTypeService.remove(id);
  }

  @MessagePattern(UPDATE_CAB_TYPE_ORDER, Transport.TCP)
  async updateCabTypeOrder(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${UPDATE_CAB_TYPE_ORDER}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const data: UpdateCabTypeOrderDto = message?.value;
    return await this.cabTypeService.updateCabTypeOrder(data);
  }
}

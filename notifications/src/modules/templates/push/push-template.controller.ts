import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_PUSH_TEMPLATE,
  UPDATE_PUSH_TEMPLATE,
  DELETE_PUSH_TEMPLATE,
  GET_ALL_PUSH_TEMPLATES,
  GET_PUSH_TEMPLATE_DETAIL,
  UPDATE_PUSH_TEMPLATE_STATUS
} from 'src/constants/kafka-constant';

import { PushTemplateService } from './push-template.service';
import { CreatePushTemplateDto } from './dto/create-push-template.dto';
import { UpdatePushTemplateDto } from './dto/update-push-template.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('push_template')
export class PushTemplateController {
  constructor(private readonly pushTemplateService: PushTemplateService) { }

  private readonly logger = new LoggerHandler(PushTemplateController.name).getInstance();

  @MessagePattern(CREATE_PUSH_TEMPLATE, Transport.TCP)
  async create(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${CREATE_PUSH_TEMPLATE}::recv -> ${JSON.stringify(message.value)}`);
    const data: CreatePushTemplateDto = message.value;
    return await this.pushTemplateService.create(data);
  }

  @MessagePattern(GET_ALL_PUSH_TEMPLATES, Transport.TCP)
  async findAll() {
    this.logger.log(`kafka::notifications::${GET_ALL_PUSH_TEMPLATES}::recv -> {}`);
    return await this.pushTemplateService.findAll();
  }

  @MessagePattern(GET_PUSH_TEMPLATE_DETAIL, Transport.TCP)
  async findOne(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${GET_PUSH_TEMPLATE_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id
    return await this.pushTemplateService.findOne(id);
  }

  @MessagePattern(UPDATE_PUSH_TEMPLATE, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${UPDATE_PUSH_TEMPLATE}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id
    const data: UpdatePushTemplateDto = message.value.data
    return await this.pushTemplateService.update(id, data);
  }

  @MessagePattern(UPDATE_PUSH_TEMPLATE_STATUS, Transport.TCP)
  async updateStatus(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${UPDATE_PUSH_TEMPLATE_STATUS}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id;
    const status: boolean = message.value.status;
    return await this.pushTemplateService.updateStatus(id, status);
  }

  @MessagePattern(DELETE_PUSH_TEMPLATE, Transport.TCP)
  async remove(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${DELETE_PUSH_TEMPLATE}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id
    return await this.pushTemplateService.remove(id);
  }

}

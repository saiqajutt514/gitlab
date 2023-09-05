import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_SMS_TEMPLATE,
  UPDATE_SMS_TEMPLATE,
  DELETE_SMS_TEMPLATE,
  GET_ALL_SMS_TEMPLATES,
  GET_SMS_TEMPLATE_DETAIL,
  UPDATE_SMS_TEMPLATE_STATUS
} from 'src/constants/kafka-constant';

import { SmsTemplateService } from './sms-template.service';
import { CreateSmsTemplateDto } from './dto/create-sms-template.dto';
import { UpdateSmsTemplateDto } from './dto/update-sms-template.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('sms_template')
export class SmsTemplateController {
  constructor(private readonly smsTemplateService: SmsTemplateService) { }

  private readonly logger = new LoggerHandler(SmsTemplateController.name).getInstance();

  @MessagePattern(CREATE_SMS_TEMPLATE, Transport.TCP)
  async create(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${CREATE_SMS_TEMPLATE}::recv -> ${JSON.stringify(message.value)}`);
    const data: CreateSmsTemplateDto = message.value;
    return await this.smsTemplateService.create(data);
  }

  @MessagePattern(GET_ALL_SMS_TEMPLATES, Transport.TCP)
  async findAll() {
    this.logger.log(`kafka::notifications::${GET_ALL_SMS_TEMPLATES}::recv -> {}`);
    return await this.smsTemplateService.findAll();
  }

  @MessagePattern(GET_SMS_TEMPLATE_DETAIL, Transport.TCP)
  async findOne(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${GET_SMS_TEMPLATE_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id
    return await this.smsTemplateService.findOne(id);
  }

  @MessagePattern(UPDATE_SMS_TEMPLATE, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${UPDATE_SMS_TEMPLATE}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id
    const data: UpdateSmsTemplateDto = message.value.data
    return await this.smsTemplateService.update(id, data);
  }

  @MessagePattern(DELETE_SMS_TEMPLATE, Transport.TCP)
  async remove(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${DELETE_SMS_TEMPLATE}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id
    return await this.smsTemplateService.remove(id);
  }

  @MessagePattern(UPDATE_SMS_TEMPLATE_STATUS, Transport.TCP)
  async updateStatus(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${UPDATE_SMS_TEMPLATE_STATUS}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id;
    const status: boolean = message.value.status;
    return await this.smsTemplateService.updateStatus(id, status);
  }
}

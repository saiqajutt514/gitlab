import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_EMAIL_TEMPLATE,
  UPDATE_EMAIL_TEMPLATE,
  DELETE_EMAIL_TEMPLATE,
  GET_ALL_EMAIL_TEMPLATES,
  GET_EMAIL_TEMPLATE_DETAIL,
  UPDATE_EMAIL_TEMPLATE_STATUS
} from 'src/constants/kafka-constant';

import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('email_template')
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) { }

  private readonly logger = new LoggerHandler(EmailTemplateController.name).getInstance();

  @MessagePattern(CREATE_EMAIL_TEMPLATE, Transport.TCP)
  async create(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${CREATE_EMAIL_TEMPLATE}::recv -> ${JSON.stringify(message.value)}`);
    const data: CreateEmailTemplateDto = message.value;
    return await this.emailTemplateService.create(data);
  }

  @MessagePattern(GET_ALL_EMAIL_TEMPLATES, Transport.TCP)
  async findAll() {
    this.logger.log(`kafka::notifications::${GET_ALL_EMAIL_TEMPLATES}::recv -> {}`);
    return await this.emailTemplateService.findAll();
  }

  @MessagePattern(GET_EMAIL_TEMPLATE_DETAIL, Transport.TCP)
  async findOne(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${GET_EMAIL_TEMPLATE_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id
    return await this.emailTemplateService.findOne(id);
  }

  @MessagePattern(UPDATE_EMAIL_TEMPLATE, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${UPDATE_EMAIL_TEMPLATE}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id
    const data: UpdateEmailTemplateDto = message.value.data
    return await this.emailTemplateService.update(id, data);
  }

  @MessagePattern(DELETE_EMAIL_TEMPLATE, Transport.TCP)
  async remove(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${DELETE_EMAIL_TEMPLATE}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id
    return await this.emailTemplateService.remove(id);
  }

  @MessagePattern(UPDATE_EMAIL_TEMPLATE_STATUS, Transport.TCP)
  async updateStatus(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${UPDATE_EMAIL_TEMPLATE_STATUS}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value.id;
    const status: boolean = message.value.status;
    return await this.emailTemplateService.updateStatus(id, status);
  }

}

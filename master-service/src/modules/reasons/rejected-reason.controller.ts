import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_REJECTED_REASON,
  GET_ALL_REJECTED_REASONS,
  GET_REJECTED_REASON_DETAIL,
  UPDATE_REJECTED_REASON,
  DELETE_REJECTED_REASON,
} from 'src/constants/kafka-constant';

import { RejectedReasonService } from './rejected-reason.service';
import { RejectedReasonDto, UpdateRejectedReasonDto } from './dto/rejected-reason.dto';
import { REASON_TYPE } from './enum/rejected-reason.enum';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('rejected-reason')
export class RejectedReasonController {
  private readonly logger = new LoggerHandler(RejectedReasonController.name).getInstance();
  constructor(private rejectedReasonService: RejectedReasonService) {}

  @MessagePattern(CREATE_REJECTED_REASON, Transport.TCP)
  async createReasonHandler(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::rejected-reason::${CREATE_REJECTED_REASON}::recv -> ${JSON.stringify(message.value)}`);
    const params: RejectedReasonDto = message.value;
    return await this.rejectedReasonService.create(params);
  }

  @MessagePattern(GET_ALL_REJECTED_REASONS, Transport.TCP)
  async findAllReasonWithType(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::rejected-reason::${GET_ALL_REJECTED_REASONS}::recv -> ${JSON.stringify(message.value)}`);
    const type: REASON_TYPE = message.value?.type;
    return await this.rejectedReasonService.findAll(type);
  }

  @MessagePattern(GET_REJECTED_REASON_DETAIL, Transport.TCP)
  async findOneReason(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::rejected-reason::${GET_REJECTED_REASON_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.rejectedReasonService.findOne(id);
  }

  @MessagePattern(UPDATE_REJECTED_REASON, Transport.TCP)
  async updateReason(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::rejected-reason::${UPDATE_REJECTED_REASON}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    const params: UpdateRejectedReasonDto = message.value?.data;
    return await this.rejectedReasonService.update(id, params);
  }

  @MessagePattern(DELETE_REJECTED_REASON, Transport.TCP)
  async removeReason(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::rejected-reason::${DELETE_REJECTED_REASON}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.rejectedReasonService.remove(id);
  }

}

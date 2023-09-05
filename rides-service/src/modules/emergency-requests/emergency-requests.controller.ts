import { Controller, Logger } from '@nestjs/common';

import { MessagePattern, Payload } from '@nestjs/microservices';

import { Transport } from "@nestjs/microservices";

import { EmergencyRequestsService } from './emergency-requests.service';

import { GET_ALL_EMERGENCY_REQUESTS, GET_EMERGENCY_REQUEST_DETAIL, ADD_EMERGENCY_REQUEST, UPDATE_EMERGENCY_REQUEST } from './constants/kafka-constants';

import { CreateEmergencyRequestDto, UpdateEmergencyRequestDto, ListSearchSortDto } from './interface/emergency-requests.interface';

import { LoggerHandler } from 'src/helpers/logger.handler';

@Controller('emergency-requests')
export class EmergencyRequestsController {

  constructor( private emergencyRequestService: EmergencyRequestsService) {}

  private logger = new LoggerHandler(EmergencyRequestsController.name).getInstance();

  @MessagePattern(GET_ALL_EMERGENCY_REQUESTS, Transport.TCP)
  async getAllEmergencyRequests(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_ALL_EMERGENCY_REQUESTS}::recv -> ${JSON.stringify(message)}`);
    message = JSON.parse(message);
    return await this.emergencyRequestService.findAll(message);
  };

  @MessagePattern(GET_EMERGENCY_REQUEST_DETAIL, Transport.TCP)
  async getEmergencyRequestDetail(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_EMERGENCY_REQUEST_DETAIL}::recv -> ${JSON.stringify(message)}`);
    message = JSON.parse(message);
    return await this.emergencyRequestService.findOne(message?.id);
  };


  @MessagePattern(ADD_EMERGENCY_REQUEST, Transport.TCP)
  async createEmergencyRequest(@Payload() message) {
    this.logger.log(`kafka::trip::${ADD_EMERGENCY_REQUEST}::recv -> ${message}`);
    const data: CreateEmergencyRequestDto = JSON.parse(message);
    return await this.emergencyRequestService.create(data);
  };

  @MessagePattern(UPDATE_EMERGENCY_REQUEST, Transport.TCP)
  async updateEmergencyRequest(@Payload() message) {
    this.logger.log(`kafka::trip::${UPDATE_EMERGENCY_REQUEST}::recv -> ${message}`);
    message = JSON.parse(message);
    const id: string = message.id;
    const data: UpdateEmergencyRequestDto = message.data;
    return await this.emergencyRequestService.update(id, data);
  };

}

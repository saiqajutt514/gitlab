import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { EwalletService } from './ewallet.service';

import { FETCH_CAR_INFO, GET_USER_DETAILS } from 'src/constants/kafka-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('ewallet')
export class EwalletController {
  constructor(private walletService: EwalletService) { }

  private readonly logger = new LoggerHandler(EwalletController.name).getInstance();

  @MessagePattern(GET_USER_DETAILS, Transport.TCP)
  async userLogin(@Payload() message) {
    this.logger.log(`[userLogin] -> ${GET_USER_DETAILS} | ${message}`);
    message = JSON.parse(message);
    return await this.walletService.getUserDetail(message);
  }

  @MessagePattern(FETCH_CAR_INFO, Transport.TCP)
  async getCarInfo(@Payload() message) {
    this.logger.log(`kafka::auth::${FETCH_CAR_INFO}::recv -> ${message}`);
    message = JSON.parse(message);
    return await this.walletService.getCarInfo(message);
  }
}

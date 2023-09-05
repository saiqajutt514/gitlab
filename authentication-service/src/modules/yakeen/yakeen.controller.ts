import { Controller } from '@nestjs/common';
import { MessagePattern, Transport, Payload } from '@nestjs/microservices';
import {
  ALIEN_ADDRESS_INFO,
  ALIEN_DL_INFO,
  CAR_INFO_BY_SEQUENCE,
  CITIZEN_DL_INFO,
  CITIZEN_INFO,
} from 'src/constants/kafka-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { YakeenService } from './yakeen.service';

@Controller('yakeen')
export class YakeenController {
  constructor(private YakeenService: YakeenService) {}

  private readonly logger = new LoggerHandler(
    YakeenController.name,
  ).getInstance();

  @MessagePattern(CAR_INFO_BY_SEQUENCE, Transport.TCP)
  async CAR_INFO_BY_SEQUENCE(@Payload() message) {
    this.logger.log(
      `[CarInfoBySequence] -> ${CAR_INFO_BY_SEQUENCE} | ${message}`,
    );
    message = JSON.parse(message);
    return await this.YakeenService.CarInfoBySequence(message);
  }
}

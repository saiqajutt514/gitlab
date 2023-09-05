import { Controller } from '@nestjs/common';
import { MessagePattern , Transport, Payload} from '@nestjs/microservices';
import { SEND_SMS } from 'src/constants/kafka-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {

    constructor( private SmsService: SmsService){}

    private readonly logger = new LoggerHandler(SmsController.name).getInstance();

    @MessagePattern(SEND_SMS,Transport.TCP )
    async sendSms(@Payload() message) {
      this.logger.log(`[sendSms] -> ${SEND_SMS} | ${message}`);
      message = JSON.parse(message);
      return await this.SmsService.sendSms(message);
    }
}

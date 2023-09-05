import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { SmsNotificationLogRepository } from './repositories/sms-notification-log.repository';
import { SmsNotificationLogDto } from './dto/sms-notification-log.dto';
import { SendSMSNotificationDto, NOTIFY_STATUS } from './enum';
import { getTimestamp } from 'src/utils/get-timestamp';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { EwalletService } from './ewallet.service';

@Injectable()
export class SendSMSNotificationService {

  private readonly logger = new LoggerHandler(SendSMSNotificationService.name).getInstance();

  constructor(
    private smsNotificationLogRepository: SmsNotificationLogRepository,
    private ewalletService: EwalletService
  ) {
  }

  async sendSMS(params: SendSMSNotificationDto) {
    try {
      const apiParams = {
        type: ["sms"],
        mobileNo: params.mobileNo,
        text: params.message
      }
      this.logger.log(`[sendWalletMail] calling wallet API`)
      const apiResponse = await this.ewalletService.sendNotification(apiParams);
      if (apiResponse.statusCode !== HttpStatus.OK) {
        this.logSMS(params, { message: apiResponse.message }, 0);
      } else {
        this.logSMS(params, { message: apiResponse.data.message }, 1);
      }
      
    } catch (err) {
      // Print errors
    }
  }

  logSMS(params, response, status) {
    if (params.isLoggable === false) {
      this.logger.log(`logs disabled for this sms template | ${params?.message}`);
      return;
    }
    try {
      // Log push notification details
      const sentStatus = status||NOTIFY_STATUS.FAILED;
      const notificationData: SmsNotificationLogDto = {
        externalId: params?.externalId,
        mobileNo: params?.mobileNo,
        message: params?.message,
        response: JSON.stringify(response),
        sentTime: getTimestamp(),
        status: sentStatus,
      }
      const notificationLog = this.smsNotificationLogRepository.create(notificationData);
      this.smsNotificationLogRepository.save(notificationLog);
    } catch(err) {
      this.logger.error(`sms log has errors. ${JSON.stringify(err.message)}`);
    }
  }

}
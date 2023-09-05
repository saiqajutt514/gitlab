import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
    GET_NOTIFICATIONS,
    SEND_NOTIFICATION,
    SEND_EMAIL_NOTIFICATION,
    SEND_PUSH_NOTIFICATION,
    SEND_SMS_NOTIFICATION,
    SEND_TEST_SMS_NOTIFICATION
} from 'src/constants/kafka-constant';
import { GetNotificationsDto } from './dto/get-notifications.dto';

import { NotificationService } from './notification.service';

import { LoggerHandler } from '../../helpers/logger-handler';

@Controller('notification')
export class NotificationController {

  constructor(
    private notificationService: NotificationService
  ) {}

  private readonly logger = new LoggerHandler(NotificationController.name).getInstance();

  @MessagePattern(GET_NOTIFICATIONS, Transport.TCP)
  async getNotifications(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${GET_NOTIFICATIONS}::recv -> ${JSON.stringify(message.value)}`);
    const externalId: number = message?.value?.externalId;
    const params: GetNotificationsDto = message?.value?.params;
    return await this.notificationService.getNotifications(externalId, params);
  }

  @MessagePattern(SEND_NOTIFICATION, Transport.TCP)
  async sendNotificationHandler(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${SEND_NOTIFICATION}::recv -> ${JSON.stringify(message.value)}`);
    this.notificationService.sendNotification(message.value);
  }

  @MessagePattern(SEND_TEST_SMS_NOTIFICATION, Transport.TCP)
  async sendSMSNotification(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`kafka::notifications::${SEND_TEST_SMS_NOTIFICATION}::recv -> ${JSON.stringify(message.value)}`);
    this.notificationService.sendTestSMSNotification(message.value);
  }

  @EventPattern(SEND_EMAIL_NOTIFICATION, Transport.KAFKA)
  async sendEmailNotificationHandler(@Payload() message) {
    this.logger.log(`kafka::notifications::${SEND_EMAIL_NOTIFICATION}::recv -> ${JSON.stringify(message.value)}`);
    this.notificationService.sendEmailNotification(message.value);
  }

  @EventPattern(SEND_PUSH_NOTIFICATION, Transport.KAFKA)
  async sendPushNotificationHandler(@Payload() message) {
    this.logger.log(`kafka::notifications::${SEND_PUSH_NOTIFICATION}::recv -> ${JSON.stringify(message.value)}`);
    this.notificationService.sendPushNotification(message.value);
  }

  @EventPattern(SEND_SMS_NOTIFICATION, Transport.KAFKA)
  async sendSMSNotificationHandler(@Payload() message) {
    this.logger.log(`kafka::notifications::${SEND_SMS_NOTIFICATION}::recv -> ${JSON.stringify(message.value)}`);
    this.notificationService.sendSMSNotification(message.value);
  }

}

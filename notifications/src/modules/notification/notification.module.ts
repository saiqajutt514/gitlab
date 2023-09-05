import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

import { EmailNotificationLogRepository } from './repositories/email-notification-log.repository';
import { PushNotificationLogRepository } from './repositories/push-notification-log.repository';
import { SmsNotificationLogRepository } from './repositories/sms-notification-log.repository';

import { EmailTemplateRepository } from '../templates/email/repositories/email-template.repository';
import { PushTemplateRepository } from '../templates/push/repositories/push-template.repository';
import { SmsTemplateRepository } from '../templates/sms/repositories/sms-template.repository';

import { EmailTemplateService } from '../templates/email/email-template.service';
import { PushTemplateService } from '../templates/push/push-template.service';
import { SmsTemplateService } from '../templates/sms/sms-template.service';

import { SendEmailNotificationService } from './send-email-notification';
import { SendPushNotificationService} from './send-push-notification';
import { SendSMSNotificationService } from './send-sms-notification';
import { EwalletService } from './ewallet.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    EmailNotificationLogRepository,
    PushNotificationLogRepository,
    SmsNotificationLogRepository,
    EmailTemplateRepository,
    PushTemplateRepository,
    SmsTemplateRepository
  ])],
  providers: [
    NotificationService,
    EmailTemplateService,
    PushTemplateService,
    SmsTemplateService,
    SendEmailNotificationService,
    SendPushNotificationService,
    SendSMSNotificationService,
    EwalletService
  ],
  controllers: [NotificationController]
})
export class NotificationModule {}

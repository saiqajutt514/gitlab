import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Ejs from 'ejs';

import { ResponseData } from 'src/helpers/responseHandler';
import { errorMessage } from 'src/constants/error-message-constant';

import { READ_STATUS } from './enum';
import { GetNotificationsDto } from './dto/get-notifications.dto';

import { EmailNotificationReqDto } from './dto/email-notification-req.dto';
import { PushNotificationReqDto } from './dto/push-notification-req.dto';
import { SmsNotificationReqDto } from './dto/sms-notification-req.dto';

import { EmailTemplateService } from '../templates/email/email-template.service';
import { PushTemplateService } from '../templates/push/push-template.service';
import { SmsTemplateService } from '../templates/sms/sms-template.service';

import { SendEmailNotificationService } from './send-email-notification';
import { SendPushNotificationService } from './send-push-notification';
import { SendSMSNotificationService } from './send-sms-notification';

import { PushNotificationLogRepository } from './repositories/push-notification-log.repository';

import { LoggerHandler } from '../../helpers/logger-handler';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(PushNotificationLogRepository)
    private pushNotificationLogRepository: PushNotificationLogRepository,
    private sendEmailNotificationService: SendEmailNotificationService,
    private sendPushNotificationService: SendPushNotificationService,
    private sendSMSNotificationService: SendSMSNotificationService,
    private emailTemplateService: EmailTemplateService,
    private pushTemplateService: PushTemplateService,
    private smsTemplateService: SmsTemplateService,
  ) {}

  private readonly logger = new LoggerHandler(
    NotificationService.name,
  ).getInstance();

  async getNotifications(externalId: number, params: GetNotificationsDto) {
    try {
      let { page, limit } = params || {};
      this.logger.log(`[getNotifications] | page: ${page} | limit: ${limit}`);
      if (!page || page <= 0) {
        page = 1;
      }
      if (!limit || limit <= 0) {
        limit = 20;
      }
      const subQryInstance = this.pushNotificationLogRepository.createQueryBuilder(
        'pl',
      );
      subQryInstance.select([
        'pl.id',
        'pl.title',
        'pl.message',
        'pl.payload',
        'pl.sentTime',
        'pl.isRead',
      ]);
      subQryInstance.where('pl.externalId = :externalId', { externalId });
      if (params.userType) {
        subQryInstance.orWhere('pl.externalId = :userType', {
          userType: params.userType,
        });
      }
      if (params?.type === 'unread') {
        subQryInstance.andWhere('pl.isRead = :read', {
          read: READ_STATUS.UNREAD,
        });
      }
      subQryInstance.orderBy('pl.sentTime', 'DESC');
      subQryInstance.skip((page - 1) * limit);
      subQryInstance.take(limit);

      const notifications = await subQryInstance.getMany();

      // Update read status
      if (notifications && notifications.length > 0) {
        const idsList = notifications
          .map((data) => {
            if (data.isRead === READ_STATUS.UNREAD) {
              return data?.id;
            }
          })
          .filter((el) => {
            return el != null;
          });
        this.logger.log(
          `[getNotifications] | idsList: ${JSON.stringify(idsList)}`,
        );
        if (idsList && idsList.length > 0) {
          await this.pushNotificationLogRepository.update(idsList, {
            isRead: READ_STATUS.READ,
          });
        }

        notifications.map((item) => {
          const payload = item.payload ? JSON.parse(item.payload) : {};
          item['type'] = '';
          if (payload?.custom?.type) {
            item['type'] = payload?.custom?.type;
            delete payload['custom']['type'];
            item['custom'] = payload['custom'];
          }
          delete item['payload'];
        });
      }

      return ResponseData.success(HttpStatus.OK, notifications);
    } catch (error) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async sendNotification(data) {
    let { token, title, body } = data;
    try {
      this.logger.log(`sendNotification data: ${JSON.stringify(data)}`);
      // Test Push Notification
      if (!title) {
        title = 'Hello Captain';
      }
      if (!body) {
        body = `Welcome to Ride`;
      }
      if (token) {
        token = [token];
      } else {
        token = [
          // 'f_oAyDodUlE:APA91bFlI1UQDpREWo00s9XXpODhLBz1iYcQ2nFEuhqahHPASyrQhd5V8jk-n3nnhRt_CLsuFVjK-Df5GV4fg3hqw8yVMm5Quh1qYdnan-CZhBDvF_1MN3uYLTwkFe1GH82IdFfhGzCw',
          // 'fyLEeNScO0mbjP7s23w69j:APA91bG8Fc6S93LZw-rvtij4631r86Q2mFtXS12j_QiG2-D_g8alg_kL4nXax7Rv7gmYZVhho6IgzMOCQ97S4iciB2lxxag9aPt_SvMCRJKp47NCbX1qHfSWv7E_HSpVRdDGeBlDbjrH',
          // 'fXUG3SJKqUnalxrqXvAMKr:APA91bG041rvxqtpasQlHdji6VYBJBDsoMn4Ngmq4hbql0WwZ0u6heU0YD-XDDiFKWtn_DXYViRl4Qi9VGcv9T683Jwc3_A2bXp0H51PucK2jYzyobswvRPjQOcWxRNDXMvAEzEEUlZ7',
          // 'cQBZaikoK0g4qA0BAdF7DE:APA91bGWGu3LAQXsm1W_P1yLon9BAHq4MkfqZv4DSGWpURQWRDtPn9B9ShU-2GYd3NZKtJu8dI3oLagufcZJTj8B1IhaFwYwbna2Fqhg0V1Hi6uboI0Fh5oqjP3sq8KdUymjYqprRuoc',
          // 'e9gjvi-t-Eiqj50SUB01Dg:APA91bFGI_xjktfTZtplUt2yuY6kj6p-yuHGbtp3IP6neoorZ_yf_nKEIXk-YmtSWEqE3giOHsYsMD9MQEIzHxDd9J__fCC6bR9o4uLCM4yvWqIcPXl4JwYsU52IbsGa6g90e2-00Z2B',
          // 'e0SauQ2DQ5K5v9abvOAspe:APA91bHWjy7p_2bAa2_THh2iGUdpA-ktky9Lz8l1uhnwfxqk2MLhp86R0UtLw37TsLizYQg43KKNnw1KAtPykie2U4kDgoJeJr2jp4rQvrvuKxZyX7N0bg_0h4bL_0B-VFrzUpjiw_ke'
          // 'cVNLx3J9g0DpmizB-UKw1r:APA91bHkimWfk-KIt3RAYSVYmPqukxwRLDOYVGgQOOmINJDaXK6yH7OvcvugL484zmPKO5WbvghEUg_-zfaqmSud8bWqRvz1ZGFhT6YrNwmTWxRZxRFlOP_E_IlAUiLyS4V63tagEeqZ'
          'cAarXNom5EPYhOyO00lurI:APA91bFme49WW1_odAVr6yM2aIxPOlRjIWFfAPwcCDwadG-_qJkHbAPkB09ACGQU3Ybpvd9RlhsLZZXzitL-zpR1Vue7P-XNxEkA50VMFYfDsy5cgNxgrE8bbiyu_jNdcf2WH2Ar43R2',
        ];
      }

      const result = await this.sendPushNotificationService.testSend({
        token: token,
        title: title,
        body: body,
      });

      return ResponseData.success(HttpStatus.OK, result);
    } catch (e) {
      this.logger.error('Send notification has error: ' + e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async sendTestSMSNotification(params: SmsNotificationReqDto) {
    try {
      this.logger.log(
        `send-test-sms-notification data: ${JSON.stringify(params)}`,
      );

      const mobileNo = params.mobileNo;
      if (!mobileNo) {
        throw new Error(errorMessage.MOBILE_NUMBER_MISSING);
      }

      let message: string = params?.message;
      let isLoggable = false;

      this.logger.log('Test SMS sending initiated');
      // Send sms notification
      this.sendSMSNotificationService.sendSMS({
        externalId: '',
        mobileNo: mobileNo,
        message: message,
        isLoggable,
      });
    } catch (e) {
      this.logger.error('Test SMS notification has error: ' + e.message);
    }
  }

  async sendEmailNotification(params: EmailNotificationReqDto) {
    try {
      this.logger.log(
        `send-email-notification data: ${JSON.stringify(params)}`,
      );

      const receiver = params.receiver;
      if (!receiver) {
        throw new Error(errorMessage.EMAIL_RECEIVER_MISSING);
      }

      let subject: string = params?.subject;
      let body: string = params?.body;
      let address: any = params?.address || {};
      let isLoggable = false;

      // If template code found then prepare subject & body
      if (params.templateCode) {
        const keyValues: any = params?.keyValues;
        const templateDetails = await this.emailTemplateService.findByCode(
          params.templateCode,
        );
        if (templateDetails.statusCode == HttpStatus.OK) {
          isLoggable = templateDetails.data.logStatus;
          if (params.language === 'AR') {
            subject =
              templateDetails.data.subjectArabic ||
              templateDetails.data.subject;
            body = templateDetails.data.bodyArabic || templateDetails.data.body;
          } else {
            subject = templateDetails.data.subject;
            body = templateDetails.data.body;
          }
          let dataKeys = [];
          if (templateDetails.data.dataKeys) {
            dataKeys = JSON.parse(templateDetails.data.dataKeys);
          }
          if (dataKeys && dataKeys?.length > 0) {
            subject = this.parseHtmlTemplate(subject, dataKeys, keyValues);
            body = this.parseHtmlTemplate(body, dataKeys, keyValues);
          }
          address = await this.sendEmailNotificationService.prepareAddress(
            address,
            templateDetails.data,
          );
        }
      }
      if (!body) {
        throw new Error(errorMessage.EMAIL_BODY_MISSING);
      }

      // isLoggable = (params?.isLoggable === true) ? true : isLoggable
      this.logger.log('Email sending initiated');

      // Send email notification
      this.sendEmailNotificationService.sendMail({
        externalId: params?.externalId,
        receiver,
        subject,
        body,
        address,
        isLoggable,
      });
    } catch (e) {
      this.logger.error('Email notification has error: ' + e.message);
    }
  }

  async sendPushNotification(params: PushNotificationReqDto) {
    try {
      this.logger.log(`send-push-notification data: ${JSON.stringify(params)}`);

      let deviceToken;
      if (params.multiple === true) {
        deviceToken = params.deviceTokenList.filter((token) => {
          try {
            if (token?.trim() && token?.trim() != '') return token.trim();
          } catch (err) {}
        });
        if (deviceToken?.length <= 0) {
          throw new Error(errorMessage.DEVICE_TOKEN_MISSING);
        } else
          this.logger.log(
            `send-push-notification device token lenght after: ${JSON.stringify(
              deviceToken.length,
            )}`,
          );
      } else {
        if (!params.deviceToken) {
          throw new Error(errorMessage.DEVICE_TOKEN_MISSING);
        }
        deviceToken = [params.deviceToken];
      }

      let title: string = params?.title;
      let message: string = params?.message;
      let isLoggable = true;

      // If template code found then prepare title & body
      if (params.templateCode) {
        const keyValues: any = params?.keyValues;
        const templateDetails = await this.pushTemplateService.findByCode(
          params.templateCode,
        );
        if (templateDetails.statusCode == HttpStatus.OK) {
          isLoggable = templateDetails.data.logStatus;
          if (params?.language && params.language.localeCompare('AR', undefined, {
          sensitivity: 'base',
        }) === 0) {
            title =
              templateDetails.data.titleArabic || templateDetails.data.title;
            message =
              templateDetails.data.messageArabic ||
              templateDetails.data.message;
          } else {
            title = templateDetails.data.title;
            message = templateDetails.data.message;
          }
          let dataKeys = [];
          if (templateDetails.data.dataKeys) {
            dataKeys = JSON.parse(templateDetails.data.dataKeys);
          }
          if (dataKeys && dataKeys?.length > 0) {
            title = this.parseTextTemplate(title, dataKeys, keyValues);
            message = this.parseTextTemplate(message, dataKeys, keyValues);
          }
        }
      }
      if (!message) {
        throw new Error(errorMessage.PUSH_MESSAGE_MISSING);
      }

      // Prepare payload object
      const notifyPayload: any = this.sendPushNotificationService.preparePayload(
        {
          title: title,
          body: message,
          data: params?.extraParams,
          options: params?.extraOptions,
        },
      );

      // isLoggable = (params?.isLoggable === true) ? true : isLoggable
      this.logger.log('Push notification initiated');
      // Send push notification
      this.sendPushNotificationService.sendNotification({
        externalId: params?.externalId,
        clientOs: params?.clientOs,
        payload: notifyPayload,
        tokens: deviceToken,
        isLoggable,
      });
    } catch (e) {
      this.logger.error('Push notification has error: ' + e.message);
    }
  }

  async sendSMSNotification(params: SmsNotificationReqDto) {
    try {
      this.logger.log(`send-sms-notification data: ${JSON.stringify(params)}`);

      const mobileNo = params.mobileNo;
      if (!mobileNo) {
        throw new Error(errorMessage.MOBILE_NUMBER_MISSING);
      }

      let message: string = params?.message;
      let isLoggable = false;

      // If template code found then prepare subject & body
      if (params.templateCode) {
        const keyValues: any = params?.keyValues;
        const templateDetails = await this.smsTemplateService.findByCode(
          params.templateCode,
        );
        if (templateDetails.statusCode == HttpStatus.OK) {
          isLoggable = templateDetails.data.logStatus;
          if (params.language === 'AR') {
            message =
              templateDetails.data.messageArabic ||
              templateDetails.data.message;
          } else {
            message = templateDetails.data.message;
          }
          let dataKeys = [];
          if (templateDetails.data.dataKeys) {
            dataKeys = JSON.parse(templateDetails.data.dataKeys);
          }
          if (dataKeys && dataKeys?.length > 0) {
            message = this.parseTextTemplate(message, dataKeys, keyValues);
          }
        }
      }
      if (!message) {
        throw new Error(errorMessage.SMS_MESSAGE_MISSING);
      }

      // isLoggable = (params?.isLoggable === true) ? true : isLoggable
      this.logger.log('SMS sending initiated');
      // Send sms notification
      this.sendSMSNotificationService.sendSMS({
        externalId: params?.externalId,
        mobileNo: mobileNo,
        message: message,
        isLoggable,
      });
    } catch (e) {
      this.logger.error('SMS notification has error: ' + e.message);
    }
  }

  parseHtmlTemplate(content: string, dataKeys: any, keyValues: any) {
    try {
      const options = {
        delimiter: '%',
        openDelimiter: '{',
        closeDelimiter: '}',
      };
      const template = Ejs.compile(content, options);
      const dataValues = {};
      if (dataKeys && dataKeys?.length > 0) {
        dataKeys.forEach((key) => {
          if (key in keyValues) {
            dataValues[key] = keyValues[key];
          } else {
            dataValues[key] = '';
          }
        });
      }
      return template(dataValues);
    } catch (err) {
      // Print errors
      return content;
    }
  }

  parseTextTemplate(content: string, dataKeys: any, keyValues: any) {
    try {
      const options = {
        delimiter: '%',
        openDelimiter: '{',
        closeDelimiter: '}',
      };
      const dataValues = {};
      if (dataKeys && dataKeys?.length > 0) {
        dataKeys.forEach((key) => {
          if (key in keyValues) {
            dataValues[key] = keyValues[key];
          } else {
            dataValues[key] = '';
          }
        });
      }
      return Ejs.render(content, dataValues, options);
    } catch (err) {
      // Print errors
      return content;
    }
  }
}

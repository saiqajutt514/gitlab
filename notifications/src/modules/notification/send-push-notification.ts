import { Injectable, Logger } from '@nestjs/common';
import * as Notification from 'node-pushnotifications';
// import firebaseAdmin from '../firebase/config';
import appConfig from 'config/appConfig';

import { PushNotificationLogRepository } from './repositories/push-notification-log.repository';
import { PushNotificationLogDto } from './dto/push-notification-log.dto';
import {
  PrepareNotificationPayloadDto,
  SendFirebaseNotificationDto,
  DEVICE_TYPE,
  NOTIFY_STATUS,
} from './enum';
import { getTimestamp } from 'src/utils/get-timestamp';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class SendPushNotificationService {
  notifyObject;

  private readonly logger = new LoggerHandler(
    SendPushNotificationService.name,
  ).getInstance();

  constructor(
    private pushNotificationLogRepository: PushNotificationLogRepository,
  ) {
    const notifyConfig = {
      gcm: {
        id: appConfig().fcmServerKey,
        // phonegap: true,
      },
      // apn: {
      //   token: {
      //     key: '<.p8 file path>',
      //     keyId: '<iOS Key ID (kid)>',
      //     teamId: '<iOS Team ID (iss)>',
      //   },
      //   production: '<boolean>',
      // },
      isAlwaysUseFCM: true, //true
    };
    // if ('<iOS Secret Key>') {
    //   pushConfig.apn.passphrase = '<iOS Secret Key>';
    // }

    this.notifyObject = new Notification(notifyConfig);
  }

  async testSend(options: any) {
    const notifyData: any = {};
    notifyData.title = options.title;
    notifyData.body = options.body;

    const senderObject = this.notifyObject;
    const result = await new Promise((resolve, reject) => {
      senderObject.send(options.token, notifyData, (error, info) => {
        const sendStatus: any = {};
        sendStatus.payload = notifyData;
        if (error) {
          sendStatus.success = 0;
          sendStatus.message = JSON.stringify(error);
        } else if (info.success === 0) {
          sendStatus.success = 0;
          sendStatus.message = JSON.stringify(info);
        } else {
          sendStatus.success = 1;
          sendStatus.message = JSON.stringify(info);
        }
        resolve(sendStatus);
      });
    });
    return result;
  }

  preparePayload(params: PrepareNotificationPayloadDto) {
    // Firebase Configuration
    // const payload: any = {
    //   notification: {
    //     title: params.title,
    //     body: params.body
    //   }
    // };
    // if (params.data) {
    //   payload.data = params.data;
    // }

    // if (params.options) {
    //   // notification related
    //   if (params.options.sound) {
    //     payload.notification.sound = params.options.sound;
    //   }
    //   if (params.options.badge) {
    //     payload.notification.badge = params.options.badge;
    //   }
    // }

    const payload: any = {};
    payload.title = params.title;
    payload.body = params.body;
    // payload.topic = '<iOS Bundle ID>';

    if (params?.data) {
      payload.custom = params?.data;
    }
    if (params?.options?.sound) {
      payload.sound = params?.options?.sound;
    } else {
      payload.sound = 'Notifications.mp3';
    }
    if (params?.options?.badge) {
      payload.badge = Number(params?.options?.badge);
    } else {
      payload.badge = 1;
    }
    if (params?.options?.priority) {
      payload.priority = params?.options?.priority;
    } else {
      payload.priority = 'high';
    }
    if (params?.options?.image) {
      payload.image = params?.options?.image;
    }
    if (params?.options?.icon) {
      payload.icon = params?.options?.icon;
    }
    if (params?.options?.icon) {
      payload.icon = params?.options?.icon;
    }
    if (params?.options?.color) {
      payload.color = params?.options?.color;
    }
    if (params?.options?.silent) {
      payload.contentAvailable = params?.options?.silent;
    }
    if (params?.options?.mutable) {
      payload.mutableContent = params?.options?.mutable;
    }
    if (params?.options?.collapseKey) {
      payload.collapseKey = params?.options?.collapseKey;
    }

    return payload;
  }

  sendNotification(params: SendFirebaseNotificationDto) {
    // Firebase Configuration
    // const options: any = {
    //   priority: 'high',
    // }
    // if (params.options) {
    //   if (params.options.priority) {
    //     options.priority = params.options.priority;
    //   }
    //   if (params.options.silent) {
    //     options.content_available = params.options.silent;
    //   }
    //   if (params.options.mutable) {
    //     options.mutable_content = params.options.mutable;
    //   }
    // }
    // const response = await firebaseAdmin.messaging().sendToDevice(params.token, params.payload, options);

    try {
      this.logger.log(
        `send pus_ notifications request params. ${JSON.stringify(params)}`,
      );

      this.notifyObject.send(params.tokens, params.payload, (error, info) => {
        // this.logger.log(`send pus_ notifications response. ${JSON.stringify(info)}`);
        if (error) {
          this.logger.error(
            `send push notification has errors. ${JSON.stringify(error)}`,
          );
          this.logNotification(params, error, 0);
        } else if (info.success === 0) {
          this.logger.warn(
            `send push notification has warnings. ${JSON.stringify(error)}`,
          );
          this.logNotification(params, info, 0);
        } else {
          if (info[0] && info[0].success === 0) {
            this.logger.error(`push notification sending failed.`);
            this.logNotification(params, info, 0);
          } else if (info[0] && info[0].success > 0 && info[0].failure > 0) {
            this.logger.warn(`push notification sending failed.`);
            this.logNotification(params, info, 2);
          } else {
            this.logger.log(`push notification sent succesfully.`);
            this.logNotification(params, info, 1);
          }
        }
      });
    } catch (err) {
      this.logger.error(
        `send push notification has errors. ${JSON.stringify(err.message)}`,
      );
    }
  }

  logNotification(params, response, status) {
    if (params.isLoggable === false) {
      this.logger.log(`  for this push template | ${params?.payload?.title}`);
      return;
    }
    try {
      const sentStatus = status || NOTIFY_STATUS.FAILED;
      // Log push notification details
      const deviceType: number =
        params?.clientOs == 'IOS' ? DEVICE_TYPE.IOS : DEVICE_TYPE.ANDROID;
      const notificationData: PushNotificationLogDto = {
        externalId: params?.externalId,
        deviceToken: params?.tokens[0],
        deviceType: deviceType,
        title: params?.payload?.title,
        message: params?.payload?.body,
        payload: JSON.stringify(params?.payload),
        response: JSON.stringify(response),
        sentTime: getTimestamp(),
        status: sentStatus,
      };
      const notificationLog = this.pushNotificationLogRepository.create(
        notificationData,
      );
      this.pushNotificationLogRepository.save(notificationLog);
    } catch (err) {
      this.logger.error(
        `push notification log has errors. ${JSON.stringify(err.message)}`,
      );
    }
  }
}

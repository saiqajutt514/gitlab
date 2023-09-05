import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { RedisClient } from 'redis';
import { promisify } from 'util';
import appConfig from 'config/appConfig';

import { EmailNotificationLogRepository } from './repositories/email-notification-log.repository';
import { EmailNotificationLogDto } from './dto/email-notification-log.dto';
import { SendEmailNotificationDto, NOTIFY_STATUS } from './enum';
import { getTimestamp } from 'src/utils/get-timestamp';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { EwalletService } from './ewallet.service';
import * as ejs from 'ejs';
import * as fs from 'fs';

@Injectable()
export class SendEmailNotificationService {

  redisClient: RedisClient;
  getRedisKey: Function;

  private readonly logger = new LoggerHandler(SendEmailNotificationService.name).getInstance();

  constructor(
    private readonly mailerService: MailerService,
    private emailNotificationLogRepository: EmailNotificationLogRepository,
    private ewalletService: EwalletService
  ) {
    this.redisClient = new RedisClient({
      host: appConfig().RedisHost,
      port: appConfig().RedisPort,
    });
    this.getRedisKey = promisify(this.redisClient.get).bind(this.redisClient);
  }

  async prepareAddress(addrInfo: any, tmplData: any) {

    if(!tmplData?.address || tmplData.address === '') {
      tmplData.address = '{}';
    }

    let defaultAddr = JSON.parse(tmplData.address);
    if (!defaultAddr) {
      defaultAddr = {};
    }
    const systemFromName = await this.getRedisKey('SETTING_EMAIL_NOTIFICATION_FROM_EMAIL');
    const systemFromEmail = await this.getRedisKey('SETTING_EMAIL_NOTIFICATION_FROM_NAME');
    if (!addrInfo?.fromName) {
      if (defaultAddr?.fromName) {
        addrInfo.fromName = tmplData.fromName;
      } else {
        addrInfo.fromName = systemFromName;
      }
    }
    if (!addrInfo?.fromEmail) {
      if (defaultAddr?.fromEmail) {
        addrInfo.fromEmail = tmplData.fromEmail;
      } else {
        addrInfo.fromEmail = systemFromEmail;
      }
    }
    if (!addrInfo?.replyToName) {
      if (defaultAddr?.replyToName) {
        addrInfo.replyToName = tmplData.replyToName;
      } else {
        // TODO: Assign admin settings
        addrInfo.replyToName = '';
      }
    }
    if (!addrInfo?.replyToEmail) {
      if (defaultAddr?.replyToEmail) {
        addrInfo.replyToEmail = tmplData.replyToEmail;
      } else {
        // TODO: Assign admin settings
        addrInfo.replyToEmail = '';
      }
    }
    if (!addrInfo?.cc) {
      if (defaultAddr?.cc) {
        addrInfo.cc = tmplData.cc;
      } else {
        // TODO: Assign admin settings
        addrInfo.cc = '';
      }
    }
    if (!addrInfo?.bcc) {
      if (defaultAddr?.bcc) {
        addrInfo.bcc = tmplData.bcc;
      } else {
        // TODO: Assign admin settings
        addrInfo.bcc = '';
      }
    }
    return addrInfo;
  }

  async sendMail(params: SendEmailNotificationDto) {
    try {
      let fromAddress; // Temporary
      if(params?.address?.fromEmail) {
        fromAddress = params?.address?.fromEmail;
        if (params?.address?.fromName) {
          fromAddress = `${params?.address?.fromName} <${params?.address?.fromEmail}>`;
        }
      } else {
        fromAddress = await this.getRedisKey('SETTING_EMAIL_NOTIFICATION_FROM_EMAIL');
      }
      const copyrightText = await this.getRedisKey('SETTING_COPYRIGHT_TEXT');
      const companyName = await this.getRedisKey('SETTING_COMPANY_NAME');
      const companyLogo = await this.getRedisKey('SETTING_COMPANY_LOGO');
      const siteUrl = await this.getRedisKey('SETTING_SITE_URL');
      const contactSupport = await this.getRedisKey('SETTING_SUPPORT_TOLL_FREE_NO');
      const s3PublicBucket = appConfig().s3PublicBucket;

      const options: any = {
        to: params.receiver,
        from: fromAddress,
        subject: params.subject,
        template: 'src/templates/mail-template-new',
        context: {
          copyright_text: copyrightText,
          company_name: companyName,
          company_logo: companyLogo,
          site_url: siteUrl,
          content: params.body,
          s3PublicBucket,
          contactSupport,
        },
      };

      if (params?.address?.replyToEmail) {
        options.replyTo = params?.address?.replyToEmail;
      }
      if (params?.address?.replyToName) {
        options.inReplyTo = params?.address?.replyToName;
      }
      if (params?.address?.cc) {
        options.cc = params?.address?.cc;
      }
      if (params?.address?.bcc) {
        options.bcc = params?.address?.bcc;
      }

      this.mailerService.sendMail(options)
      .then((res) => {

        this.logger.log(`Mailer service email sent successfully. receiver: ${params?.receiver}`);
        this.logMail(params, res, 1);
      })
      .catch((error) => {

        this.logger.error(`Mailer service(send email) has error: ${JSON.stringify(error)}`);
        this.logMail(params, error, 0);
      });

      this.logMail(params, { message: "SMTP pending" }, 0);

    } catch (e) {
      this.logger.error(`[sendMail] error > ${e.message}`)
    }
  }

  logMail(params, response, status) {
    if (params.isLoggable === false) {
      this.logger.log(`logs disabled for this email template | ${params?.subject}`);
      return;
    }
    // Log email notification details
    try {
      const sentStatus = status||NOTIFY_STATUS.FAILED;
      const notificationData: EmailNotificationLogDto = {
        externalId: params?.externalId,
        receiver: params?.receiver,
        subject: params?.subject,
        body: params?.body,
        address: JSON.stringify(params?.address),
        response: JSON.stringify(response),
        sentTime: getTimestamp(),
        status: sentStatus,
      }
      const notificationLog = this.emailNotificationLogRepository.create(notificationData);
      this.emailNotificationLogRepository.save(notificationLog);
    } catch(err) {
      this.logger.error(`email log has errors. ${JSON.stringify(err.message)}`);
    }
  }

  // async sendWalletMail(params: SendEmailNotificationDto) {
  //   try {
  //     const copyrightText = await this.getRedisKey('SETTING_COPYRIGHT_TEXT');
  //     const companyName = await this.getRedisKey('SETTING_COMPANY_NAME');
  //     const companyLogo = await this.getRedisKey('SETTING_COMPANY_LOGO');
  //     const siteUrl = await this.getRedisKey('SETTING_SITE_URL');
  //     const contactSupport = await this.getRedisKey('SETTING_SUPPORT_TOLL_FREE_NO');
  //     const s3PublicBucket = appConfig().s3PublicBucket;
  //     const template = await fs.readFileSync(fs.realpathSync('src/templates/mail-template-new.ejs'), 'utf8');
  //     const content = ejs.render(template, {
  //       copyright_text: copyrightText,
  //       company_name: companyName,
  //       company_logo: companyLogo,
  //       s3PublicBucket: s3PublicBucket,
  //       contactSupport: contactSupport,
  //       site_url: siteUrl,
  //       content: params.body
  //     }, {
  //       rmWhitespace:true
  //     });

  //     const apiParams = {
  //       type: ["email"],
  //       email: params.receiver,
  //       emailSubject: params.subject,
  //       text: content
  //     }
  //     this.logger.log(`[sendWalletMail] calling wallet API`)
  //     const apiResponse = await this.ewalletService.sendNotification(apiParams);
  //     this.logger.log(`[sendWalletMail] wallet API returned`)
  //     if (apiResponse.statusCode !== HttpStatus.OK) {
  //       this.logMail(params, {message: apiResponse.message}, 0);
  //     } else {
  //       this.logMail(params, {message: apiResponse.data.message}, 1);
  //     }
  //   } catch (e) {
  //     this.logger.error(`[sendWalletMail] error > ${e.message}`)
  //   }
  // }

}
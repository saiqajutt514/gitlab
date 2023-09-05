import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from 'config/typeOrmConfig';
import appConfig from 'config/appConfig';

import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { NotificationModule } from './modules/notification/notification.module';
import { EmailTemplateModule } from './modules/templates/email/email-template.module';
import { PushTemplateModule } from './modules/templates/push/push-template.module';
import { SmsTemplateModule } from './modules/templates/sms/sms-template.module';
import { LoggerModule } from 'nestjs-pino';

// import { NotificationTokenModule } from './modules/notification-token/notification-token.module';
// import { NotificationLogModule } from './modules/notification-log/notification-log.module';

// If we want use AWS SES service for mail
// {
//   SES: new aws.SES({
//     apiVersion: appConfig().smtpApiVersion // '2010-12-01',
//     accessKeyId: appConfig().smtpAccessKey,
//     secretAccessKey: appConfig().smtpSecretKey,
//     region: appConfig().smtpRegion,
//     sslEnabled: true,
//   }),
// }

console.log("in app module", typeOrmConfig)
console.log("env variables", JSON.stringify(process.env))
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: appConfig().smtpHost,
          port: appConfig().smtpPort,
          secure: appConfig().smtpSecure,
          auth: {
            user: appConfig().smtpUsername,
            pass: appConfig().smtpPassword
          },
        },
        // defaults: {
        //   from: '"No Reply" <no-reply@localhost>',
        // },
        template: {
          dir: 'src/templates/',
          adapter: new EjsAdapter(),
        },
      }),
    }),
    NotificationModule,
    EmailTemplateModule,
    PushTemplateModule,
    SmsTemplateModule,
    LoggerModule.forRoot({
      pinoHttp:{
        name:'notifications',
        level:'debug',
        formatters: {
          level: label => {
            return { level: label };
          }
        }
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

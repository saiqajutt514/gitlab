import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './user.service';

import { MailerModule } from '@nestjs-modules/mailer';

import appConfig from "config/appConfig";
import { AwsS3Service } from 'src/helpers/aws-s3-service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: appConfig().smtpHost,
        port: appConfig().smtpPort,
        secure: appConfig().smtpSecure,
        auth: {
          user: appConfig().smtpUsername,
          pass: appConfig().smtpPassword
        }
      }
    })
  ],
  controllers: [UserController],
  providers: [UserService, AwsS3Service],
  exports: [UserService]
})
export class UserModule {}

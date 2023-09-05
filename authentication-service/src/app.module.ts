import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from 'config/typeOrmConfig';

import { EwalletModule } from './modules/ewallet/ewallet.module';
import { LoggerModule } from 'nestjs-pino';
import { OtpModule } from './modules/otp/otp.module';
import { SmsModule } from './modules/sms/sms.module';
import { YakeenModule } from './modules/yakeen/yakeen.module';

@Module({
  imports: [
    EwalletModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    LoggerModule.forRoot({
      pinoHttp:{
        name:'auth-service',
        level:'debug',
        formatters: {
          level: label => {
            return { level: label };
          }
        }
      }
    }),
    OtpModule,
    SmsModule,
    YakeenModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

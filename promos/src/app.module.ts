import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'
import appConfiguration from 'config/appConfig';

import { typeOrmConfig } from 'config/typeOrmConfig';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CouponModule } from './modules/coupon/coupon.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ConfigModule.forRoot({
      load: [appConfiguration],
    }),
    CouponModule,
    LoggerModule.forRoot({
      pinoHttp:{
        name:'promo-codes',
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
export class AppModule { }

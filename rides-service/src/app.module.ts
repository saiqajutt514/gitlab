import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from 'config/typeOrmConfig';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino';
import { RedisHandler } from './helpers/redis-handler';

import appConfiguration from 'config/appConfig'

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TripModule } from './modules/trips/trips.module';
import { TripDriversModule } from './modules/trip_drivers/trip_drivers.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EmergencyRequestsModule } from './modules/emergency-requests/emergency-requests.module';
import { HighDemandZoneModule } from './modules/high-demand-zone/high-demand-zone.module';


console.log("in app module", typeOrmConfig)
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ConfigModule.forRoot({
      load: [appConfiguration],
    }),
    ScheduleModule.forRoot(),
    TripModule,
    TripDriversModule,
    CustomerModule,
    ReportsModule,
    EmergencyRequestsModule,
    LoggerModule.forRoot({
      pinoHttp:{
        name:'trip-service',
        level:'debug',
        formatters: {
          level: label => {
            return { level: label };
          }
        }
      }
    }),
    HighDemandZoneModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService, RedisHandler],
})
export class AppModule { }

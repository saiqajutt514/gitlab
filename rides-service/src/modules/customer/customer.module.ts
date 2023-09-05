import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './customer.repository';
import { TripsRepository } from '../trips/trips.repository';
import { LoggerModule } from 'src/logger/logger.module';
import { ClientsModule } from '@nestjs/microservices';
import {
  notificationKafkaConfig,
  reviewsTCPConfig,
  socketMicroServiceConfig,
} from 'src/microServicesConfigs';
import { CustomerLocationsRepository } from './customerlocations.repository';
import { CustomerAppUsage } from './entities/customer_app_usage.entity';
import { RedisHandler } from 'src/helpers/redis-handler';
import { CustomerAPPUsageRepository } from './repositories/appUsage.repository';
// import { ReviewsService } from '../reviews/reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerRepository,
      TripsRepository,
      CustomerLocationsRepository,
      CustomerAppUsage,
      CustomerAPPUsageRepository,
    ]),
    LoggerModule,
    ClientsModule.register([
      {
        ...reviewsTCPConfig,
        name: 'CLIENT_REVIEW_SERVICE_TCP',
      },
      {
        ...notificationKafkaConfig,
        name: 'CLIENT_NOTIFY_SERVICE_KAFKA',
      },
      {
        ...socketMicroServiceConfig,
        name: 'CLIENT_SOCKET_SERVICE_KAFKA',
      },
    ]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService, RedisHandler],
  exports: [CustomerService],
})
export class CustomerModule {}

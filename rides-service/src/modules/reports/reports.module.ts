import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CustomerRepository } from '../customer/customer.repository';
import { TripsRepository } from '../trips/trips.repository';
import { LoggerModule } from 'src/logger/logger.module';
import { ClientsModule } from '@nestjs/microservices';
import { paymentTCPConfig, reviewsTCPConfig } from 'src/microServicesConfigs';
// import { ReviewsService } from '../reviews/reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerRepository, TripsRepository]), LoggerModule, ClientsModule.register([
    {
      ...reviewsTCPConfig,
      name: 'CLIENT_REVIEW_SERVICE_TCP'
    },
    {
      ...paymentTCPConfig,
      name: 'CLIENT_PAYMENT_SERVICE_TCP'
    }
  ])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService]
})
export class ReportsModule {}

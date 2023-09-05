import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TripsController } from './trips.controller';
import { TripsRepository } from './trips.repository';
import { TripsService } from './trips.service';

import { ScheduleTripService } from 'src/cron/schedule-trip/schedule-trip.service';
import { ProcessPendingTripDriversService } from 'src/cron/process-pending-trip-drivers/process-pending-trip-drivers.service';

import { TripDriverRepository } from '../trip_drivers/trip_drivers.repository';
import { TripDriversService } from '../trip_drivers/trip_drivers.service';

import { TripAddressRepository } from '../trip_address/trip_address.repository';
import { TripImagesRepository } from '../trip_images/trip_images.repository';
import { RemainingChargesRepository } from './remaining-trips.repository';

import { CustomerRepository } from '../customer/customer.repository';
import { CustomerService } from '../customer/customer.service';
import { AwsS3Service } from 'src/helpers/aws-s3-service';
import { LoggerModule } from 'src/logger/logger.module';
import { RedisHandler } from 'src/helpers/redis-handler';
import { ClientsModule } from '@nestjs/microservices';
import {
  captainKafkaConfig,
  captainTCPConfig,
  notificationKafkaConfig,
  paymentTCPConfig,
  promoCodesKafkaMicroServiceConfig,
  promoCodesTCPMicroServiceConfig,
  reviewsTCPConfig,
  socketMicroServiceConfig,
} from 'src/microServicesConfigs';
import { TripLocationRepository } from './trip_locations.repository';
import { CustomerLocationsRepository } from '../customer/customerlocations.repository';
import { CustomerAppUsage } from '../customer/entities/customer_app_usage.entity';
import { CustomerAPPUsageRepository } from '../customer/repositories/appUsage.repository';
import { socketTCPConfig } from 'src/microServicesConfigs/socket.microservice.config';
// import { ReviewsService } from '../reviews/reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TripsRepository,
      TripAddressRepository,
      TripDriverRepository,
      TripImagesRepository,
      RemainingChargesRepository,
      CustomerRepository,
      CustomerLocationsRepository,
      CustomerAppUsage,
      TripLocationRepository,
      CustomerAPPUsageRepository,
    ]),
    LoggerModule,
    ClientsModule.register([
      {
        ...reviewsTCPConfig,
        name: 'CLIENT_REVIEW_SERVICE_TCP',
      },
      {
        ...captainKafkaConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_KAFKA',
      },
      {
        ...captainTCPConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_TCP',
      },
      {
        ...paymentTCPConfig,
        name: 'CLIENT_PAYMENT_SERVICE_TCP',
      },
      {
        ...notificationKafkaConfig,
        name: 'CLIENT_NOTIFY_SERVICE_KAFKA',
      },
      {
        ...socketMicroServiceConfig,
        name: 'CLIENT_SOCKET_SERVICE_KAFKA',
      },
      {
        ...socketTCPConfig,
        name: 'CLIENT_SOCKET_SERVICE_TCP',
      },
      {
        ...promoCodesKafkaMicroServiceConfig,
        name: 'CLIENT_PROMO_SERVICE_KAFKA',
      },
      {
        ...promoCodesTCPMicroServiceConfig,
        name: 'CLIENT_PROMO_SERVICE_TCP',
      },
    ]),
  ],
  providers: [
    TripsService,
    TripDriversService,
    CustomerService,
    ScheduleTripService,
    ProcessPendingTripDriversService,
    AwsS3Service,
    RedisHandler,
  ],
  controllers: [TripsController],
})
export class TripModule {}

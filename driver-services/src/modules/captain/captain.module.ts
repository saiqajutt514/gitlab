import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainService } from './captain.service';
import { CaptainController } from './captain.controller';

import { CaptainEntity } from './captain.entity';
import { CabTypeEntity } from '../cab-type/entities/cab-type.entity';
import { WASLModule } from '../wasl/wasl.module';
import { CarInfoModule } from '../car-info/car-info.module';
import { RedisHandler } from 'src/helpers/redis-handler';
import { HandleWASLDriversService } from 'src/cron/wasl-drivers/handle-wasl-drivers.service';
import { ClientsModule } from '@nestjs/microservices';
import {
  auditLogMicroServiceConfig,
  paymentKafkaConfig,
  paymentTCPConfig,
  reviewsTCPConfig,
  tripKafkaMicroServiceConfig,
  tripTCPMicroServiceConfig,
  socketMicroServiceConfig,
} from 'src/microServicesConfigs';
import { notificationKafkaConfig } from 'src/microServicesConfigs/notification.microservice.config';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import { promoCodesTCPMicroServiceConfig } from 'src/microServicesConfigs/promocode.microservice.config';
import { authTCPMicroServiceConfig } from 'src/microServicesConfigs/auth.microservice.config';
import { adminTCPConfig } from 'src/microServicesConfigs/admin.microservice.config';
@Module({
  imports: [
    TypeOrmModule.forFeature([CaptainEntity, CabTypeEntity]),
    WASLModule,
    CarInfoModule,
    ClientsModule.register([
      {
        ...paymentKafkaConfig,
        name: 'CLIENT_PAYMENT_SERVICE_KAFKA',
      },
      {
        ...paymentTCPConfig,
        name: 'CLIENT_PAYMENT_SERVICE_TCP',
      },
      {
        ...reviewsTCPConfig,
        name: 'CLIENT_REVIEW_SERVICE_TCP',
      },
      {
        ...tripKafkaMicroServiceConfig,
        options: {
          ...tripKafkaMicroServiceConfig.options,
          consumer: {
            groupId: 'trip-consumer-cap',
          },
        },
        name: 'TRIP_KAFKA_CLIENT_SERVICE',
      },
      {
        ...tripTCPMicroServiceConfig,
        name: 'TRIP_TCP_CLIENT_SERVICE',
      },
      {
        ...auditLogMicroServiceConfig,
        name: 'CLIENT_AUDIT_SERVICE',
      },
      {
        ...notificationKafkaConfig,
        name: 'CLIENT_NOTIFY_SERVICE',
      },
      {
        ...socketMicroServiceConfig,
        name: 'CLIENT_SOCKET_SERVICE_KAFKA',
      },
      {
        ...promoCodesTCPMicroServiceConfig,
        name: 'CLIENT_PROMO_SERVICE_TCP',
      },
      {
        ...authTCPMicroServiceConfig,
        name: 'CLIENT_AUTH_SERVICE_TCP',
      },
      {
        ...adminTCPConfig,
        name: 'CLIENT_ADMIN_SERVICE_TCP',
      },
    ]),
  ],
  providers: [
    CaptainService,
    RedisHandler,
    HandleWASLDriversService,
    AwsS3Service,
  ],
  exports: [CaptainService],
  controllers: [CaptainController],
})
export class CaptainModule {}

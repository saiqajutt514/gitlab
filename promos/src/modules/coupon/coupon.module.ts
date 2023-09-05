import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CouponService } from './services/coupon.service';
import { CouponController } from './coupon.controller';
import { PromoCodesRepository } from './repositories/coupon.repolsitory';
import { UserCouponLogService } from './services/log.service';
import { UserCouponLogRepository } from './repositories/user_coupon_log.repository';
import { LoggerModule } from 'src/logger/logger.module';
import { ClientsModule } from '@nestjs/microservices';
import { tripTCPMicroServiceConfig } from 'src/microServiceConfigs/trip.microService.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        ...tripTCPMicroServiceConfig,
        name: 'CLIENT_TRIP_SERVICE_TCP',
      },
    ]),
    TypeOrmModule.forFeature([PromoCodesRepository, UserCouponLogRepository]),
    LoggerModule,
  ],
  controllers: [CouponController],
  providers: [CouponService, UserCouponLogService],
})
export class CouponModule {}

import { Module } from '@nestjs/common';

import { CarInfoService } from './car-info.service';
import { CarInfoController } from './car-info.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarInfoRepository } from './car-info.repository';
import { CaptainEntity } from '../captain/captain.entity';
import { VehicleEntity } from '../vehicle/entities/vehicle.entity';
import { adminTCPConfig } from 'src/microServicesConfigs/admin.microservice.config';
import { authTCPMicroServiceConfig } from 'src/microServicesConfigs/auth.microservice.config';
import { ClientsModule } from '@nestjs/microservices';
@Module({
  imports: [
    TypeOrmModule.forFeature([CarInfoRepository, CaptainEntity, VehicleEntity]),
    ClientsModule.register([
      {
        ...adminTCPConfig,
        name: 'CLIENT_ADMIN_SERVICE_TCP',
      },
      {
        ...authTCPMicroServiceConfig,
        name: 'CLIENT_AUTH_SERVICE_TCP',
      },
    ]),
  ],
  controllers: [CarInfoController],
  providers: [CarInfoService, CaptainEntity],
  exports: [CarInfoService],
})
export class CarInfoModule {}

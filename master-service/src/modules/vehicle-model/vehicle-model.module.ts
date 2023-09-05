import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisHandler } from 'src/helpers/redis-handler';
import { VehicleModelController } from './vehicle-model.controller';
import { VehicleModelService } from './vehicle-model.service';
import { VehicleModelRepository } from './repositories/vehicle-model.repository';
import { VehicleMakerRepository } from '../vehicle-maker/repositories/vehicle-maker.repository';
import { ClientsModule } from '@nestjs/microservices';
import { captainTCPConfig } from 'src/microServicesConfigs/captain.microservice.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        ...captainTCPConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_TCP',
      },
    ]),
    TypeOrmModule.forFeature([VehicleModelRepository, VehicleMakerRepository]),
  ],
  controllers: [VehicleModelController],
  providers: [VehicleModelService, RedisHandler],
})
export class VehicleModelModule {}

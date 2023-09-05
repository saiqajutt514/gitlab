import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisHandler } from 'src/helpers/redis-handler';
import { VehicleMakerController } from './vehicle-maker.controller';
import { VehicleMakerService } from './vehicle-maker.service';
import { VehicleMakerRepository } from './repositories/vehicle-maker.repository';
import { VehicleModelRepository } from '../vehicle-model/repositories/vehicle-model.repository';
import { VehicleModelService } from '../vehicle-model/vehicle-model.service';
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
    TypeOrmModule.forFeature([VehicleMakerRepository, VehicleModelRepository]),
  ],
  controllers: [VehicleMakerController],
  providers: [VehicleMakerService, VehicleModelService, RedisHandler],
})
export class VehicleMakerModule {}

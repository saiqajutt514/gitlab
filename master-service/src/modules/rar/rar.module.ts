import { Module } from '@nestjs/common';
import { RarService } from './rar.service';
import { RarController } from './rar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VIRepo } from './repository/rar.repository';
import { VehicleMakerRepository } from '../vehicle-maker/repositories/vehicle-maker.repository';
import { VehicleModelRepository } from '../vehicle-model/repositories/vehicle-model.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VIRepo,
      VehicleMakerRepository,
      VehicleModelRepository,
    ]),
  ],
  controllers: [RarController],
  providers: [RarService],
})
export class RarModule {}

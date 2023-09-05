import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisHandler } from 'src/helpers/redis-handler';
import { VehicleClassController } from './vehicle-class.controller';
import { VehicleClassService } from './vehicle-class.service';
import {VehicleClassRepository} from './repositories/vehicle-class.repository'

@Module({
  imports: [TypeOrmModule.forFeature([VehicleClassRepository])],
  controllers: [VehicleClassController],
  providers: [VehicleClassService,RedisHandler]
})
export class VehicleClassModule {}

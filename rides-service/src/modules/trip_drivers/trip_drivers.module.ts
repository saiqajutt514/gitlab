import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TripDriversService } from './trip_drivers.service';
import { TripDriverRepository } from './trip_drivers.repository';
import { TripDriversController } from './trip_drivers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TripDriverRepository])],
  providers: [TripDriversService],
  controllers: [TripDriversController],
})
export class TripDriversModule {}

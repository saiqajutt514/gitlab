import { Module } from '@nestjs/common';
import { HighDemandZoneService } from './high-demand-zone.service';
import { HighDemandZoneController } from './high-demand-zone.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { highDemandZoneEntity } from './entities/high-demand-zone.entity';
import { CustomerModule } from '../customer/customer.module';
import { RedisHandler } from 'src/helpers/redis-handler';

@Module({
  imports: [TypeOrmModule.forFeature([highDemandZoneEntity]), CustomerModule],
  controllers: [HighDemandZoneController],
  providers: [HighDemandZoneService, RedisHandler],
})
export class HighDemandZoneModule {}

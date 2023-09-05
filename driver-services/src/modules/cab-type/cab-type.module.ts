import { Module } from '@nestjs/common';

import { CabTypeService } from './cab-type.service';
import { CabTypeController } from './cab-type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CabTypeRepository } from './cab-type.repository';
import { RedisHandler } from 'src/helpers/redis-handler';
import { CaptainModule } from '../captain/captain.module';
import { CaptainService } from '../captain/captain.service';

@Module({
  imports: [TypeOrmModule.forFeature([CabTypeRepository]), CaptainModule],
  controllers: [CabTypeController],
  providers: [CabTypeService, RedisHandler],
  exports: [CabTypeService],
})
export class CabTypeModule {}

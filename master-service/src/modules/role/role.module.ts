import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { RoleRepository } from './role.repository'
import { RedisHandler } from 'src/helpers/redis-handler';
@Module({
  imports: [TypeOrmModule.forFeature([RoleRepository])],
  controllers: [RoleController],
  providers: [RoleService, RedisHandler],
  exports: [RoleService],
})
export class RoleModule {}

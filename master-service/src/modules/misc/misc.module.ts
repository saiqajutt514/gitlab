import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiscController } from './misc.controller';
import { MiscService } from './misc.service';
import { SettingRepository } from './repositories/setting.repository';
import { RedisHandler } from 'src/helpers/redis-handler';
import { ClientsModule } from '@nestjs/microservices';
import { auditLogMicroServiceConfig } from 'src/microServicesConfigs/audit.microservice.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([SettingRepository]),
    ClientsModule.register([
      {
        ...auditLogMicroServiceConfig,
        name: 'CLIENT_AUDIT_SERVICE_KAFKA'
      }
    ])
  ],
  controllers: [MiscController],
  providers: [MiscService, RedisHandler]
})
export class MiscModule {}

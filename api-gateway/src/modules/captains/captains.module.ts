import { Module } from '@nestjs/common';
import { MasterController } from './master.controller';
import { CaptainController } from './captains.controller';
import { CaptainService } from './captains.services';
import { AdminService } from '../admin/admin.service';
import { AwsS3Service } from '../../helpers/aws-s3-service';

import { UserModule } from '../user/user.module';
import { RedisHandler } from 'src/helpers/redis-handler';
import { ClientsModule } from '@nestjs/microservices';
import { captainKafkaConfig, reviewsTCPConfig } from 'src/microServiceConfigs';
import { authTCPMicroServiceConfig } from 'config/authServiceConfig';

@Module({
  imports: [
    UserModule,
    ClientsModule.register([
      {
        ...captainKafkaConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_KAFKA',
      },
      {
        ...reviewsTCPConfig,
        name: 'CLIENT_REVIEW_SERVICE_TCP',
      },
      {
        ...authTCPMicroServiceConfig,
        name: 'CLIENT_AUTH_SERVICE_TCP',
      },
    ]),
  ],
  controllers: [CaptainController, MasterController],
  providers: [CaptainService, AdminService, AwsS3Service, RedisHandler],
})
export class CaptainModule {}

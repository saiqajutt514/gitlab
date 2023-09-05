import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MasterController } from './master.controller';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import appConfig from 'config/appConfig';
import { RedisHandler } from 'src/helpers/redis-handler';
import { ClientsModule } from '@nestjs/microservices';
import { captainKafkaConfig, reviewsTCPConfig } from 'src/microServiceConfigs';
import { authTCPMicroServiceConfig } from 'config/authServiceConfig';

@Module({
  imports: [
    JwtModule.register({
      secret: appConfig().JwtSecret,
      signOptions: { expiresIn: appConfig().JwtExpires },
    }),
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
  controllers: [AdminController, MasterController],
  providers: [AdminService, AwsS3Service, RedisHandler],
})
export class AdminModule {}

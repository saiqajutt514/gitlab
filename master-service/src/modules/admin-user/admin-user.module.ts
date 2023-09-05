import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { AdminUserRepository } from './admin-user.repository';
import { NotifyUserRepository } from './repositories/notify-user.repository';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import appConfig from 'config/appConfig';
import { ClientsModule } from '@nestjs/microservices';
import { notificationMicroServiceConfig } from 'src/microServicesConfigs/notification.microservice.config';

@Module({
  imports: [
    JwtModule.register({
      secret: appConfig().JwtSecret,
      signOptions: { expiresIn: '60s' }
    }),
    TypeOrmModule.forFeature([AdminUserRepository, NotifyUserRepository]),
    ClientsModule.register([
      {
        ...notificationMicroServiceConfig,
        name: 'CLIENT_NOTIFY_SERVICE_KAFKA'
      }
    ])
  ],
  controllers: [AdminUserController],
  providers: [AdminUserService, AwsS3Service],
  exports: [AdminUserService]
})
export class AdminUserModule { }

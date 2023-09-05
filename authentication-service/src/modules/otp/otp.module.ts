import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpEntity } from './entities/otp.entity';
import { SmsModule } from '../sms/sms.module';
import { ClientsModule } from '@nestjs/microservices';
import { captainTCPConfig } from 'src/microServicesConfigs/captain.microService.config';
import { YakeenModule } from '../yakeen/yakeen.module';
import { tripTCPMicroServiceConfig } from 'src/microServicesConfigs';
import { RedisHandler } from 'src/helpers/redis-handler';
import { OtpFailedLogsRepo } from './repo/otpFailLogs.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([OtpEntity, OtpFailedLogsRepo]),
    SmsModule,
    YakeenModule,
    ClientsModule.register([
      {
        ...captainTCPConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_KAFKA',
      },
      {
        ...tripTCPMicroServiceConfig,
        name: 'CLIENT_TRIP_SERVICE_KAFKA',
      },
    ]),
  ],
  controllers: [OtpController],
  providers: [OtpService, RedisHandler],
  exports: [OtpService],
})
export class OtpModule {}

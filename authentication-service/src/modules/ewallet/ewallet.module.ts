import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { tripMicroServiceConfig, chatMicroServiceConfig, tripTCPMicroServiceConfig } from 'src/microServicesConfigs';
import { RedisHandler } from 'src/helpers/redis-handler';
import { EwalletController } from './ewallet.controller';
import { EwalletService } from './ewallet.service';

@Module({
  imports: [ClientsModule.register([
    {
      ...tripMicroServiceConfig,
      name: 'CLIENT_TRIP_SERVICE_KAFKA'
    },
    {
      ...chatMicroServiceConfig,
      name: 'CLIENT_CHAT_SERVICE_KAFKA'
    },
    {
      ...tripTCPMicroServiceConfig,
      name: 'CLIENT_TRIP_SERVICE_TCP'
    }
  ])],
  controllers: [EwalletController],
  providers: [EwalletService, RedisHandler]
})
export class EwalletModule {}

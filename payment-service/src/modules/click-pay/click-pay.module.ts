import { Module } from '@nestjs/common';
import { ClickPayService } from './click-pay.service';
import { ClickPayController } from './click-pay.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClickpayEntity } from './entities/click-pay.entity';
import { TransferModule } from '../transfer/transfer.module';
import { RedisHandler } from 'src/helpers/redis-handler';
import { TransactionModule } from '../transactions/transaction.module';
import { TransactionService } from '../transactions/transaction.service';
import { ClientsModule } from '@nestjs/microservices';
import { captainTCPConfig } from 'src/microServicesConfigs';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClickpayEntity]),
    TransferModule,
    TransactionModule,
    ClientsModule.register([
      {
        ...captainTCPConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_TCP',
      },
    ]),
  ],
  controllers: [ClickPayController],
  providers: [ClickPayService],
})
export class ClickPayModule {}

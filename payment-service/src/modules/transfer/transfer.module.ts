import { HttpModule, Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionRepository } from '../transactions/transaction.repository';

// import { WalletService } from '../wallet/wallet.service';
// import { WalletModule } from '../wallet/wallet.module';
import { ClientsModule } from '@nestjs/microservices';
import { captainTCPConfig, paymentTCPConfig } from 'src/microServicesConfigs';
import { WalletEntity } from './entites/wallet.entity';
import { holdAmountEntity } from './entites/hold-amount.entity';
import { subscriptionsEntity } from './entites/subscriptions.entity';
import { WalletRepository } from './entites/wallet.repository';
import { AlinmaB2BModule } from '../alinma-b2-b/alinma-b2-b.module';
import { RedisHandler } from 'src/helpers/redis-handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionRepository,
      // WalletRepository,
      WalletEntity,
      holdAmountEntity,
      subscriptionsEntity,
    ]),
    HttpModule,
    AlinmaB2BModule,
    ClientsModule.register([
      {
        ...captainTCPConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_TCP',
      },
    ]),
  ],
  controllers: [TransferController],
  providers: [TransferService, RedisHandler],
  exports: [TransferService],
})
export class TransferModule {}

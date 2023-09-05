import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSubscriptionController } from './user-subscription.controller';
import { UserSubscriptionService } from './user-subscription.service';

import { TransactionService } from '../transactions/transaction.service';
import { RenewSubscriptions } from 'src/cron/renew-subscriptions/renew-subscriptions.service';

import { UserSubscriptionRepository } from './user-subscription.repository';
import { TransactionRepository } from '../transactions/transaction.repository';
import { TransferService } from '../transfer/transfer.service';
import { SubscriptionRepository } from '../subscription/subscription.repository';
import { SubscriptionService } from '../subscription/subscription.service';
import { RedisHandler } from 'src/helpers/redis-handler';
import { ClientsModule } from '@nestjs/microservices';
import {
  captainKafkaConfig,
  captainTCPConfig,
  notificationKafkaConfig,
  tripKafkaMicroServiceConfig,
  tripTCPMicroServiceConfig,
} from 'src/microServicesConfigs';
import { subscriptionsEntity } from '../transfer/entites/subscriptions.entity';
import { WalletEntity } from '../transfer/entites/wallet.entity';
import { holdAmountEntity } from '../transfer/entites/hold-amount.entity';
import { AlinmaB2BModule } from '../alinma-b2-b/alinma-b2-b.module';
import { AlinmaB2BService } from '../alinma-b2-b/alinma-b2-b.service';
import { alinmaTransactionsEntity } from '../alinma-b2-b/entities/alinma-trasactions.entity';
import { alinmaHistoryEntity } from '../alinma-b2-b/entities/alinma-history.entity';
import { IbanService } from '../iban/iban.service';
import { IbanEntity } from '../iban/entities/iban.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserSubscriptionRepository,
      TransactionRepository,
      SubscriptionRepository,
      subscriptionsEntity,
      WalletEntity,
      holdAmountEntity,
      alinmaTransactionsEntity,
      alinmaHistoryEntity,
      IbanEntity,
    ]),
    AlinmaB2BModule,
    ClientsModule.register([
      {
        ...captainKafkaConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_KAFKA',
      },
      {
        ...tripKafkaMicroServiceConfig,
        name: 'TRIP_KAFKA_CLIENT_SERVICE',
      },
      {
        ...tripTCPMicroServiceConfig,
        name: 'TRIP_TCP_CLIENT_SERVICE',
      },
      {
        ...notificationKafkaConfig,
        name: 'CLIENT_NOTIFICATION_SERVICE_KAFKA',
      },
      {
        ...captainTCPConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_TCP',
      },
    ]),
  ],
  controllers: [UserSubscriptionController],
  providers: [
    UserSubscriptionService,
    TransactionService,
    SubscriptionService,
    TransferService,
    RenewSubscriptions,
    RedisHandler,
    AlinmaB2BService,
    IbanService,
  ],
})
export class UserSubscriptionModule {}

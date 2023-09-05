import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from 'config/typeOrmConfig';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { UserSubscriptionModule } from './modules/user-subscriptions/user-subscription.module';
import { TransactionModule } from './modules/transactions/transaction.module';
import { TransferModule } from './modules/transfer/transfer.module';
import { LoggerModule } from 'nestjs-pino';
// import { WalletModule } from './modules/wallet/wallet.module';
import { ClickPayModule } from './modules/click-pay/click-pay.module';
import { IbanModule } from './modules/iban/iban.module';
import { AlinmaB2BModule } from './modules/alinma-b2-b/alinma-b2-b.module';

console.log('in app module', typeOrmConfig);
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(),
    SubscriptionModule,
    UserSubscriptionModule,
    TransactionModule,
    TransferModule,
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'payment-service',
        level: 'debug',
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      },
    }),
    ClickPayModule,
    IbanModule,
    AlinmaB2BModule,
    // WalletModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { UserSubscriptionRepository } from '../user-subscriptions/user-subscription.repository';
import { IbanService } from '../iban/iban.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionRepository]),
    UserSubscriptionRepository,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, UserSubscriptionRepository],
})
export class SubscriptionModule {}

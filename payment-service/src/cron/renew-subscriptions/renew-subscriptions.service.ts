import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserSubscriptionService } from 'src/modules/user-subscriptions/user-subscription.service';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class RenewSubscriptions {
    private readonly logger = new LoggerHandler(RenewSubscriptions.name).getInstance();
    
    constructor(private userSubscriptionService: UserSubscriptionService) { }
    
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    handleRenewSubscriptionsCron() {
        this.logger.debug('Called at mid-night');
        this.userSubscriptionService.processRenewSubscriptions();
    }
}

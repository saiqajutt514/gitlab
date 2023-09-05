import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { CaptainService } from 'src/modules/captain/captain.service';

@Injectable()
export class HandleWASLDriversService {
  private readonly logger = new LoggerHandler(
    HandleWASLDriversService.name,
  ).getInstance();
  constructor(private captainService: CaptainService) {}

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // handleUpdateDriverStatus() {
  //   this.logger.debug('Called EVERY_DAY_AT_MIDNIGHT');
  //   this.captainService.findAndUpdateDriverStatus()
  // }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleWASLDrivers() {
    this.logger.debug('[handleWASLDrivers] Called EVERY_DAY_AT_MIDNIGHT');
    this.captainService.findAndNotifyWASLDriversWillExpired();
    this.captainService.disapproveWASLExpiredDrivers();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleWASLEligibilityCheck() {
    this.logger.debug('[handleWASLEligibilityCheck] Called EVERY_5_MINUTES');
    this.captainService.findAndNotifyDriversForWASLEligibility();
  }
}

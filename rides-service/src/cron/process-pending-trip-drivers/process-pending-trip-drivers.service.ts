import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { TripsService } from 'src/modules/trips/trips.service';

@Injectable()
export class ProcessPendingTripDriversService {
  private readonly logger = new Logger(ProcessPendingTripDriversService.name);

  constructor(private tripsService: TripsService) {
    // this.logger.log("calling cron 1")
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  handlePendingTripDriversCron() {
    this.logger.debug('Called every 5 mints');
    this.tripsService.findAndExpireAllPendingTripDrivers();
  }
}

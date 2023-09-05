import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TripsService } from 'src/modules/trips/trips.service';

@Injectable()
export class ScheduleTripService {
    private readonly logger = new Logger(ScheduleTripService.name);

    constructor(private tripsService: TripsService) { }

    @Cron(CronExpression.EVERY_5_MINUTES)
    handleScheduleTripsCron() {
        this.logger.debug('Called every 5 minutes');
        this.tripsService.notifyRidersForScheduledTrips()
        this.tripsService.processScheduledTrips()
    }
}

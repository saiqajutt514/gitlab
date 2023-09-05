import { TripDriverStatus } from '../enum/trip_drivers.enum';
import { TripsEntity } from '../../trips/entities/trips.entity';

export class CreateTripDriverDto {
  driverId?: any;
  trip?: any;
  expiredAt?: any;
  requestedStatus?: any;
  driverGroupId?: any;
}

export class UpdateTripDriverDto {
  status: TripDriverStatus;
  declinedReason?: string;
  driverRequested?: number;
  expiredAt?: Date | string;
}

export class FineOneTripDriverDto {
  id?: string;
  tripId?: string;
  driverId?: string;
  status?: TripDriverStatus;
  expiredAt?: Date | string;
  select?: string[];
  relations?: string[];
}

export class FindByTripAndDriverIdDto {
  trip?: TripsEntity;
  driverId: string;
}
export class PendingTripDriver {
  id: string;
  driverId: string;
}

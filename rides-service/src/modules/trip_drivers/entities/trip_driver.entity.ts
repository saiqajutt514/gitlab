import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "transportation-common";

import { TripDriverStatus, TripDriverRequestedStatus } from "../enum/trip_drivers.enum";
import { TripsEntity } from "src/modules/trips/entities/trips.entity";

@Entity('trip_drivers')
@Index(['driverId'])
@Index(['trip'])
@Index(['status'])
export class TripDriver extends AbstractEntity {

  @Column()
  driverId: string;

  @ManyToOne(() => TripsEntity, trip => trip.drivers)
  trip: TripsEntity;

  @Column({ type: 'enum', enum: TripDriverStatus, default: TripDriverStatus.PENDING })
  status: TripDriverStatus;

  @Column({ nullable: true, type: 'enum', enum: TripDriverRequestedStatus, default: TripDriverRequestedStatus.TRIP_INITIATE, comment: "Stores state of trip when driver was requested" })
  requestedStatus: TripDriverRequestedStatus;

  @Column({ nullable: true, default: 1, comment: "Stores requests count of trip particular state" })
  driverGroupId: number;

  @Column({ nullable: true, default: 1, comment: "Number of times driver has been requested" })
  driverRequested: number;

  @Column({ nullable: true })
  declinedReason: string;

  @Column({ type: 'datetime', nullable: true, comment: "Expired time for driver to take action on request" })
  expiredAt: Date;

}
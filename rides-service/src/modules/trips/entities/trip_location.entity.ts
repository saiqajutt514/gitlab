import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "transportation-common";

import { TripsEntity } from "src/modules/trips/entities/trips.entity";
import { TripUserType } from "../trips.enum";

@Entity('trip_locations')
@Index(['trip'])
export class TripLocation extends AbstractEntity {
  
  @Column({ type: 'enum', enum: TripUserType, default: TripUserType.DRIVER, comment: "to which user the location belongs" })
  userType: number;

  @Column({ type: 'double' })
  latitude: number;

  @Column({ type: 'double' })
  longitude: number;

  @ManyToOne(() => TripsEntity, trip => trip.locations)
  trip: TripsEntity;
  
}
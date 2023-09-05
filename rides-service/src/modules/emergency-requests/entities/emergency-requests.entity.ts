import { Entity, Column, OneToOne, ManyToOne, Index, JoinColumn } from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import { TRIP_STATUS, ISSUE_STATUS } from '../enums/emergency-request.enum';
import { TripsEntity } from '../../trips/entities/trips.entity';
import { CustomerEntity } from 'src/modules/customer/entities/customer.entity';

@Entity('emergency_requests')
@Index(['tripStatus'])
@Index(['issueStatus'])
@Index(['rider'])
export class EmergencyRequestsEntity extends AbstractEntity {

  @Column()
  reason: string;

  @Column({ nullable: true })
  comments: string;

  @Column({ nullable: true, comment: "Request exact location" })
  location: string;

  @Column({ type: 'double', nullable: true, comment: "Request location latitude" })
  latitude: number;

  @Column({ type: 'double', nullable: true, comment: "Request location longitude" })
  longitude: number;

  @Column({ nullable: true, comment: "Resolve remarks of emergency request" })
  remarks: string;

  @Column({ type: 'tinyint', default : TRIP_STATUS.ONGOING })
  tripStatus: number

  @Column({ type: 'tinyint', default : ISSUE_STATUS.OPEN })
  issueStatus: number

  @ManyToOne(() => CustomerEntity, customer => customer.requests, { eager: false, nullable: true })
  @JoinColumn({ name: 'riderId', referencedColumnName: 'userId' })
  rider: CustomerEntity;

  @OneToOne(() => TripsEntity, trip => trip.request, { eager: false, nullable: true })
  @JoinColumn()
  trip: TripsEntity;

  @OneToOne(() => TripsEntity, trip => trip.assigned, { eager: false, nullable: true })
  @JoinColumn()
  newTrip: TripsEntity;

  @Column({ length: 36, nullable: true })
  modifiedBy: string;

  @Column({ length: 36, nullable: true })
  assignedBy: string;

  @Column({ length: 36, nullable: true })
  resolvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt: Date;

}
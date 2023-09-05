import { CabTypeEntity } from 'src/modules/cab-type/entities/cab-type.entity';
import { CarInfoEntity } from 'src/modules/car-info/entities/car-info.entity';
import { AbstractEntity } from 'transportation-common';
import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
  OneToOne,
  Unique,
} from 'typeorm';

import {
  CAR_LICENCE_TYPE,
  DRIVING_MODE,
  WASL_ELIGIBILITY_STATUS,
} from './constants/index';

@Entity('captain')
@Unique(['externalId'])
@Unique(['driverNationalId'])
@Index(['cab'])
@Index(['approved', 'driverModeSwitch'])
export class CaptainEntity extends AbstractEntity {
  @Column({ comment: 'Driver name to be displayed' })
  driverName: string;

  @Column({ length: 20, nullable: true, comment: 'e-wallet id of driver' })
  externalId: string;

  @Column({ comment: 'Driver National id' })
  driverNationalId: string;

  @Column({ comment: 'Car Licence Plate No' })
  carPlateNo: string;

  @Column({ comment: 'Car Sequence No' }) // its car modal no // need to confirm
  carSequenceNo: string;

  @Column({
    type: 'enum',
    enum: CAR_LICENCE_TYPE,
    comment: 'Car Licence Plate type',
  })
  carLicenceType: CAR_LICENCE_TYPE;

  @ManyToOne(() => CabTypeEntity, (cab) => cab.id, {
    eager: false,
    nullable: true,
  })
  cab: CabTypeEntity;

  @OneToOne(() => CarInfoEntity, (car) => car.driver, {
    eager: false,
    nullable: true,
  })
  @JoinColumn()
  car: CarInfoEntity;

  @Column({
    type: 'set',
    enum: DRIVING_MODE,
    nullable: true,
    default: [DRIVING_MODE.PASSENGER_RIDE],
  })
  drivingModes: DRIVING_MODE[];

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Driver blocked reason by admin',
  })
  blockedReason: string;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'Driver blocked date by admin',
  })
  blockedDate: string;

  @Column({ default: true, comment: 'Status of driver approval' })
  approved: boolean;

  @Column({ default: false, comment: 'Accept TC before subscribing' })
  acceptTC: boolean;

  @Column({ default: true, comment: 'Change status of driver mode on/off' })
  driverModeSwitch: boolean;

  @Column({
    default: false,
    comment: 'Change status of driver ride true/false',
  })
  driverRideStatus: boolean;

  @Column({ type: 'tinyint', default: 0 })
  driverSubStatus: number;

  @Column({ nullable: true })
  driverSubscriptionId: string;

  @Column({ nullable: true, length: 100 })
  iban: string;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Subscription amount driver needs to pay to become a captain',
  })
  driverSubAmount: number;

  @Column({ type: 'float', default: 0 })
  driverRating: number;

  @Column({ type: 'integer', default: 0 })
  driverReviews: number;

  @Column({ type: 'double', nullable: true })
  latitude: number;

  @Column({ type: 'double', nullable: true })
  longitude: number;

  @Column({ type: 'date', nullable: true, default: '2023-01-27' })
  eligibilityExpiryDate: Date;

  @Column({
    nullable: true,
    default: 0,
    comment: 'Number of times driver has notified for eligibility expiry',
  })
  notifiedForEligibilityExpiry: number;

  @Column({
    type: 'tinyint',
    default: WASL_ELIGIBILITY_STATUS.PENDING,
    nullable: false,
    comment: "Driver's WASL eligibility status",
  })
  isWASLApproved: WASL_ELIGIBILITY_STATUS;

  @Column({
    type: 'text',
    nullable: true,
    comment: "Driver's WASL eligibility rejection reason(s)",
  })
  WASLRejectionReasons: string;

  @Column({ default: true, comment: 'if captain is online' })
  isOnline: boolean;
}

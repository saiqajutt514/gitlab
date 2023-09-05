import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Generated,
  Unique,
  Index,
  OneToOne,
  AfterLoad,
  ViewColumn,
} from 'typeorm';
import { AbstractEntity } from 'transportation-common';

import {
  TripType,
  TripStatus,
  TransactionStatus,
  TripCreatedBy,
  TripPreviousStatus,
  TripSource,
} from '../trips.enum';
import { TripAddressEntity } from '../../trip_address/trip_address.entity';
import { TripDriver } from '../../trip_drivers/entities/trip_driver.entity';
import { TripImagesEntity } from '../../trip_images/trip_images.entity';
import { CustomerEntity } from '../../customer/entities/customer.entity';
import { EmergencyRequestsEntity } from 'src/modules/emergency-requests/entities/emergency-requests.entity';
import { TripLocation } from './trip_location.entity';

@Entity('trips')
@Unique(['tripNo'])
@Index(['riderId'])
@Index(['driverId'])
@Index(['cabId'])
@Index(['tripType'])
@Index(['status'])
@Index(['completed'])
@Index(['cancelledBy'])
export class TripsEntity extends AbstractEntity {
  @Column({ type: 'bigint' })
  @Generated('increment')
  tripNo: number;

  @Column({ comment: 'Rider id who will create trip' })
  riderId: string;

  @Column({
    nullable: true,
    comment: 'Driver Id who will accept, reject, cancel or complete the trip',
  })
  driverId: string;

  @Column({
    nullable: true,
    comment: 'For verification at starting of trip done by driver',
  })
  tripOtp: number;

  @Column({ nullable: true, default: false, comment: 'OTP verified or not' })
  tripVerified: boolean;

  @OneToMany(() => TripAddressEntity, (address) => address.trip, {
    cascade: true,
    eager: true,
  }) // contains all 4 addresses origin, destination, changed destination and drop off
  addresses: TripAddressEntity[];

  @Column({ default: false, comment: 'Flag to change destination once' })
  changedDestination: boolean;

  @Column({ default: 0, comment: 'No.of destinations changed for a trip' })
  changedDestinationCount: number;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'original distance that should be covered in KM',
  })
  tripDistance: number;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'actual distance that has been covered in KM',
  })
  tripDistanceCovered: number;

  @Column({
    nullable: true,
    comment: 'In which kind of cab rider want to travel',
  })
  cabId: string;

  @OneToMany(() => TripDriver, (driver) => driver.trip, {
    cascade: true,
    eager: true,
  })
  drivers: TripDriver[];

  @Column({
    type: 'enum',
    enum: TripType,
    default: TripType.IMMEDIATELY,
    comment: 'Trip type scheduled or immediate',
  })
  tripType: TripType;

  @Column({
    type: 'enum',
    enum: TripSource,
    default: TripSource.RIDE_APP,
    comment: 'Trip source by app, dashboard or any other',
  })
  source: TripType;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.PENDING,
    comment: 'Trip Status',
  })
  status: TripStatus;

  @Column({
    nullable: true,
    type: 'enum',
    enum: TripPreviousStatus,
    default: TripPreviousStatus.IN_PROGRESS,
    comment: 'Stores previous detailed status of trip',
  })
  previousStatus: TripPreviousStatus;

  @Column({ length: 36, nullable: true })
  riderReviewId: string;

  @Column({ length: 36, nullable: true })
  driverReviewId: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'enum', enum: TransactionStatus, nullable: true })
  transactionStatus: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  zatcaQR: string;

  @Column({
    nullable: true,
    default: false,
    comment: 'User paid fare charges or not',
  })
  paid: boolean;

  @Column({
    nullable: true,
    default: false,
    comment: 'Trip is completed or not',
  })
  completed: boolean;

  @Column({
    length: 36,
    nullable: true,
    comment: 'Who cancelled the trip name of driver or rider',
  })
  cancelledBy: string;

  @Column({
    nullable: true,
    comment: 'Trp cancellation reason by driver or rider',
  })
  cancelledReason: string;

  @Column({
    nullable: true,
    default: 0,
    comment: 'Number of times driver has cancelled the trip',
  })
  cancelledByDriver: number;

  @Column({
    nullable: true,
    comment: 'which promo code has been used its code number',
  })
  promoCode: string;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Estimated Base amount for scheduled trips',
  })
  estimatedBaseAmount: number;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Estimated Trip duration in minutes given by google api',
  })
  estimatedTripTime: number;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Actual Trip duration in minutes',
  })
  tripTime: number;

  @Column({
    type: 'float',
    nullable: true,
    default: 0,
    comment: 'Promo code value in float',
  })
  promoCodeAmount: number;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Amount to be paid by rider at the end of trip',
  })
  riderAmount: number;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Amount to be paid to driver',
  })
  driverAmount: number;

  @Column({ type: 'float', nullable: true, comment: 'Cab Base fare' })
  baseFare: number;

  @Column({ type: 'float', nullable: true, comment: 'Cab Cost per Minute' })
  costPerMin: number;

  @Column({ type: 'float', nullable: true, comment: 'Cab Cost per KM' })
  costPerKm: number;

  @Column({
    type: 'float',
    default: 1,
    nullable: true,
    comment: 'Fare multiplier rate on occassions',
  })
  fareMultiplier: number;

  @Column({ type: 'float', nullable: true, comment: 'Base fare amount' })
  tripBaseAmount: number;

  @Column({
    type: 'float',
    nullable: true,
    default: 0,
    comment: 'Calculated Tax of the trip based on admin given percentage',
  })
  taxAmount: number;

  @Column({
    type: 'float',
    nullable: true,
    default: 0,
    comment: 'Tax percentage applied for this trip given by admin',
  })
  taxPercentage: number;

  @Column({
    type: 'float',
    default: 0,
    nullable: true,
    comment: 'Ministry of Transportation fee',
  })
  motAmount: number;

  @Column({ type: 'float', default: 0, nullable: true, comment: 'wasl fee' })
  waslFee: number;

  @Column({
    type: 'float',
    default: 0,
    nullable: true,
    comment: 'processing fee',
  })
  processingFee: number;

  @Column({
    type: 'float',
    default: 0,
    nullable: true,
    comment: 'transactionFee fee',
  })
  transactionFee: number;

  @Column({
    type: 'float',
    default: 0,
    nullable: true,
    comment: 'withdrawalFee fee',
  })
  withdrawalFee: number;

  @Column({
    type: 'float',
    nullable: true,
    default: 0,
    comment: ' Waiting charge per min',
  })
  waitingCharge: number;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'when did rider pay fare amount',
  })
  riderPaidAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'When did driver arrive at pick up location',
  })
  driverReachedAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'when did trip start from pick up location',
  })
  tripStartedAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'When did trip finish arriving at desired location',
  })
  tripFinishedAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'When did driver accept the trip',
  })
  driverAssignedAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'When did rider schedule his/her trip',
  })
  riderScheduledAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'When did rider notified for scheduled trip confirmation',
  })
  riderNotifiedAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'When did trip get cancelled by driver or rider',
  })
  tripCancelledAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'When did trip get cancelled by driver',
  })
  cancelledByDriverAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'when did trip expired if no driver has accepted',
  })
  tripExpiredAt: Date;

  @Column({
    type: 'enum',
    enum: TripCreatedBy,
    default: TripCreatedBy.CUSTOMER,
    comment: 'Trip request created by',
  })
  createdType: TripCreatedBy;

  @Column({ length: 36, nullable: true, comment: 'Customer id or Admin id' })
  createdBy: string;

  @OneToMany(() => TripImagesEntity, (images) => images.trip, {
    cascade: true,
    eager: true,
  })
  images: TripImagesEntity[];

  @ManyToOne(() => CustomerEntity, (customer) => customer.trips, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'driverId', referencedColumnName: 'userId' })
  driver: CustomerEntity;

  @ManyToOne(() => CustomerEntity, (customer) => customer.rides, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'riderId', referencedColumnName: 'userId' })
  rider: CustomerEntity;

  @OneToOne(() => TripAddressEntity, (address) => address.trip, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  pickup: TripAddressEntity;

  @OneToOne(() => TripAddressEntity, (address) => address.trip, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  dropoff: TripAddressEntity;

  @OneToOne(() => TripAddressEntity, (address) => address.trip, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  destination: TripAddressEntity;

  @OneToOne(() => EmergencyRequestsEntity, (request) => request.trip, {
    eager: false,
    nullable: true,
  })
  request: EmergencyRequestsEntity;

  @OneToOne(() => EmergencyRequestsEntity, (assigned) => assigned.newTrip, {
    eager: false,
    nullable: true,
  })
  assigned: EmergencyRequestsEntity;

  @OneToMany(() => TripLocation, (location) => location.trip, {
    cascade: true,
    eager: true,
  })
  locations: TripLocation[];
}

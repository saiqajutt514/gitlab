import { Column, Entity, OneToMany, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import { CustomerInterface } from '../customer.interface';
import { UserExternalType } from 'src/modules/trips/enums/driver.enum';
import { TripsEntity } from '../../trips/entities/trips.entity';
import { EmergencyRequestsEntity } from 'src/modules/emergency-requests/entities/emergency-requests.entity';

@Entity({ name: 'customer' })
@Index(['userId'], { unique: true })
@Index(['userType'])
@Index(['driverId'])
export class CustomerEntity
  extends AbstractEntity
  implements CustomerInterface {
  @Column({ type: 'bigint' })
  userId: number;

  @Column({ type: 'bigint', nullable: true, default: null })
  idNumber: number;

  @Column({ type: 'tinyint', default: 0, nullable: true })
  kycStatus: number;

  @Column({ type: 'tinyint', default: 0 })
  isKycRequired: number;

  @Column({ nullable: true })
  idExpiryDate: string;

  @Column({ nullable: true })
  userStatus: string;

  @Column({ default: false })
  approvalStatus: boolean;

  @Column({ nullable: true })
  authStatus: string;

  @Column({ nullable: true })
  agentId: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  arabicFirstName: string;

  @Column({ nullable: true })
  arabicLastName: string;

  @Column({ nullable: true })
  emailId: string;

  @Column({ unique: true })
  mobileNo: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  address1: string;

  @Column({ nullable: true })
  address2: string;

  @Column({ nullable: true })
  regionId: string;

  @Column({ nullable: true })
  pinCode: string;

  @Column({ nullable: true })
  activationDate: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  subStatus: string;

  @Column({ nullable: true })
  creationDate: string;

  @Column({ nullable: true })
  modificationDate: string;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  deviceToken: string;

  @Column({ nullable: true })
  clientOs: string;

  @Column({ nullable: true })
  prefferedLanguage: string;

  @Column({ nullable: true })
  socialId: string;

  @Column({ nullable: true })
  socialProfile: string;

  @Column({ nullable: true })
  appVersion: string;

  @Column({ nullable: true })
  deviceName: string;

  @Column({ nullable: true })
  smsEnable: string;

  @Column({ nullable: true })
  emailEnable: string;

  @Column({ nullable: true })
  notificationEnable: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true, type: 'text' })
  otherDetails: string;

  @Column({ nullable: true, type: 'double' })
  latitude: number;

  @Column({ nullable: true, type: 'double' })
  longitude: number;

  @Column({
    nullable: true,
    type: 'text',
    comment: 'For any additional information',
  })
  additionalInfo: string;

  @Column({ nullable: true, default: 0 })
  totalRides: number;

  @Column({ nullable: true, default: 0 })
  upcomingRides: number;

  @Column({ nullable: true, default: 0 })
  ridesCancelled: number;

  @Column({ nullable: true, default: 0 })
  totalTrips: number;

  @Column({ nullable: true, default: 0 })
  tripsDeclined: number;

  @Column({ nullable: true, default: 0 })
  tripsCancelled: number;

  @Column({ type: 'float', default: 0 })
  riderRating: number;

  @Column({ type: 'integer', default: 0 })
  riderReviews: number;

  @Column({ type: 'float', default: 0 })
  driverRating: number;

  @Column({ type: 'float', default: 0 })
  totalEarned: number;

  @Column({ type: 'float', default: 0 })
  totalSpent: number;

  @Column({ type: 'integer', default: 0 })
  driverReviews: number;

  @Column({
    nullable: true,
    type: 'enum',
    enum: UserExternalType,
    default: UserExternalType.Rider,
  })
  userType: UserExternalType;

  @Column({ nullable: true })
  driverId: string;

  @Column({ nullable: true, comment: "Driver's Cab Id" })
  cabId: string;

  @Column({
    nullable: true,
    default: false,
    comment: 'TRUE if atleast one ride requested',
  })
  isRider: boolean;

  @Column({
    type: 'integer',
    default: false,
    nullable: true,
    comment: 'OTP for dispatcher create trip',
  })
  customerOtp: number;

  @OneToMany(() => TripsEntity, (trips) => trips.driver, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'userId' })
  trips: TripsEntity[];

  @OneToMany(() => TripsEntity, (trips) => trips.rider, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'userId' })
  rides: TripsEntity[];

  @OneToMany(() => EmergencyRequestsEntity, (request) => request.rider, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'userId' })
  requests: EmergencyRequestsEntity[];
}

import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

import { CarInfo } from '../car-info.interface';
import { CaptainEntity } from 'src/modules/captain/captain.entity';

@Entity({ name: 'car_info' })
export class CarInfoEntity extends AbstractEntity implements CarInfo {
  @Column({ comment: 'Car Sequence No' })
  carSequenceNo: string;

  @Column({ comment: 'Which User added this', nullable: true })
  ownerId: string;

  @Column({ nullable: true })
  chassisNumber: string;

  @Column({ type: 'tinyint', nullable: true })
  cylinders: number;

  @Column({ length: 20, nullable: true, comment: 'Hijri format' })
  licenseExpiryDate: string;

  @Column({ type: 'date', nullable: true, comment: 'Gregorian format' })
  licenseExpiryDateEnglish: Date;

  @Column({ type: 'tinyint', nullable: true })
  lkVehicleClass: number;

  @Column({ nullable: true })
  bodyType: string;

  @Column({ nullable: true })
  bodyTypeEnglish: string;

  @Column({ nullable: true })
  majorColor: string;

  @Column({ nullable: true })
  majorColorEnglish: string;

  @Column({ type: 'smallint', nullable: true })
  modelYear: number;

  @Column({ nullable: true })
  ownerName: string;

  @Column({ nullable: true })
  ownerNameEnglish: string;

  @Column({ type: 'smallint', nullable: true })
  plateNumber: number;

  @Column({ nullable: true })
  plateText1: string;

  @Column({ nullable: true })
  plateText1English: string;

  @Column({ nullable: true })
  plateText2: string;

  @Column({ nullable: true })
  plateText2English: string;

  @Column({ nullable: true })
  plateText3: string;

  @Column({ nullable: true })
  plateText3English: string;

  @Column({ type: 'tinyint', nullable: true })
  plateTypeCode: number;

  @Column({ nullable: true })
  regplace: string;

  @Column({ nullable: true })
  regplaceEnglish: string;

  @Column({ type: 'tinyint', nullable: true })
  vehicleCapacity: number;

  @Column({ nullable: true })
  vehicleMaker: string;

  @Column({ nullable: true })
  vehicleMakerEnglish: string;

  @Column({ nullable: true })
  vehicleModel: string;

  @Column({ nullable: true })
  vehicleModelEnglish: string;

  @Column({ length: 36, nullable: true })
  createdBy?: string;

  @Column({ length: 36, nullable: true })
  modifiedBy?: string;

  @OneToOne(() => CaptainEntity, (captain) => captain.car, {
    eager: false,
    nullable: true,
  })
  driver: CaptainEntity;
}

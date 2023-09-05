import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { OtpReasonEnum, OtpStatusEnum } from '../enum/otp.enum';

@Entity({ name: 'otp' })
@Index(['mobileNo'])
export class OtpEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  otp: number;

  @Column({ type: 'bigint' })
  mobileNo: number;

  @Column({
    type: 'enum',
    enum: OtpReasonEnum,
    comment: 'driverLogin =1, driverSignup=2, riderLogin=3, riderSignup=4',
  })
  reason: OtpReasonEnum;

  @Column({
    type: 'enum',
    enum: OtpStatusEnum,
    comment: 'undelivered =1, delivered=2, unused=3, used=4, expired=5',
    default: OtpStatusEnum.undelivered,
  })
  otp_status: OtpStatusEnum;
}

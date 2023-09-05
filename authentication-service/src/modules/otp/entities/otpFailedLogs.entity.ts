import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { OtpStatusEnum } from '../enum/otp.enum';

@Entity({ name: 'otp-failed-logs' })
@Index(['mobileNo'])
export class OtpFailedLogsEntity extends AbstractEntity {
  @Column({ type: 'bigint' })
  mobileNo: number;

  @Column()
  otpEntered: number;

  @Column()
  otpId: string;
}

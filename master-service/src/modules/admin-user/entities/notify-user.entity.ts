import { Column, Entity, Generated, Unique } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

@Entity({ name: 'notifyusers' })
@Unique(['inquiryId'])
export class NotifyUserEntity extends AbstractEntity {
  @Column({ type: 'bigint' })
  @Generated('increment')
  inquiryId: number;

  @Column()
  fullName: string;

  @Column({ unique: true })
  mobileNo: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  city: string;
}

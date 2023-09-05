import { Column, Entity, Index } from "typeorm";
import { AbstractEntity } from "transportation-common"

import { SmsNotificationLogInterface } from '../interfaces/sms-notification-log.interface';

@Entity({ name: "sms_notification_log" })
@Index(['externalId'])
@Index(['sentTime'])
@Index(['status'])
export class SmsNotificationLogEntity extends AbstractEntity implements SmsNotificationLogInterface {

  @Column({ length: 36, nullable: true })
  externalId: string;

  @Column({ length: 15, nullable: true })
  mobileNo: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'datetime', nullable: true })
  sentTime: Date;

  @Column({ type: 'tinyint', nullable: true })
  status: number;

}
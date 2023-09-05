import { Column, Entity, Index } from "typeorm";
import { AbstractEntity } from "transportation-common"

import { EmailNotificationLogInterface } from '../interfaces/email-notification-log.interface';

@Entity({ name: "email_notification_log" })
@Index(['externalId'])
@Index(['sentTime'])
@Index(['status'])
export class EmailNotificationLogEntity extends AbstractEntity implements EmailNotificationLogInterface {

  @Column({ nullable: true, length: 36 })
  externalId: string;

  @Column({ nullable: true })
  receiver: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'datetime', nullable: true })
  sentTime: Date;

  @Column({ type: 'tinyint', nullable: true })
  status: number;

}
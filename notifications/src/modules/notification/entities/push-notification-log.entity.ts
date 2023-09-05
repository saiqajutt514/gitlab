import { Column, Entity, Index } from "typeorm";
import { AbstractEntity } from "transportation-common"

import { PushNotificationLogInterface } from '../interfaces/push-notification-log.interface';

@Entity({ name: "push_notification_log" })
@Index(['externalId'])
@Index(['sentTime'])
@Index(['status'])
export class PushNotificationLogEntity extends AbstractEntity implements PushNotificationLogInterface{

  @Column({ length: 36, nullable: true })
  externalId: string;

  @Column({ nullable: true })
  deviceToken: string;

  @Column({ type: 'tinyint', nullable: true})
  deviceType: number;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true })
  payload: string;

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'datetime', nullable: true })
  sentTime: Date;

  @Column({ type: 'tinyint', default: 0 })
  isRead: number;

  @Column({ type: 'tinyint', nullable: true })
  status: number;

}

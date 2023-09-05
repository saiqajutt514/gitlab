import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { SubscriptionEntity } from '../../subscription/entities/subscription.entity';

@Entity('user_subscriptions')
@Index(['userId', 'userType'])
@Index(['subscriptionId'])
@Index(['autoRenewal'])
@Index(['dueDate'])
@Index(['status'])
export class UserSubscriptionsEntity extends AbstractEntity {
  @Column({ length: 20 })
  userId: string;

  @Column({ type: 'tinyint' })
  userType: number;

  @Column({ length: 36 })
  subscriptionId: string;

  @Column({ type: 'tinyint' })
  subscriptionType: number;

  @Column({ type: 'float' })
  subscriptionAmount: number;

  @Column({ type: 'boolean', default: true })
  autoRenewal: boolean;

  @Column({ type: 'float', nullable: true })
  paidAmount: number;

  @Column({ type: 'float', nullable: true })
  dueAmount: number;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Column({
    nullable: true,
    comment: 'which promo code has been used its code number',
  })
  promoCode: string;

  @Column({
    type: 'float',
    nullable: true,
    default: 0,
    comment: 'Promo code value in float',
  })
  promoCodeAmount: number;

  @Column({ type: 'tinyint' })
  status: number;

  @ManyToOne(
    () => SubscriptionEntity,
    (subscription) => subscription.subscriptions,
    { eager: false },
  )
  @JoinColumn({ name: 'subscriptionId' })
  package: SubscriptionEntity;

  @OneToMany(
    () => TransactionEntity,
    (transaction) => transaction.subscription,
    { eager: false, createForeignKeyConstraints: false },
  )
  transactions: TransactionEntity[];
}

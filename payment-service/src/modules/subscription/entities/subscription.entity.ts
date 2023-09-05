import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import { UserSubscriptionsEntity } from '../../user-subscriptions/entities/user-subscription.entity';

@Entity('subscription_master')
export class SubscriptionEntity extends AbstractEntity {
  @Column()
  packageName: string;

  @Column({ type: 'text', nullable: true })
  packageDescription: string;

  @Column({ type: 'tinyint', default: 1 })
  planType: number;

  @Column({ type: 'float' })
  basePrice: number;

  @Column({ type: 'tinyint', nullable: true })
  discountType: number;

  @Column({ type: 'float', nullable: true })
  discountValue: number;

  @Column({ type: 'float' })
  finalPrice: number;

  @Column({ type: 'boolean', default: false })
  isStandard: boolean;

  @Column({ length: 36, nullable: true })
  createdBy?: string;

  @Column({ length: 36, nullable: true })
  modifiedBy?: string;

  @Column({ type: 'datetime', nullable: true })
  isDeleted?: Date;

  @Column({ type: 'boolean', default: true, nullable: true })
  status: boolean;

  @Column({ type: 'datetime', nullable: true })
  startDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate?: Date;

  @Column({ length: 36, nullable: true })
  cabType: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  isPoromoApplicable: boolean;

  @OneToMany(
    () => UserSubscriptionsEntity,
    (subscriptions) => subscriptions.package,
    { eager: false },
  )
  subscriptions: UserSubscriptionsEntity[];
}

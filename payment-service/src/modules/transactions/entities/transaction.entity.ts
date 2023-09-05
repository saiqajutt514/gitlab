import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import { UserSubscriptionsEntity } from '../../user-subscriptions/entities/user-subscription.entity';
import { ENTITY_TYPE, TRANSACTION_SOURCE } from '../enum';

@Entity('transactions')
@Index(['entityId', 'entityType'])
@Index(['senderId'])
@Index(['receiverId'])
@Index(['sourceRef'])
@Index(['status'])
export class TransactionEntity extends AbstractEntity {
  @Column({ length: 36, comment: 'either tripId or userSubscriptionId' })
  entityId: string;

  @Column({
    type: 'int',
    comment: '1-Trip, 2-Subscription and 3-Topup',
  })
  entityType: number;

  @Column({
    length: 36,
    nullable: true,
    comment: 'either wallet or paymentMethod',
  })
  sourceRef: string;

  @Column({
    type: 'enum',
    enum: TRANSACTION_SOURCE,
    default: TRANSACTION_SOURCE.INTERNAL_WALLET,
    comment: '1-INTERNAL_WALLET, 2-CLICK_PAY',
  })
  source: TRANSACTION_SOURCE;

  @Column({ length: 36 })
  senderId: string;

  @Column({ length: 36, nullable: true })
  receiverId: string;

  @Column({ length: 64, nullable: true })
  transactionId: string;

  @Column({ type: 'float' })
  transactionAmount: number;

  @Column({ type: 'float', nullable: true })
  senderAmount: number;

  @Column({ type: 'float', nullable: true })
  senderTax: number;
  @Column({ type: 'float', nullable: true })
  senderFee: number;

  @Column({ type: 'float', nullable: true })
  receiverAmount: number;

  @Column({ type: 'float', nullable: true })
  receiverTax: number;
  @Column({ type: 'float', nullable: true })
  receiverFee: number;

  @Column({ type: 'float', nullable: true })
  creditAmount: number;

  @Column({ type: 'float', nullable: true })
  debitAmount: number;

  @Column({ type: 'float', nullable: true })
  taxAmount: number;

  @Column({ type: 'float', default: 0 })
  bankFee: number;

  @Column({ type: 'text', nullable: true })
  eWalletAPIResponse?: string;

  @Column({ type: 'tinyint' })
  status: number;

 @Column({ type: 'float', default: 0 })
  discount: number;

  
  @ManyToOne(
    () => UserSubscriptionsEntity,
    (subscription) => subscription.transactions,
    { eager: false, createForeignKeyConstraints: false },
  )
  @JoinColumn({ name: 'entityId' })
  subscription: UserSubscriptionsEntity;

}

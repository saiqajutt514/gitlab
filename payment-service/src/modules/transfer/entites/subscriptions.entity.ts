import {
  Column,
  Entity,
  Index,
  Generated,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AbstractEntity } from 'transportation-common';

@Entity({ name: 'subscriptions_transactions' })
@Index(['userId'])
export class subscriptionsEntity extends AbstractEntity {
  // // @Column()
  // @Column()
  // @Generated('increment')
  // txnId: number;

  @Column({ length: 36 })
  userId: string;

  @Column({ type: 'float', nullable: true })
  amount: number;

  @Column({ type: 'float', nullable: true })
  taxAmount: number;

  @Column({ type: 'float', nullable: true })
  fee: number;

  @Column({ length: 36, nullable: true })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creationDate: Date;

  @Column({ type: 'text', nullable: true })
  details?: string;
}

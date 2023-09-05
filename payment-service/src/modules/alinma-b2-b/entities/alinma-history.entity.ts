import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import { alinmaTransactionsEntity } from './alinma-trasactions.entity';

@Entity('alinma-history')
@Index(['requestId'])
@Index(['transactionId'])
export class alinmaHistoryEntity extends AbstractEntity {
  @Column({ length: 36 })
  requestId: string;

  @Column({ type: 'longtext', nullable: true })
  request: string;

  @Column({ type: 'longtext', nullable: true })
  response: string;

  @Column({ length: 36, nullable: true })
  transactionId: string;

  @ManyToOne(() => alinmaTransactionsEntity, (transaction) => transaction.id, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'transactionId', referencedColumnName: 'id' })
  transaction: alinmaTransactionsEntity;
}

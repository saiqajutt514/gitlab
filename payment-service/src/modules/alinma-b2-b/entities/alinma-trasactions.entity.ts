import { Column, Entity, Index, OneToMany, JoinColumn } from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import { alinmaHistoryEntity } from './alinma-history.entity';
import {
  TRANSACTION_ENTITY_TYPE,
  TRANSACTION_STATUS,
} from '../enums/alinma.enum';
@Entity('alinma-transactions')
@Index(['userId'])
@Index(['srcAccNum'])
@Index(['parentId'])
export class alinmaTransactionsEntity extends AbstractEntity {
  @Column({ length: 36, nullable: true })
  parentId: string;

  @Column({
    type: 'enum',
    enum: TRANSACTION_ENTITY_TYPE,
    comment: 'topup,subscription,Driver earning,tax,fee',
  })
  entityType: TRANSACTION_ENTITY_TYPE;

  @Column({ length: 36, nullable: true })
  userId: string;

  @Column({ length: 36 })
  srcAccNum: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ length: 36, nullable: true })
  targAccNum: string;

  @Column({ length: 36, nullable: true })
  targIban: string;

  @Column({ length: 36, nullable: true })
  srcCurCode: string;

  @Column({ length: 36, nullable: true })
  targCurCode: string;

  @Column({ type: 'text', nullable: true })
  trnDesc: string;

  @Column({ type: 'text', nullable: true })
  pmtDesc: string;

  @Column({ type: 'text', nullable: true })
  memo: string;

  @Column({ length: 36, nullable: true })
  functionId: string;

  @Column({ length: 36, nullable: true })
  responseStatusCode: string;

  @Column({
    type: 'enum',
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.PENDING,
    comment: 'topup,subscription,Driver earning,tax,fee',
  })
  status: TRANSACTION_STATUS;

  @OneToMany(() => alinmaHistoryEntity, (history) => history.transactionId, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  history: alinmaHistoryEntity[];
}

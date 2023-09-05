import { Column, Entity, Index, Generated, Unique } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

@Entity('holdamount')
@Index(['senderId', 'receiverId'])
// @Unique(['holdId'])
// @Index('holdId-idx', ['holdId'], { unique: true })
export class holdAmountEntity extends AbstractEntity {
  // // // @Column()
  // @Column()
  // @Generated('increment')
  // holdId: number;

  @Column({ length: 36 })
  senderId: string;

  @Column({ length: 36 })
  receiverId: string;

  @Column({ type: 'float', nullable: true })
  amount: number;

  @Column({ type: 'float', nullable: true })
  senderFee: number;

  @Column({ type: 'float', nullable: true })
  senderTax: number;

  @Column({ type: 'float', nullable: true })
  receiverFee: number;

  @Column({ type: 'float', nullable: true })
  receiverTax: number;

  @Column({ type: 'float', nullable: true })
  motFee: number;

  @Column({ type: 'float', nullable: true })
  fullAmountToDebit: number;

  @Column({ type: 'float', nullable: true })
  fullAmountToCredit: number;

  @Column({ length: 36 })
  status: string;

  @Column({ type: 'text', nullable: true })
  details?: string;
}

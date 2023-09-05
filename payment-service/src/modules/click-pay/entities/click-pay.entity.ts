import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import {
  ClickPayStatus,
  PAYMENT_METHOD,
  TRANSACTION_TYPE,
} from '../enums/clickpay.enum';

@Entity('clickpay_transactions')
@Index(['userId'])
export class ClickpayEntity extends AbstractEntity {
  @Column({ length: 36 })
  userId: string;

  @Column({ type: 'float' })
  cart_amount: number;

  @Column({ type: 'float', nullable: true })
  tax?: number;

  @Column({ type: 'float', nullable: true })
  fee?: number;

  @Column({ type: 'float', nullable: true })
  creditAmount?: number;

  @Column({ length: 36, nullable: true })
  tran_ref?: string;

  @Column({ length: 36, nullable: true })
  tran_type?: string;

  @Column({ length: 36, nullable: true })
  cart_currency?: string;

  @Column({ length: 360, nullable: true })
  cart_description?: string;

  @Column({ length: 36, nullable: true })
  email?: string;

  @Column({ length: 36, nullable: true })
  name?: string;

  @Column({ length: 36, nullable: true })
  merchantId?: string;

  @Column({ length: 36, nullable: true })
  serviceId?: string;

  @Column({ length: 36, nullable: true })
  trace?: string;

  @Column({
    type: 'enum',
    enum: TRANSACTION_TYPE,
    default: TRANSACTION_TYPE.TOP_UP,
    comment: 'transactions type: topup(1), subscription(2)',
  })
  type: string;

  @Column({ length: 36, nullable: true })
  promoCode?: string;

  @Column({ type: 'float', nullable: true })
  promoCodeAmount?: number;

  @Column({
    type: 'enum',
    enum: ClickPayStatus,
    default: ClickPayStatus.PENDING,
    comment: 'Payment status: pending(1), completed(2), faild(3)',
  })
  payment_status?: ClickPayStatus;

  @Column({ type: 'longtext', nullable: true })
  apiResponse: string;

  @Column({ type: 'longtext', nullable: true })
  verifyApiResponse: string;

  @Column({ nullable: true })
  details?: string;

  @Column({
    type: 'enum',
    enum: PAYMENT_METHOD,
    default: PAYMENT_METHOD.CLICKPAY_HOSTED_PAGE,
  })
  paymentMethod?: PAYMENT_METHOD;
}

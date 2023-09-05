import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from "transportation-common"

import { IUserCouponLog } from '../interfaces/user_coupon_log.interface';

@Entity({ name: "user_coupon_log" })
@Index(['couponId'])
@Index(['userId'])
export class UserCouponLog extends AbstractEntity implements IUserCouponLog {

  @Column({ length: 36 })
  couponId: string;

  @Column({ length: 36 })
  userId: string

  @Column({ type: "float" })
  amount: number

  @Column({ type: "text", nullable: true })
  meta: string

  @Column({ default: 1 })
  useCount: number

}



import { AbstractEntityInterface } from "transportation-common";

export interface IUserCouponLog extends AbstractEntityInterface {

  couponId: string;

  userId: string

  amount: number

  meta?: string

}
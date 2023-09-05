import { AbstractEntityInterface } from 'transportation-common';

export enum IPromoCodeType {
  Fixed = 1,
  Ratio = 2,
}

export enum gender {
  male = 1,
  female = 2,
  all = 3,
}

export enum applicableFor {
  rider = 1,
  driver = 2,
  both = 3,
}

export enum borneBy {
  RiDE = 1,
  captain = 2,
  both = 3,
}

export enum areaType {
  country = 1,
  city = 2,
  polygone = 3,
  any = 4,
}

export enum IPromoCodeMethod {
  Coupon = 1,
  voucher = 2,
}

export interface IPromoCode extends AbstractEntityInterface {
  code: string;

  message: string;

  promoCodeType: IPromoCodeType;

  method: IPromoCodeMethod;

  userUsage?: number;

  amount: number;

  minimumAmountInCart?: number;

  maximumDiscountAmount: number;

  userId: string;

  maximumTotalUsage: number;

  maximumUsagePerUser: number;

  startAt: Date;

  endAt: Date;

  status: boolean;

  updatedAt: Date;

  createdAt: Date;

  deletedAt: Date;
}

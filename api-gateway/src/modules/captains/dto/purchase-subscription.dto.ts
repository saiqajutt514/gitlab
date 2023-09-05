import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export enum paymentMethod {
  CLICKPAY_HOSTED = 1,
}
export class purchaseSubscriptionDto {
  @IsOptional()
  promoCode: string;

  @IsOptional()
  @IsEnum(paymentMethod)
  method: paymentMethod;
}

export class userDto {
  userId?: string;
}

export class updateSubsriptionPackageDto {
  @IsNotEmpty()
  subscriptionId: string;
}

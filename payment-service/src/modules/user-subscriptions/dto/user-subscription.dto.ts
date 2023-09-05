import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { USER_TYPE, SUBSCRIPTION_TYPE, SUBSCRIPTION_STATUS } from '../enum';

export enum TRANSACTION_SOURCE {
  INTERNAL_WALLET = 1,
  CLICK_PAY = 2,
}
export class CreateUserSubscriptionDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  @IsEnum(USER_TYPE)
  userType: USER_TYPE;

  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  @IsNotEmpty()
  @IsEnum(SUBSCRIPTION_TYPE)
  subscriptionType: SUBSCRIPTION_TYPE;

  @IsNotEmpty()
  subscriptionAmount: number;

  @IsOptional()
  paidAmount?: number;

  @IsOptional()
  dueAmount?: number;

  @IsOptional()
  autoRenewal: boolean;

  @IsNotEmpty()
  startDate: string;

  @IsNotEmpty()
  endDate: string;

  @IsNotEmpty()
  dueDate: string;

  @IsNotEmpty()
  @IsEnum(SUBSCRIPTION_STATUS)
  status: SUBSCRIPTION_STATUS;

  @IsOptional()
  notify: boolean;

  transactionId?: string;
  promoCode?: string;
  promoCodeAmount?: number;
  source?: TRANSACTION_SOURCE;
  sourceRef?: string;
  transactionAmount?: number;
  tax?: number;
  fee?: number;
}

export class UpdateUserSubscriptionDto extends PartialType(
  CreateUserSubscriptionDto,
) {}

import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  SUBSCRIPTION_TYPE,
  SUBSCRIPTION_STATUS,
  USER_TYPE,
} from '../constants';
import { TRANSACTION_SOURCE } from '../interface/captain.interface';

export class UserSubscriptionDto {
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

export interface updateSubscriptionPackageDto {
  userId: string;
  subscriptionId: string;
}

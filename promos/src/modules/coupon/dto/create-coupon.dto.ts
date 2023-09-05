import { UniqueOnDatabase } from 'transportation-common';

import {
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import {
  applicableFor,
  areaType,
  borneBy,
  gender,
  IPromoCodeMethod,
  IPromoCodeType,
} from '../interfaces/promoCode.interface';
import { PromoCodesEntity } from '../entities/coupon.entity';

export class CreateCouponDto {
  @IsNotEmpty()
  @UniqueOnDatabase(PromoCodesEntity)
  code: string;

  @IsEnum(IPromoCodeType)
  promoCodeType: IPromoCodeType;

  @IsEnum(borneBy)
  borneBy: borneBy;

  @IsEnum(applicableFor)
  applicableFor: applicableFor;

  @IsEnum(areaType)
  areaType: areaType;

  @IsOptional()
  area: any;

  @IsNumber()
  totalBudget: number;

  @IsNumber()
  amount: number;

  @IsDateString()
  startAt: Date;

  @IsDateString()
  endAt: Date;

  @IsEnum(gender)
  gender: gender;

  @IsOptional()
  @IsBoolean()
  status: boolean;

  @IsNotEmpty()
  message: string;

  @IsEnum(IPromoCodeMethod)
  method: IPromoCodeMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumAmountInCart: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscountAmount: number;

  @IsNumber()
  @IsOptional()
  maximumTotalUsage: number;

  @IsOptional()
  @IsNumber()
  maximumUsagePerUser: number;

  @IsOptional()
  userId: string;
}

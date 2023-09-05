import { PartialType } from '@nestjs/mapped-types';
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
} from '../enum/promo-code.enum';

export class CreateCouponDto {
  @IsNotEmpty()
  code: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  totalBudget: number;

  @IsDateString()
  startAt: Date;

  @IsDateString()
  endAt: Date;

  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumAmountInCart: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscountAmount: number;

  @IsOptional()
  @IsNumber()
  maximumTotalUsage: number;

  @IsOptional()
  @IsNumber()
  maximumUsagePerUser: number;

  @IsOptional()
  @IsBoolean()
  status: boolean;

  @IsEnum(IPromoCodeType)
  promoCodeType: IPromoCodeType;

  @IsEnum(gender)
  gender: gender;

  @IsEnum(borneBy)
  borneBy: borneBy;

  @IsEnum(applicableFor)
  applicableFor: applicableFor;

  @IsEnum(areaType)
  areaType: areaType;

  @IsOptional()
  area: any;
}

export class CreateVoucherDto extends CreateCouponDto {
  @IsNotEmpty()
  userId: string;
}

export class PromoCodeTypeDto {
  @IsEnum(IPromoCodeType)
  promoCodeType: IPromoCodeType;
}

export class UpdatePromoCodeDto extends PartialType(CreateVoucherDto) {
  @IsOptional()
  @IsEnum(IPromoCodeMethod)
  method: IPromoCodeMethod;
}

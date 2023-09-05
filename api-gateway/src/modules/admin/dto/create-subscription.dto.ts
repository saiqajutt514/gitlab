import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { DISCOUNT_TYPE, SUBSCRIPTION_TYPE } from '../../subscription/enum';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  packageName: string;

  @IsOptional()
  packageDescription: string;

  @IsNotEmpty()
  @IsEnum(SUBSCRIPTION_TYPE)
  planType: SUBSCRIPTION_TYPE;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  basePrice: number;

  @IsOptional()
  @IsEnum(DISCOUNT_TYPE)
  discountType: DISCOUNT_TYPE;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsOptional()
  isStandard?: boolean;

  @IsOptional()
  status: boolean;

  @IsOptional()
  startDate: Date;

  @IsOptional()
  endDate: Date;

  @IsOptional()
  cabType: string;

  @IsOptional()
  isPoromoApplicable: boolean;
}

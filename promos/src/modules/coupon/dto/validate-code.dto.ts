import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { applicableFor } from '../interfaces/promoCode.interface';

export class ValidateCodeDto {
  @IsNotEmpty()
  promoCode: string;

  @IsNotEmpty()
  userId: string;

  @IsNumber()
  amount: number;
  @IsNumber()
  lat: number;

  @IsNumber()
  long: number;

  @IsEnum(applicableFor)
  applyingTo: applicableFor;
}

import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';

export enum applicableFor {
  rider = 1,
  driver = 2,
}

export class PromoCodeDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  promoCode: string;

  @IsNotEmpty()
  tripId: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  lat: number;

  @IsNumber()
  long: number;

  @IsEnum(applicableFor)
  applyingTo: applicableFor;
}

export class RevertPromoCodeDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  promoCode: string;
}

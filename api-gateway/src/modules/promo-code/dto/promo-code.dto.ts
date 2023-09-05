import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export enum applicableFor {
  rider = 1,
  driver = 2,
}

export class PromoCodeDto {
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

export class UserIdDto {
  @IsNotEmpty()
  userId: string;
}

import { IsNotEmpty } from 'class-validator';

export class RevertCouponDto {

  @IsNotEmpty()
  promoCode: string;

  @IsNotEmpty()
  userId: string

}

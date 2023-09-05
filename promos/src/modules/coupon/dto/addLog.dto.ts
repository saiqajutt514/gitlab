
import { IsNotEmpty } from 'class-validator';

export class CreateLogDto {

  @IsNotEmpty()
  couponId: string;

  @IsNotEmpty()
  userId: string

  @IsNotEmpty()
  amount: number

  meta?: string

}
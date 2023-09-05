import { IsNotEmpty, IsNumber } from 'class-validator';

export class TripStartedBodyDto {

  @IsNumber()
  @IsNotEmpty()
  tripOtp: number;

}
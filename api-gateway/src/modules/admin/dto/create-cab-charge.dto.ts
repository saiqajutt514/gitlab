import { IsString, IsNumber, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { DayList } from '../enum/cab-charges.enum';

export class CreateCabChargeDto {

  @IsString()
  @IsNotEmpty()
  cabId: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  @IsEnum(DayList)
  day: DayList;

  @IsNumber()
  @IsOptional()
  passengerBaseFare: number

  @IsNumber()
  @IsOptional()
  passengerCostPerMin: number

  @IsNumber()
  @IsOptional()
  passengerCostPerKm: number

}
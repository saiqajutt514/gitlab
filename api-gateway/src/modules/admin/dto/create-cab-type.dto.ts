import { IsString, IsOptional, IsNumberString, IsNumber } from 'class-validator';
import { isNumber } from 'util';

export class CreateCabTypeDto {

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  nameArabic: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  descriptionArabic: string;

  @IsNumberString()
  noOfSeats: number;

  // Passenger
  @IsNumberString()
  @IsOptional()
  passengerEstimatedTimeArrival: number;

  @IsNumberString()
  @IsOptional()
  passengerDriverMatching: number;

  @IsNumberString()
  @IsOptional()
  passengerBaseFare: number

  @IsNumberString()
  @IsOptional()
  passengerBaseDistance: number

  @IsNumberString()
  @IsOptional()
  passengerBaseTime: number

  @IsNumberString()
  @IsOptional()
  passengerCostPerMin: number

  @IsNumberString()
  @IsOptional()
  passengerCostPerKm: number

  @IsNumberString()
  @IsOptional()
  passengerCancellationCharge: number

  @IsNumberString()
  @IsOptional()
  passengerDriverDistribution: number

  @IsNumberString()
  @IsOptional()
  waitChargePerMin: number

  // Share
  @IsNumberString()
  @IsOptional()
  shareEstimatedTimeArrival: number

  @IsNumberString()
  @IsOptional()
  shareDriverMatching: number

  @IsNumberString()
  @IsOptional()
  shareBaseFare: number

  @IsNumberString()
  @IsOptional()
  shareBaseDistance: number

  @IsNumberString()
  @IsOptional()
  shareBaseTime: number


  @IsOptional()
  @IsNumberString()
  shareCostPerMin: number

  @IsNumberString()
  @IsOptional()
  shareCancellationCharge: number

  @IsNumberString()
  @IsOptional()
  shareDriverDistribution: number

  @IsNumberString()
  @IsOptional()
  shareMaxThreshold: number

  // Pool

  @IsNumberString()
  @IsOptional()
  carpoolEstimatedTimeArrival: number

  @IsNumberString()
  @IsOptional()
  carpoolDriverMatching: number

  @IsNumberString()
  @IsOptional()
  carpoolCostPerKmMin: number

  @IsNumberString()
  @IsOptional()
  carpoolCostPerKmMax: number

  @IsNumberString()
  @IsOptional()
  carpoolUserCancellationCharge: number

  @IsNumberString()
  @IsOptional()
  carpoolDriverCancellationCharge: number

  @IsNumberString()
  @IsOptional()
  carpoolDriverDistribution: number

  @IsOptional()
  status: boolean

  @IsOptional()
  order: number

}

export class UpdateCabTypeOrderDto {
  @IsNumber()
  order: number
}

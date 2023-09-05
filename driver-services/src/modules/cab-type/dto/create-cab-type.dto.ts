import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  isNotEmpty,
} from "class-validator";

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

  @IsNumber()
  noOfSeats: number;

  // Passenger
  @IsNumber()
  @IsOptional()
  passengerEstimatedTimeArrival: number;

  @IsNumber()
  @IsOptional()
  passengerDriverMatching: number;

  @IsNumber()
  @IsOptional()
  passengerBaseFare: number;

  @IsNumber()
  @IsOptional()
  passengerBaseDistance: number;

  @IsNumber()
  @IsOptional()
  passengerBaseTime: number;

  @IsNumber()
  @IsOptional()
  passengerCostPerMin: number;

  @IsNumber()
  @IsOptional()
  passengerCostPerKm: number;

  @IsNumber()
  @IsOptional()
  waitChargePerMin: number;

  @IsNumber()
  @IsOptional()
  passengerCancellationCharge: number;

  @IsNumber()
  @IsOptional()
  passengerDriverDistribution: number;

  // Share
  @IsNumber()
  @IsOptional()
  shareEstimatedTimeArrival: number;

  @IsNumber()
  @IsOptional()
  shareDriverMatching: number;

  @IsNumber()
  @IsOptional()
  shareBaseFare: number;

  @IsNumber()
  @IsOptional()
  shareBaseDistance: number;

  @IsNumber()
  @IsOptional()
  shareBaseTime: number;

  @IsOptional()
  @IsNumber()
  shareCostPerMin: number;

  @IsNumber()
  @IsOptional()
  shareCancellationCharge: number;

  @IsNumber()
  @IsOptional()
  shareDriverDistribution: number;

  @IsNumber()
  @IsOptional()
  shareMaxThreshold: number;

  // Pool

  @IsNumber()
  @IsOptional()
  carpoolEstimatedTimeArrival: number;

  @IsNumber()
  @IsOptional()
  carpoolDriverMatching: number;

  @IsNumber()
  @IsOptional()
  carpoolCostPerKmMin: number;

  @IsNumber()
  @IsOptional()
  carpoolCostPerKmMax: number;

  @IsNumber()
  @IsOptional()
  carpoolUserCancellationCharge: number;

  @IsNumber()
  @IsOptional()
  carpoolDriverCancellationCharge: number;

  @IsNumber()
  @IsOptional()
  carpoolDriverDistribution: number;

  @IsNumber()
  @IsOptional()
  categoryIcon: string;

  @IsBoolean()
  @IsOptional()
  status: boolean;

  @IsOptional()
  order?: number;
}

export class UpdateCabTypeOrderDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsNumber()
  order: number;
}

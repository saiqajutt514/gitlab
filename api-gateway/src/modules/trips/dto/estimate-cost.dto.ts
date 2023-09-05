import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class DistanceDto {
  @IsNumber()
  @IsNotEmpty()
  distance: number
}

export class TimeDto {
  @IsNumber()
  time: number
}

export class CabCalcParams {
  @IsString()
  @IsOptional()
  country?: string

  @IsString()
  @IsOptional()
  city?: string
}

export class CabIdDto{
  @IsString()
  @IsNotEmpty()
  cabId: string
}
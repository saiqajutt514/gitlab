import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class TripDestinationDto {

  @IsNumber()
  @IsNotEmpty()
  latitude: string

  @IsNumber()
  @IsNotEmpty()
  longitude: string

  @IsString()
  @IsNotEmpty()
  address: string

  @IsOptional()
  @IsString()
  cityNameInArabic?: string

}
import { IsString, IsOptional, IsNotEmpty } from "class-validator";

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  cabId: string;

  @IsOptional()
  cylinders: number;

  @IsOptional()
  lkVehicleClass: number;

  @IsOptional()
  bodyType: string;

  @IsOptional()
  bodyTypeEnglish: string;

  @IsOptional()
  majorColor: string;

  @IsOptional()
  majorColorEnglish: string;

  @IsOptional()
  modelYear: number;

  @IsOptional()
  vehicleCapacity: number;

  @IsOptional()
  vehicleMaker: string;

  @IsOptional()
  vehicleMakerEnglish: string;

  @IsOptional()
  vehicleModel: string;

  @IsOptional()
  vehicleModelEnglish: string;

  @IsOptional()
  vehicleImage: string;
}

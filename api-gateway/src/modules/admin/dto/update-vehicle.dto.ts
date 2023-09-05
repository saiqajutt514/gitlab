import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateVehicleDto {

  @IsString()
  @IsNotEmpty()
  cab: string

  @IsString()
  @IsOptional()
  bodyTypeEnglish: string;

  @IsString()
  @IsOptional()
  majorColorEnglish: string;

  @IsString()
  @IsOptional()
  vehicleMakerEnglish: string;

  @IsString()
  @IsOptional()
  vehicleModelEnglish: string;

}

export class VechileImageDto {

  @IsString()
  @IsOptional()
  vehicleImage: string

}

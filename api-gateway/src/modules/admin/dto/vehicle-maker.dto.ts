import {
  IsNotEmpty,
  IsAlphanumeric,
  IsUppercase,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsString,
  Length,
  IsNumber,
} from 'class-validator';

export class VehicleMasterInfoDto {
  @IsOptional()
  vehicleMaker: string;

  @IsOptional()
  vehicleModel: string;
}

export class AddVehicleMakerDto {
  @IsString()
  @IsNotEmpty()
  maker: string;

  @IsString()
  @IsNotEmpty()
  makerEnglish: string;

  @IsNotEmpty()
  status: string;
}

export class AddVehicleModelDto {
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  modelEnglish: string;

  @IsString()
  @IsNotEmpty()
  makerId: string;
}

export class UpdateVehicleMakerDto {
  @IsString()
  id: string;

  @IsString()
  maker: string;

  @IsString()
  makerEnglish: string;

  @IsNotEmpty()
  status: string;
}

export class UpdateVehicleModelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  modelEnglish: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  makerId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cabTypeId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cabTypeName: string;
}

export class AddVehicleClassDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateVehicleClassDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

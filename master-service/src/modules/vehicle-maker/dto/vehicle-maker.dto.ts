import { Type } from 'class-transformer';
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
  @IsString()
  vehicleMaker: string;

  @IsOptional()
  @IsString()
  vehicleModel: string;
}

export class AddVehicleMakerDto {
  @IsString()
  @IsNotEmpty()
  maker: string;

  @IsString()
  @IsNotEmpty()
  makerEnglish?: string;

  @IsNumber()
  @IsNotEmpty()
  status?: number;

  @IsOptional()
  @IsString()
  makerIcon?: string;
}

export class UpdateVehicleMakerDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  maker: string;

  @IsString()
  @IsNotEmpty()
  makerEnglish: string;

  @IsNumber()
  @IsNotEmpty()
  status: number;

  @IsOptional()
  @IsString()
  makerIcon: string;
}

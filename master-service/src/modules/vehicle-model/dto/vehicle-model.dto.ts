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
} from 'class-validator';

export class AddVehicleModelDto {
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  modelEnglish?: string;

  @IsString()
  @IsNotEmpty()
  makerId: string;
}

export class UpdateVehicleModelDto {
  @IsString()
  id: string;

  @IsString()
  model: string;

  @IsString()
  modelEnglish: string;

  @IsString()
  makerId: string;

  cabTypeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cabTypeName: string;
}

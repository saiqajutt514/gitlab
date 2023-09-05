import { Type } from 'class-transformer';
import { IsNotEmpty, IsAlphanumeric, IsUppercase, IsEnum, ValidateNested, ArrayMinSize, ArrayMaxSize, IsOptional, IsString, Length } from 'class-validator';

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



import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsNumberString,
  IsArray,
  isNotEmpty,
  isEnum,
  IsEnum,
} from 'class-validator';
import {
  InventoryStatusEnum,
  InventoryTransmissionEnum,
} from '../enum/rar.enum';

//D1
export class AddToInventoryDto {
  //1
  @IsNotEmpty()
  @IsNumber()
  modelYear: number;

  bodyColor: string;

  //3
  @IsNotEmpty()
  @IsArray()
  //@MinLength(9)
  //@MaxLength(9)
  sequenceNo: string[];

  //4
  @IsNotEmpty()
  @IsNumber()
  displacement: number;

  //5
  @IsNotEmpty()
  @IsString()
  fuelType: string;

  //6
  @IsNotEmpty()
  @IsNumber()
  noOfCylinder: number; //6

  //7
  @IsNotEmpty()
  @IsNumber()
  seatingCapacity: number; //7

  //8
  @IsNotEmpty()
  @IsEnum(InventoryTransmissionEnum)
  transmission: InventoryTransmissionEnum; //8

  //9
  @IsNotEmpty()
  @IsString()
  category: string; //9

  //10
  @IsNotEmpty()
  @IsEnum(InventoryStatusEnum)
  iStatus: InventoryStatusEnum;

  //11
  @IsNotEmpty()
  modelId: string; //11

  //12
  @IsOptional()
  inventoryIcon: string;
}

//D2
export class AddMakerModelInventoryDto {
  @IsNotEmpty()
  @IsString()
  maker: string;

  @IsNotEmpty()
  @IsString()
  makerEnglish: string;

  @IsNotEmpty()
  @IsNumber()
  status: number;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsString()
  modelEnglish: string;

  @IsNotEmpty()
  @IsNumber()
  modelYear: number; //1

  bodyColor: string; //2

  @IsNotEmpty()
  @IsArray()
  @MaxLength(9, { each: true })
  @MinLength(9, { each: true })
  sequenceNo: string[]; //3

  @IsNotEmpty()
  @IsNumber()
  displacement: number; //4

  @IsNotEmpty()
  @IsString()
  fuelType: string; //5

  @IsNotEmpty()
  @IsNumber()
  noOfCylinder: number; //6

  @IsNotEmpty()
  @IsNumber()
  seatingCapacity: number; //7

  @IsNotEmpty()
  @IsEnum(InventoryTransmissionEnum)
  transmission: InventoryTransmissionEnum; //8

  @IsNotEmpty()
  @IsString()
  category: string; //9

  @IsNotEmpty()
  @IsEnum(InventoryStatusEnum)
  iStatus: InventoryStatusEnum;

  @IsOptional()
  inventoryIcon?: string;
}

//D5
export class ActivationDto {
  @IsNotEmpty()
  @IsString()
  manufacturer: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsString()
  year: string;

  @IsNotEmpty()
  @IsString()
  quantity: string;

  @IsNotEmpty()
  activate: boolean;

  @IsNotEmpty()
  inActivate: boolean;
}

//A2
export class GetSelectedVehicleDetailsForAppDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  modelId: string; //11
}

export class DeleteByIdDto {
  @IsString()
  id: string;
}

export class DeleteBySequenceDto {
  @IsNotEmpty()
  @IsString()
  sequenceNumber: string;
}
//D7
export class UpdateInventoryDto {
  @IsNotEmpty()
  id: string;

  @IsOptional()
  modelYear: number; //1

  @IsOptional()
  bodyColor: string; //2

  @IsOptional()
  @MaxLength(9, { each: true })
  @MinLength(9, { each: true })
  sequenceNo: string; //3

  @IsOptional()
  displacement: number; //4

  @IsOptional()
  fuelType: string; //5

  @IsOptional()
  noOfCylinder: number; //6

  @IsOptional()
  seatingCapacity: number; //7

  @IsOptional()
  @IsEnum(InventoryTransmissionEnum)
  transmission: InventoryTransmissionEnum; //8

  @IsOptional()
  category: string; //9

  @IsOptional()
  @IsEnum(InventoryStatusEnum)
  iStatus: InventoryStatusEnum;

  @IsOptional()
  inventoryIcon: string;
}

export class UpdateFullDto {
  @IsOptional()
  maker: string;

  @IsOptional()
  makerEnglish: string;

  @IsOptional()
  status: number;

  @IsOptional()
  model: string;

  @IsOptional()
  modelEnglish: string;

  @IsNotEmpty()
  id: string;

  @IsOptional()
  modelYear: number; //1

  @IsOptional()
  bodyColor: string; //2

  @IsOptional()
  @MaxLength(9, { each: true })
  @MinLength(9, { each: true })
  sequenceNo: string; //3

  @IsOptional()
  displacement: number; //4

  @IsOptional()
  fuelType: string; //5

  @IsOptional()
  noOfCylinder: number; //6

  @IsOptional()
  seatingCapacity: number; //7

  @IsOptional()
  @IsEnum(InventoryTransmissionEnum)
  transmission: InventoryTransmissionEnum; //8

  @IsOptional()
  category: string; //9

  @IsOptional()
  @IsEnum(InventoryStatusEnum)
  iStatus: InventoryStatusEnum;

  @IsOptional()
  inventoryIcon: string;
}

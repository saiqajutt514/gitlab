import {
  IsNotEmpty,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsNumberString,
  IsAlpha,
  IsArray,
} from 'class-validator';

//D1
export class AddToInventoryDto {
  //1
  @IsNotEmpty()
  @IsNumber()
  modelYear: number;

  //2
  bodyColor: string;

  //3
  @IsNotEmpty()
  @IsArray()
  @MaxLength(9, { each: true })
  @MinLength(9, { each: true })
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
  noOfCylinder: number;

  //7
  @IsNotEmpty()
  @IsNumber()
  seatingCapacity: number;

  //8
  @IsNotEmpty()
  @IsNumber()
  transmission: InventoryTransmissionEnum;

  //9
  @IsNotEmpty()
  @IsString()
  category: string;

  //10
  @IsNotEmpty()
  @IsNumber()
  iStatus: InventoryStatusEnum;

  //11
  @IsNotEmpty()
  @IsString()
  modelId: string;

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
  status: InventoryStatusEnum;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsString()
  modelEnglish: string;

  @IsNotEmpty()
  @IsNumber()
  modelYear: number;

  bodyColor: string;

  @IsNotEmpty()
  @IsArray()
  @MaxLength(9, { each: true })
  @MinLength(9, { each: true })
  sequenceNo: string[];

  @IsNotEmpty()
  @IsNumber()
  displacement: number;

  @IsNotEmpty()
  @IsString()
  fuelType: string;

  @IsNotEmpty()
  @IsNumber()
  noOfCylinder: number;

  @IsNotEmpty()
  @IsNumber()
  seatingCapacity: number;

  @IsNotEmpty()
  @IsNumber()
  transmission: InventoryTransmissionEnum;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsNumber()
  iStatus: InventoryStatusEnum;

  inventoryIcon: string;
}

//D3
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
//Dto to delete to inventory
export class DeleteCompanyVehicleDto {
  @IsString()
  id: string;
}

//
export class ShowSelectedVehicleDetailsForAppDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  modelId: string; //11
}

export class DeleteCompanyInventoryDto {
  //1
  // chasis number or body number of vehicle.
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class UpdateInventoryDto {
  @IsNotEmpty()
  id: string;

  @IsOptional()
  modelYear: number;

  @IsOptional()
  bodyColor: string;

  @IsOptional()
  @MaxLength(9, { each: true })
  @MinLength(9, { each: true })
  sequenceNo: string;

  @IsOptional()
  displacement: number;

  @IsOptional()
  fuelType: string;

  @IsOptional()
  noOfCylinder: number;

  @IsOptional()
  seatingCapacity: number;

  @IsOptional()
  transmission: InventoryTransmissionEnum;

  @IsOptional()
  category: string;

  @IsOptional()
  iStatus: InventoryStatusEnum;

  @IsOptional()
  inventoryIcon: string;
}

export enum InventoryTransmissionEnum {
  Manual = 1,
  Automatic = 2,
}
export enum InventoryStatusEnum {
  Active = 1,
  Inactive = 2,
  Draft = 3,
}

export class InventoryIcon {
  @IsString()
  @IsOptional()
  inventoryIcon: string;
}

export class CustomerStatusDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsBoolean()
  @IsNotEmpty()
  status: boolean;
}

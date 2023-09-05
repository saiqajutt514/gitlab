import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCarInfoDto {
  @IsOptional()
  driverId: string;

  @IsOptional()
  carSequenceNo: string;

  @IsOptional()
  chassisNumber: string;

  @IsOptional()
  cylinders: number;

  @IsOptional()
  licenseExpiryDate: string;

  @IsOptional()
  licenseExpiryDateEnglish: Date;

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
  ownerName: string;

  @IsOptional()
  ownerNameEnglish: string;

  @IsOptional()
  plateNumber: number;

  @IsOptional()
  plateText1: string;

  @IsOptional()
  plateText1English: string;

  @IsOptional()
  plateText2: string;

  @IsOptional()
  plateText2English: string;

  @IsOptional()
  plateText3: string;

  @IsOptional()
  plateText3English: string;

  @IsOptional()
  plateTypeCode: number;

  @IsOptional()
  regplace: string;

  @IsOptional()
  regplaceEnglish: string;

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
  userId: string;
}

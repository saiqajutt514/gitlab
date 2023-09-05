import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsAlphanumeric,
  IsUppercase,
  IsEnum,
  ValidateNested,
  IsOptional,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
} from "class-validator";
import { CAR_LICENCE_TYPE, DRIVING_MODE } from "../constants";

export class DrivingModeDto {
  @IsNotEmpty()
  @IsEnum(DRIVING_MODE)
  drivingMode: DRIVING_MODE;
}

export class CreateCaptainWASLDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  @IsUppercase()
  driverNationalId: string;

  @IsNotEmpty()
  @IsUppercase()
  carPlateNo: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  @IsUppercase()
  carSequenceNo: string;

  @IsNotEmpty()
  @IsEnum(CAR_LICENCE_TYPE)
  carLicenceType: CAR_LICENCE_TYPE;

  @IsNotEmpty()
  cab: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @Type(() => DrivingModeDto)
  drivingModes: DrivingModeDto[];

  @IsNotEmpty()
  acceptTC: boolean;
}

export class CreateCaptainDto extends CreateCaptainWASLDto {
  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  @IsNotEmpty()
  autoRenewal: boolean;
}

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
import { CAR_LICENCE_TYPE, DRIVING_MODE } from '../captain.enum';

export class DrivingModeDto {
  @IsNotEmpty()
  @IsEnum(DRIVING_MODE)
  drivingMode: DRIVING_MODE;
}

export class BecomeCaptainWASLDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  @IsUppercase()
  @Length(10)
  driverNationalId: string;

  @IsNotEmpty()
  @IsUppercase()
  carPlateNo: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  @IsUppercase()
  @Length(8, 9)
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

export class BecomeCaptainDto extends BecomeCaptainWASLDto {
  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  @IsNotEmpty()
  autoRenewal: boolean;
}

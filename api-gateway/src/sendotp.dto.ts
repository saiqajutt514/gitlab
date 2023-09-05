import {
  Length,
  IsOptional,
  IsNotEmpty,
  IsString,
  IsNumberString,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class sendOtp {
  @IsNumberString()
  @MinLength(12)
  @MaxLength(12)
  mobileNo: number;

  @IsOptional()
  reason: string;

  @IsOptional()
  userid: string;
}
export class verifyOtp {
  @IsNumberString()
  @MinLength(12)
  @MaxLength(12)
  mobileNo: number;

  @IsNotEmpty()
  tId: string;

  @IsNumberString()
  @IsNotEmpty()
  otp: number;

  @IsOptional()
  userId: string;

  @IsOptional()
  licExpiry: string;

  @IsOptional()
  dateOfBirth: string;
}

export class CarInfoDto {
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  userid: number;

  @IsNotEmpty()
  @Length(9, 9)
  sequenceNumber: number;
}

export class getCitizenInfoDto {
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  userid: number;

  @IsNotEmpty()
  dateOfBirth: string;

  @IsNotEmpty()
  language: string;
}
export class getAlienInfoDto {
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  iqamaNumber: number;

  @IsNotEmpty()
  dateOfBirth: string;

  @IsNotEmpty()
  language: string;
}

export class getAlienDLInfoByIqama {
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  iqamaNumber: number;

  @IsNotEmpty()
  licssExpiryDateG: string;
}

export class getCitizenDLInfo {
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  userid: number;

  @IsNotEmpty()
  licssExpiryDateH: string;
}

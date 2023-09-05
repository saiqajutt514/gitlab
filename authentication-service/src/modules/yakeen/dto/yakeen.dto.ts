import { isNotEmpty, IsNotEmpty, IsOptional } from 'class-validator';
import exp from 'constants';

export class CarInfoDto {
  @IsNotEmpty()
  userid: string;

  @IsNotEmpty()
  sequenceNumber: string;
}

export class getCitizenAddressInfoDto {
  @IsNotEmpty()
  userid: string;

  @IsNotEmpty()
  dateOfBirth: string;

  @IsNotEmpty()
  language: string;
}

export class getAlienAddressInfoByIqamaDto {
  @IsNotEmpty()
  iqamaNumber: string;

  @IsNotEmpty()
  dateOfBirth: string;

  @IsNotEmpty()
  language: string;
}

export class getAlienDLInfoByIqamaDto {
  @IsNotEmpty()
  iqamaNumber: string;

  @IsNotEmpty()
  licssExpiryDateG: string;
}

export class getAlienInfoByIqama2Dto {
  @IsNotEmpty()
  iqamaNumber: string;

  @IsNotEmpty()
  dateOfBirth: string;
}

export class getCitizenDLInfoDto {
  @IsNotEmpty()
  userid: string;

  @IsNotEmpty()
  licssExpiryDateH?: string;
}

export class getCitizenDataFromYakeenDto {
  @IsNotEmpty()
  userid: string;

  @IsNotEmpty()
  mobileNo: string;

  @IsNotEmpty()
  licssExpiryDateH?: string;

  @IsNotEmpty()
  dateOfBirth?: string;
}
export class getCitizenDataFromYakeen2Dto {
  @IsNotEmpty()
  userid: string;
  @IsNotEmpty()
  mobileNo: string;
  @IsNotEmpty()
  dateOfBirth: string;
}

export class getCitizenInfo2Dto {
  @IsNotEmpty()
  userid: string;

  @IsNotEmpty()
  dateOfBirth?: string;
}
export class customerKycDto {
  @IsNotEmpty()
  userid: string;

  @IsNotEmpty()
  mobileNo: string;

  @IsNotEmpty()
  licssExpiryDateH?: string;

  @IsNotEmpty()
  dateOfBirth?: string;
}

export type Org = { [key: string]: any };

import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateCarInfoDto {

  @IsString()
  @IsOptional()
  ownerNameEnglish: string;

  @IsString()
  @IsOptional()
  regplaceEnglish: string;

  @IsOptional()
  plateText1English: string;

  @IsOptional()
  plateText2English: string;

  @IsOptional()
  plateText3English: string;

  @IsOptional()
  bodyTypeEnglish: string;

  @IsString()
  @IsOptional()
  majorColorEnglish: string;

  @IsString()
  @IsOptional()
  vehicleMakerEnglish: string;

  @IsString()
  @IsOptional()
  vehicleModelEnglish: string;

  @IsOptional()
  licenseExpiryDateEnglish: string;

}

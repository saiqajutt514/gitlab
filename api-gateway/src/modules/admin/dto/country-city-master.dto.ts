import { IsString, IsNumber, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';

export class AddCountryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class AddCityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  countryId: string;
}

export class UpdateCityDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
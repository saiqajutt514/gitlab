import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from "class-validator";

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

export class UpdateCountryDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateCityDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

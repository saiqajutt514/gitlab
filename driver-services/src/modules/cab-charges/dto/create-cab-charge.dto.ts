import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from "class-validator";
import { CityEntity } from "../entities/city.entity";
import { CountryEntity } from "../entities/country.entity";
import { DayList } from "../cab-charges.enum";

export class CreateCabChargeDto {
  @IsString()
  @IsNotEmpty()
  cabId: string;

  country: CountryEntity;

  city: CityEntity;

  @IsNotEmpty()
  @IsEnum(DayList)
  day: DayList;

  @IsNumber()
  @IsOptional()
  passengerBaseFare: number;

  @IsNumber()
  @IsOptional()
  passengerCostPerMin: number;

  @IsNumber()
  @IsOptional()
  passengerCostPerKm: number;
}

import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { CityEntity } from "src/modules/cab-charges/entities/city.entity";

export class CreateCustomizedChargeDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  title: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  multiplyRate: number;

  @IsNotEmpty()
  @IsString()
  fromDate: string;

  @IsNotEmpty()
  @IsString()
  toDate: string;

  city: CityEntity;
}

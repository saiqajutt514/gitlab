import { IsDate, IsNotEmpty, IsNumber, IsString, Length, Max, MaxLength, Min } from "class-validator";

export class CreateCustomizedChargeDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  title: string

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  multiplyRate: number

  @IsNotEmpty()
  @IsString()
  fromDate: string

  @IsNotEmpty()
  @IsString()
  toDate: string
  
  @IsString()
  @IsNotEmpty()
  city: string;
}
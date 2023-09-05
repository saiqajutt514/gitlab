import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateOtpDto {
  @IsNotEmpty()
  @IsString()
  riderId: number

  @IsOptional()
  createdBy: string
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  riderId: number

  @IsNotEmpty()
  @IsNumber()
  otp: number

  @IsOptional()
  createdBy: string
}
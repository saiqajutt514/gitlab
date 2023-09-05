import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { REASON_TYPE } from '../enum/rejected-reason.enum';

export class CreateRejectedReasonDto {

  @IsNotEmpty()
  @IsString()
  reason: string

  @IsNotEmpty()
  @IsString()
  reasonArabic: string

  @IsNotEmpty()
  @IsEnum(REASON_TYPE)
  reasonType: REASON_TYPE

  @IsOptional()
  status: boolean
}

export class UpdateRejectedReasonDto {

  @IsNotEmpty()
  @IsString()
  reason: string

  @IsNotEmpty()
  @IsString()
  reasonArabic: string

  @IsOptional()
  status: boolean
}
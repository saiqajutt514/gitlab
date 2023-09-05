import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { REASON_TYPE, REASON_STATUS } from '../enum/rejected-reason.enum';

export class RejectedReasonDto {

  @IsNotEmpty()
  @IsString()
  reason: string

  @IsNotEmpty()
  @IsString()
  reasonArabic: string

  @IsNotEmpty()
  @IsEnum(REASON_TYPE)
  reasonType: REASON_TYPE

  @IsBoolean()
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

  @IsBoolean()
  @IsOptional()
  status: boolean
}
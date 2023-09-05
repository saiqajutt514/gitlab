import {
  IsNotEmpty,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { OtpReasonEnum } from '../enum/otp.enum';

/**
 * mobileNo: number,
 * reason: OtpReasonEnum,
 * userid: string;
 */
export class sendOtp {
  @MinLength(12)
  @MaxLength(12)
  @IsNumber()
  @IsNotEmpty()
  mobileNo: number;

  @IsOptional()
  @IsEnum(OtpReasonEnum)
  reason: OtpReasonEnum;

  @IsOptional()
  userid: string;
}

/**
 *@param tId: string;
 *@param otp: string;
 *@param userId?: string;
 *@param licExpiry?: string;
 *@param dateOfBirth?: string;
 */
export class VerifyDto {
  tId: string;
  otp: string;
  userId?: string;
  licExpiry?: string;
  dateOfBirth?: string;
}
export interface ListSearchSortDto {
  filters?: any;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

export interface OtpLogListFilters {
  otp?: number;
  mobileNo?: number;
  createdAt?: string[];
}
export interface OtpLogsListSearchSortDto {
  filters?: OtpLogListFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

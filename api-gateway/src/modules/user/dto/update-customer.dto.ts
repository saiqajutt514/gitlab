import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsNumberString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceToken: string;

  @IsOptional()
  @IsString()
  deviceName: string;

  @IsOptional()
  @IsNumber()
  latitude: number;

  @IsOptional()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumberString()
  @MinLength(12)
  @MaxLength(12)
  mobileNo: string;

  emailId?: string;
  @IsOptional()
  @IsString()
  profileImage?: string;
  @IsOptional()
  @IsString()
  prefferedLanguage?: string;
}

export interface TransactionFilters {
  userId?: string;
  entityType?: string;
  transactionId?: string;
  createdAt?: string[];
  startDate?: string[];
  endDate?: string[];
  packageName?: string;
  subscriptionAmount?: number;
  transactionAmount?: number;
  remainingDays?: number;
  status?: number;
}
export interface ListSearchSortDto {
  filters?: TransactionFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

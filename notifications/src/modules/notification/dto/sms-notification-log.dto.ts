import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class SmsNotificationLogDto {
  @IsOptional()
  @IsString()
  externalId: string;

  @IsNotEmpty()
  @IsString()
  mobileNo: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  response: any;

  @IsOptional()
  @IsString()
  sentTime: string;

  @IsNotEmpty()
  status: number;
}
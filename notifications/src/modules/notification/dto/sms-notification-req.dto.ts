import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class SmsNotificationReqDto {

  @IsOptional()
  @IsString()
  externalId: string;

  @IsOptional()
  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  mobileNo: string;

  @IsOptional()
  @IsString()
  templateCode: string;

  @IsOptional()
  @IsString()
  message: string;

  @IsOptional()
  keyValues: any;
 
  @IsOptional()
  @IsBoolean()
  isLoggable: boolean

}
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class PushNotificationReqDto {

  @IsOptional()
  @IsString()
  externalId: string;

  @IsOptional()
  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  deviceToken: string;

  @IsOptional()
  @IsString()
  clientOs: string;

  @IsOptional()
  @IsString()
  templateCode: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  message: string;

  @IsOptional()
  keyValues: any;

  @IsOptional()
  extraParams: any;

  @IsOptional()
  extraOptions: any;

  @IsOptional()
  @IsBoolean()
  multiple: boolean

  @IsOptional()
  @IsArray()
  deviceTokenList: string[];
 
  @IsOptional()
  @IsBoolean()
  isLoggable: boolean

}

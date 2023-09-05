import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class EmailNotificationReqDto {

  @IsOptional()
  @IsString()
  externalId: string;

  @IsOptional()
  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  receiver: string;

  @IsOptional()
  @IsString()
  templateCode: string;

  @IsOptional()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  body: string;

  @IsOptional()
  address: any;

  @IsOptional()
  keyValues: any;
 
  @IsOptional()
  @IsBoolean()
  isLoggable: boolean

}
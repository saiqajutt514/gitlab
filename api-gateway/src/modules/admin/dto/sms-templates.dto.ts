import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSmsTemplateDto {

  @IsNotEmpty()
  @IsString()
  templateCode: string;

  @IsNotEmpty()
  @IsString()
  templateName: string;

  @IsOptional()
  @IsString()
  templateNameArabic: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  messageArabic: string;

  @IsOptional()
  dataKeys: any;

  @IsOptional()
  receiver: number;

  @IsOptional()
  status: boolean;

}

export class UpdateSmsTemplateDto {

  @IsNotEmpty()
  @IsString()
  templateName: string;

  @IsOptional()
  @IsString()
  templateNameArabic: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  messageArabic: string;

  @IsOptional()
  dataKeys: any;

  @IsOptional()
  receiver: number;

  @IsOptional()
  status: boolean;

  @IsOptional()
  logStatus: boolean;

}
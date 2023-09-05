import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePushTemplateDto {

  @IsNotEmpty()
  @IsString()
  templateCode: string;

  @IsNotEmpty()
  @IsString()
  templateName: string;

  @IsOptional()
  @IsString()
  templateNameArabic: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  titleArabic: string;

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

export class UpdatePushTemplateDto {

  @IsNotEmpty()
  @IsString()
  templateName: string;

  @IsOptional()
  @IsString()
  templateNameArabic: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  titleArabic: string;

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
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEmailTemplateDto {

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
  subject: string;

  @IsOptional()
  @IsString()
  subjectArabic: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  bodyArabic: string;

  @IsOptional()
  address: any;

  @IsOptional()
  dataKeys: any;

  @IsOptional()
  receiver: number;

  @IsOptional()
  status: boolean;

}

export class UpdateEmailTemplateDto {

  @IsNotEmpty()
  @IsString()
  templateName: string;

  @IsOptional()
  @IsString()
  templateNameArabic: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  subjectArabic: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  bodyArabic: string;

  @IsOptional()
  address: any;

  @IsOptional()
  dataKeys: any;

  @IsOptional()
  receiver: number;

  @IsOptional()
  status: boolean;

  @IsOptional()
  logStatus: boolean;

}

export class UpdateTemplateStatusDto {
  @IsNotEmpty()
  status: boolean;
}
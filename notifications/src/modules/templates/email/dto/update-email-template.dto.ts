import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { NOTIFY_RECEIVER } from 'src/constants/templates.enum';

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
  @IsEnum(NOTIFY_RECEIVER)
  receiver: NOTIFY_RECEIVER;

  @IsOptional()
  status: boolean;

  @IsOptional()
  logStatus: boolean;

}

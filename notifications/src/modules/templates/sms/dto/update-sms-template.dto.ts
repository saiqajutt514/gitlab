import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { NOTIFY_RECEIVER } from 'src/constants/templates.enum';

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
  @IsEnum(NOTIFY_RECEIVER)
  receiver: NOTIFY_RECEIVER;

  @IsOptional()
  status: boolean;

  @IsOptional()
  logStatus: boolean;

}

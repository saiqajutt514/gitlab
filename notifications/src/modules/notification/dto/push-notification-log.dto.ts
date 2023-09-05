import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class PushNotificationLogDto {
  @IsOptional()
  @IsString()
  externalId: string;

  @IsNotEmpty()
  @IsString()
  deviceToken: string;

  @IsNotEmpty()
  deviceType: number;

  @IsOptional()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  payload: any;

  @IsOptional()
  @IsString()
  response: any;

  @IsOptional()
  @IsString()
  sentTime: string;

  @IsNotEmpty()
  status: number;
}

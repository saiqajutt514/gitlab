import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EmailNotificationLogDto {
  @IsOptional()
  @IsString()
  externalId: string;

  @IsNotEmpty()
  @IsString()
  receiver: string;

  @IsOptional()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  address: any;

  @IsOptional()
  @IsString()
  response: any;

  @IsOptional()
  @IsString()
  sentTime: string;

  @IsNotEmpty()
  status: number;
}
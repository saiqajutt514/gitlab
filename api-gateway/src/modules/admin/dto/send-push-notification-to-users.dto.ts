import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum CustomerUserExternalType {
  Rider = 1,
  Captain = 2,
}

export class SendPushNotificationToUsersDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsEnum(CustomerUserExternalType)
  @IsNotEmpty()
  @IsOptional()
  userType: number;

  @IsArray()
  @IsNotEmpty()
  @IsOptional()
  userIds: number[];
}

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { USER_STATUS } from '../users.enum';
import { Exclude, Expose } from 'class-transformer';

export class MuteUnmuteConversationDto {

  @IsNotEmpty()
  @IsNumber()
  userId: number

  @IsNotEmpty()
  @IsString()
  conversationId: string

  @IsNotEmpty()
  status: boolean
}
export class CreateUserDto {

  @IsNotEmpty()
  @IsNumber()
  userId: number

  @IsOptional()
  @IsString()
  firstName: string

  @IsOptional()
  @IsString()
  firstNameArabic?: string

  @IsOptional()
  @IsString()
  lastName: string

  @IsOptional()
  @IsString()
  lastNameArabic?: string

  @IsOptional()
  @IsString()
  englishName?: string

  @IsOptional()
  @IsString()
  arabicName?: string

  @IsOptional()
  @IsString()
  emailId: string

  @IsOptional()
  @IsString()
  mobileNo: string

  @IsOptional()
  @IsString()
  dateOfBirth: Date

  @IsOptional()
  @IsString()
  gender: string

  @IsOptional()
  @IsString()
  profileImage: string

  @IsOptional()
  @IsNumber()
  isOnline: number

  @IsOptional()
  @IsString()
  lastSeenAt: Date

  @IsOptional()
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName: string;

  @IsOptional()
  @IsString()
  deviceToken: string;

  @IsOptional()
  @IsString()
  clientOs: string;

  @IsOptional()
  @IsString()
  prefferedLanguage: string;

  @IsOptional()
  @IsString()
  appVersion: string;

}


export class UpdateUserDto {

  @IsOptional()
  @IsString()
  firstName: string

  @IsOptional()
  @IsString()
  firstNameArabic?: string

  @IsOptional()
  @IsString()
  lastName: string

  @IsOptional()
  @IsString()
  lastNameArabic?: string

  @IsOptional()
  @IsString()
  gender: string

  @IsOptional()
  @IsString()
  profileImage: string

  @IsOptional()
  @IsNumber()
  isOnline: number

  @IsOptional()
  @IsString()
  lastSeenAt: Date

  @IsOptional()
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName: string;

  @IsOptional()
  @IsString()
  deviceToken: string;

  @IsOptional()
  @IsString()
  clientOs: string;

  @IsOptional()
  @IsString()
  prefferedLanguage: string;

  @IsOptional()
  @IsString()
  appVersion: string;

}

export class ChatUserStatusDto {
  @IsNotEmpty()
  @IsEnum(USER_STATUS)
  status: USER_STATUS

  @IsNotEmpty()
  @IsString()
  reason: string
}

export class ChatUserDetailDto {

  @Expose()
  @IsNumber()
  userId: number;

  @Expose()
  @IsString()
  firstName: string;

  @Expose()
  @IsString()
  lastName: string;

  @Expose()
  @IsString()
  firstNameArabic: string;

  @Expose()
  @IsString()
  lastNameArabic: string;

  @Expose()
  @IsString()
  emailId: string;

  @Expose()
  @IsString()
  mobileNo: string;

  @Expose()
  @IsString()
  profileImage: string;

  @Expose()
  @IsEnum(USER_STATUS)
  status: USER_STATUS;

  @Expose()
  @IsString()
  reason: string;
}
import { IsString, IsNumber } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class ChatUserDto {

  @Exclude()
  @IsNumber()
  userId: number;

  @Exclude()
  @IsString()
  profileImage: string;

  @Expose()
  @IsString()
  firstName: string;

  @Expose()
  @IsString()
  lastName: string;

  @Expose()
  @IsString()
  emailId: string;

  @Expose()
  @IsString()
  mobileNo: string;

  @Expose()
  @IsString()
  dateOfBirth: string;

  @Expose()
  @IsString()
  gender: string;

  @Expose()
  @IsString()
  deviceId: string;

  @Expose()
  @IsString()
  deviceToken: string;

  @Expose()
  @IsString()
  clientOs: string;

  @Expose()
  @IsString()
  prefferedLanguage: string;

  @Expose()
  @IsString()
  appVersion: string;

  @Expose()
  @IsString()
  deviceName: string;

  @Expose()
  otherDetails: any
}

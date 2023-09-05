import { IsString, IsNumber } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class CustomerDto {

  @Exclude()
  @IsNumber()
  userId: number;

  @Exclude()
  @IsString()
  userStatus: string;

  @Exclude()
  @IsString()
  authStatus: string;

  @Exclude()
  @IsString()
  profileImage: string;

  @Expose()
  @IsString()
  agentId: string;

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
  address1: string;

  @Expose()
  @IsString()
  address2: string;

  @Expose()
  @IsString()
  regionId: string;

  @Expose()
  @IsString()
  pinCode: string;

  @Expose()
  @IsString()
  activationDate: string;

  @Expose()
  @IsString()
  remarks: string;

  @Expose()
  @IsString()
  rejectionReason: string;

  @Expose()
  @IsString()
  subStatus: string;

  @Expose()
  @IsString()
  creationDate: string;

  @Expose()
  @IsString()
  modificationDate: string;

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
  socialId: string;

  @Expose()
  @IsString()
  socialProfile: string;

  @Expose()
  @IsString()
  appVersion: string;

  @Expose()
  @IsString()
  deviceName: string;

  @Expose()
  @IsString()
  smsEnable: string;

  @Expose()
  @IsString()
  emailEnable: string;

  @Expose()
  @IsString()
  notificationEnable: string;

  @Expose()
  @IsString()
  nationality: string;

  @Expose()
  @IsString()
  otherDetails: string;

  @Exclude()
  @IsString()
  additionalInfo: string;
  @Exclude()
  @IsNumber()
  driverId: string;

  @Exclude()
  @IsNumber()
  userType: number;

  @Exclude()
  @IsNumber()
  cabId: number;


}

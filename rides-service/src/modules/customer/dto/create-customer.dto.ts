import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsNumber()
  userId: any;

  @IsOptional()
  @IsNumber()
  idNumber: number;

  @IsOptional()
  @IsString()
  idExpiryDate: string;

  @IsOptional()
  @IsString()
  userStatus: string;

  @IsOptional()
  @IsString()
  authStatus: string;

  @IsOptional()
  @IsString()
  profileImage: string;

  @IsOptional()
  @IsString()
  agentId: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  arabicFirstName: string;

  @IsOptional()
  @IsString()
  arabicLastName: string;

  @IsOptional()
  @IsString()
  emailId: string;

  @IsOptional()
  @IsString()
  mobileNo: string;

  @IsOptional()
  @IsString()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  gender: string;

  @IsOptional()
  @IsString()
  address1: string;

  @IsOptional()
  @IsString()
  address2: string;

  @IsOptional()
  @IsString()
  regionId: string;

  @IsOptional()
  @IsString()
  pinCode: string;

  @IsOptional()
  @IsString()
  activationDate: string;

  @IsOptional()
  @IsString()
  remarks: string;

  @IsOptional()
  @IsString()
  rejectionReason: string;

  @IsOptional()
  @IsString()
  subStatus: string;

  @IsOptional()
  @IsString()
  creationDate: string;

  @IsOptional()
  @IsString()
  modificationDate: string;

  @IsOptional()
  @IsString()
  deviceId: string;

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
  socialId: string;

  @IsOptional()
  @IsString()
  socialProfile: string;

  @IsOptional()
  @IsString()
  appVersion: string;

  @IsOptional()
  @IsString()
  deviceName: string;

  @IsOptional()
  @IsString()
  smsEnable: string;

  @IsOptional()
  @IsString()
  emailEnable: string;

  @IsOptional()
  @IsString()
  notificationEnable: string;

  @IsOptional()
  @IsString()
  nationality: string;

  @IsOptional()
  @IsString()
  otherDetails: string;

  @IsOptional()
  @IsNumber()
  latitude: number;

  @IsOptional()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  additionalInfo: string;
}

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsEmail,
  IsOptional,
  Length,
  IsAlphanumeric,
  IsBoolean,
  IsNumberString,
} from 'class-validator';
import { IsValidPassword } from './custom-rules';

export class AdminLoginDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsBoolean()
  @IsOptional()
  status: boolean;
}

export class UpdateAdminDto {
  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsBoolean()
  @IsNotEmpty()
  status: boolean;
}

export class CreateNotifyUserDto {
  @IsNotEmpty()
  @Length(1, 50)
  fullName: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  @Length(9, 13, {
    message: 'Mobile Number should be equal to 9 digits.',
  })
  mobileNo: string;

  @IsOptional()
  @IsEmail()
  @Length(1, 50)
  email: string;
}

export class AdminIdDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class SetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @Length(8, 15)
  @IsValidPassword()
  password: string;
}

export class ResetPasswordDto extends SetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 15)
  @IsValidPassword()
  newPassword: string;
}

export class UpdateProfileDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;
}

export class UpdatePictureDto {
  userId?: any;

  @IsNotEmpty()
  @IsString()
  profileImage: string;
}
export class UpdateBalanceDto {
  userId?: any;

  @IsNotEmpty()
  amount: number;

  @IsOptional()
  applePayToken?: any;
}
export interface ClickPayCallBackResponseDto {
  acquirerMessage: string;
  acquirerRRN: string;
  cartId: string;
  customerEmail: string;
  respCode: string;
  respMessage: string;
  respStatus: string;
  signature: string;
  token: string;
  tranRef: string;
}

export class customerKycDto {
  @IsNotEmpty()
  userid: string;

  @IsNotEmpty()
  mobileNo: string;

  @IsNotEmpty()
  dateOfBirth?: string;
}

export class kycDto {
  @IsNumberString()
  @IsNotEmpty()
  @Length(10, 10)
  userId: string;

  @IsNotEmpty()
  @Length(10, 10)
  dateOfBirth: string;
}

export class userInfoDto {
  @IsNotEmpty()
  phoneNumber: string;
}

import { IsString, IsNotEmpty, IsEmail, IsOptional, Length, IsBoolean } from 'class-validator';

export class AdminLoginDto {
  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  password: string
}

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  fullName: string

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string

  @IsOptional()
  password: string

  @IsNotEmpty()
  roleId: string

  @IsBoolean()
  @IsOptional()
  status: boolean
}

export class UpdateAdminDto {
  @IsNotEmpty()
  fullName: string

  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  roleId: string

  @IsBoolean()
  @IsNotEmpty()
  status: boolean
}

export class CreateNotifyUserDto {
  @IsNotEmpty()
  @Length(1, 50)
  fullName: string

  @IsNotEmpty()
  city: string

  @IsNotEmpty()
  @Length(9, 13, {
    message: 'Mobile Number should be equal to 9 digits.'
  })
  mobileNo: string

  @IsOptional()
  @IsEmail()
  @Length(1, 50)
  email: string
}

export class SetPasswordDto {
  // @IsNotEmpty()
  // @IsString()
  @IsOptional()
  id: string

  @IsNotEmpty()
  @IsString()
  @Length(8,15)
  password: string
}

export class ResetPasswordDto extends SetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsString()
  oldPassword: string

  @IsNotEmpty()
  @IsString()
  @Length(8,15)
  newPassword: string
}

export class UpdateProfileDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsString()
  fullName: string
}

export class UpdatePictureDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsString()
  profileImage: string
}
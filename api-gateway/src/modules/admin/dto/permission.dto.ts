import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreatePermissionDto {

  @IsString()
  @IsNotEmpty()
  category: string

  @IsString()
  @IsNotEmpty()
  accessName: string

  @IsString()
  @IsNotEmpty()
  accessCode: string

  @IsNumber()
  @IsNotEmpty()
  sequence: number

  @IsBoolean()
  @IsOptional()
  status: boolean

}

export class UpdatePermissionDto extends CreatePermissionDto {

}
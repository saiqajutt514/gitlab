import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoleDto {

  @IsString()
  @IsNotEmpty()
  title: string

  @IsOptional()
  capabilites: any

  @IsBoolean()
  @IsOptional()
  status: boolean

}

export class UpdateRoleDto extends CreateRoleDto {

}
import { Type } from 'class-transformer';
import { IsString, IsInt, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { from } from 'rxjs';
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
export class FilterRoleDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  status: number
}
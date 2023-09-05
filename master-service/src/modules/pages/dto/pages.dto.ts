import { Type } from 'class-transformer';
import { IsString, IsInt, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export interface ListSortDto {
  lang:string
}

export class AddSlaDto {

  @IsString()
  @IsOptional()
  id: string

  @IsString()
  @IsOptional()
  language: string

  @IsString()
  @IsOptional()
  title: string

  @IsString()
  @IsOptional()
  order: number

  @IsString()
  @IsOptional()
  description: string

}

export class UpdateSlaDto {

  @IsString()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  language: string

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  order: number

  @IsString()
  @IsNotEmpty()
  description: string


}
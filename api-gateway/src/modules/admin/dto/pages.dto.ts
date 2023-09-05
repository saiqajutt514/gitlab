import { Type } from 'class-transformer';
import { IsString, IsInt, IsNotEmpty, IsOptional, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
class AddSlaItem{
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
  order: string

  @IsString()
  @IsOptional()
  description: string
}


export class AddSlaDto {
  @ValidateNested({ each: true })
  @Type(() => AddSlaItem)
   items: AddSlaItem[];
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
  order: string

  @IsString()
  @IsNotEmpty()
  description: string


}
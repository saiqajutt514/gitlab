import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {

  @IsString()
  @IsNotEmpty()
  categoryName: string

  @IsBoolean()
  @IsOptional()
  status: boolean

}

export class UpdateCategoryDto extends CreateCategoryDto {

}
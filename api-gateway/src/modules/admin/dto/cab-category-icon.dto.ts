import { IsString, IsOptional } from 'class-validator';

export class CabCategoryIcon {

  @IsString()
  @IsOptional()
  categoryIcon: string

}

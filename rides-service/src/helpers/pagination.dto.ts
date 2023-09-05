import { IsNumber, IsOptional } from 'class-validator';

export class PaginationCommonDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

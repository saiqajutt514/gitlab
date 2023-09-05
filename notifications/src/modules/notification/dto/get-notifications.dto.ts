import { IsNumber, IsOptional } from 'class-validator';

export class GetNotificationsDto {
  @IsOptional()
  @IsNumber()
  type?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  userType?: number;
}

import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EARNING_DURATION } from 'src/enem/all.enem';
import { PaginationCommonDto } from 'src/helpers/pagination.dto';

export class TimeUsageDto extends PaginationCommonDto {
  @IsNotEmpty()
  @IsEnum(EARNING_DURATION)
  duration: EARNING_DURATION;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

import { IsOptional, IsString } from 'class-validator';

export class GetNotificationsDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  userType?: string;
}

import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { DriverIdDto, RiderIdDto } from './user.dto';

export class DriverTripRejectCancelDto extends DriverIdDto {
  @IsString()
  @IsNotEmpty()
  declinedReason: string
}

export class CancelTripDestinationDto {

  @IsNumber()
  @IsOptional()
  latitude?: number

  @IsNumber()
  @IsOptional()
  longitude?: number

  @IsString()
  @IsOptional()
  address?: string

  @IsOptional()
  @IsString()
  cityNameInArabic?: string
}

export class RiderTripCancelDto {
  @IsString()
  @IsNotEmpty()
  declinedReason: string

  @IsOptional()
  @Type(() => CancelTripDestinationDto)
  dropAddress?: CancelTripDestinationDto;
}

export class DeclineReasonDto {
  @IsString()
  @IsNotEmpty()
  declinedReason: string
}

import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { AddressType } from '../enum/services.enum';

export class SearchRiderDto {

  @IsNotEmpty()
  @IsString()
  keyword: string;

}

export class AddressDto {

  @IsNotEmpty()
  @IsEnum(AddressType)
  addressType: AddressType

  @IsNotEmpty()
  @IsString()
  address: string

  @IsOptional()
  @IsString()
  cityNameInArabic?: string

  @IsNotEmpty()
  @IsNumber()
  latitude: number

  @IsNotEmpty()
  @IsNumber()
  longitude: number
}

export class TripBodyDto {

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => AddressDto)
  addresses: AddressDto[]

  @IsOptional()
  promoCode?: string

}
export class CreateTripNowDto extends TripBodyDto {

  @IsNotEmpty()
  cabId: string

  @IsOptional()
  createdType: number

  @IsOptional()
  createdBy: string

  @IsNotEmpty()
  riderId: string

  @IsNotEmpty()
  driverId: string

}

export class CreateTripScheduleDto extends CreateTripNowDto {

  @IsString()
  @IsNotEmpty()
  riderScheduledAt: string

}

export class SearchDriverDto extends TripBodyDto {

  @IsNotEmpty()
  riderId: string

  @IsOptional()
  cabId: string

}

export class EstimatePriceDto extends TripBodyDto {

  @IsNotEmpty()
  riderId: string

  @IsNotEmpty()
  driverId: string

  @IsNotEmpty()
  cabId: string
}

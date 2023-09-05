import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum AddressType {
  PICK_UP = 1,
  DESTINATION = 2,
}

export enum TRIP_IMAGE_BY {
  RIDER = 1,
  DRIVER = 2,
}

export class AddressDto {
  @IsNotEmpty()
  @IsEnum(AddressType)
  addressType: AddressType;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  cityNameInArabic?: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}

export class TripsCreateDTO {
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => AddressDto)
  addresses: AddressDto[];

  @IsNotEmpty()
  cabId: string;

  @IsOptional()
  promoCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  applePayToken?: any;
}

export class ScheduleTripsCreateDTO extends TripsCreateDTO {
  @IsString()
  @IsNotEmpty()
  riderScheduledAt: string;
}

export class TripIdParamDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;
}

export class TripImageDto {
  @IsString()
  @IsNotEmpty()
  image: string;

  @IsNotEmpty()
  @IsEnum(TRIP_IMAGE_BY)
  imageBy: TRIP_IMAGE_BY;
}

export class TripPhotoDto {
  @IsNumberString()
  @IsNotEmpty()
  type: number;
}

export class TripUploadPhotoDto extends TripPhotoDto {
  @IsNotEmpty()
  @Type(() => TripImageDto)
  images: TripImageDto[];
}

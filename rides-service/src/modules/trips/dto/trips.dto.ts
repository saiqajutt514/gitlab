import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  TripStatus,
  TripPreviousStatus,
  TransactionStatus,
} from '../trips.enum';
import { TripAddressEntity } from '../../trip_address/trip_address.entity';
import { TripDriver } from 'src/modules/trip_drivers/entities/trip_driver.entity';
import { TRIP_IMAGE_BY } from 'src/modules/trip_images/trip_images.enum';

export class TripsCreateDTO {
  @IsNotEmpty()
  riderId: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TripAddressEntity)
  addresses: TripAddressEntity[];

  @IsNotEmpty()
  cabId: string;

  @IsOptional()
  promoCode?: string;

  @IsOptional()
  tripType?: number;

  @IsOptional()
  createdType: number;

  @IsOptional()
  createdBy: string;

  @IsOptional()
  driverId: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;
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

export interface TripsUpdateDTO {
  promoCode?: string;
  promoCodeAmount?: number;
  status?: TripStatus;
  previousStatus?: TripPreviousStatus;
  riderNotifiedAt?: string;
  driverAssignedAt?: string;
  tripCancelledAt?: string;
  cancelledByDriverAt?: string;
  tripExpiredAt?: string;
  cancelledBy?: string;
  cancelledReason?: string;
  cancelledByDriver?: number;
  tripOtp?: number;
  driverReachedAt?: string;
  tripFinishedAt?: string;
  tripStartedAt?: string;
  riderAmount?: number;
  waitingCharge?: number;
  completed?: boolean;
  paid?: boolean;
  riderPaidAt?: string;
  transactionId?: string;
  transactionStatus?: TransactionStatus;
  driverAmount?: number;
  tripTime?: number;
  tripDistanceCovered?: number;
  driverId?: string;
  estimatedBaseAmount?: number;
  tripBaseAmount?: number;
  estimatedTripTime?: number;
  tripDistance?: number;
  drivers?: TripDriver[];
  addresses?: TripAddressEntity[];
  taxAmount?: number;
  tripVerified?: boolean;
  changedDestination?: boolean;
  changedDestinationCount?: any;
  cabId?: string;
  baseFare?: number;
  costPerMin?: number;
  costPerKm?: number;
  motAmount?: number;
  zatcaQR?: string;
  transactionFee?: number;
  withdrawalFee?: number;
}

export interface TripDriversInput {
  point: string;
}

export interface TripDeclinedDTO {
  status: TripStatus;
  tripCancelledAt: string;
  riderAmount: number;
  driverAmount?: number;
  transactionStatus?: TransactionStatus;
  cancelledBy: string;
  cancelledReason: string;
  motAmount?: number;
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

export interface AdminModeDTO {
  adminMode?: boolean;
}

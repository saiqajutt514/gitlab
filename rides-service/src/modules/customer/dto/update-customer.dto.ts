import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
    isRider?: boolean
    totalRides?: number
    upcomingRides?: number
    ridesCancelled?: number
    totalTrips?: number
    tripsCancelled?: number
    tripsDeclined?: number
    totalEarned?: number
    totalSpent?: number
    canId?: string
}
export class UpdatePictureDto {
    @IsNotEmpty()
    @IsString()
    userId: string
  
    @IsNotEmpty()
    @IsString()
    profileImage: string
  }
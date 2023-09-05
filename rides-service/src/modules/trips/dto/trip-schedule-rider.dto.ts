import { IsNotEmpty, isNotEmpty } from 'class-validator';

export class TripScheduleRiderDto {
    @IsNotEmpty()
    tripId: string;

    @IsNotEmpty()
    riderId: string
}
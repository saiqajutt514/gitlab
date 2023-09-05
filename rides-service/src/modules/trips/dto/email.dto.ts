import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class RiderTripCompletedEmailDto {
    @IsOptional()
    vehicleCategory?: string

    @IsOptional()
    noOfSeats?: number

    @IsOptional()
    vehicleImage?: string

    @IsOptional()
    vehicleDescription?: string

    @IsOptional()
    tripImage?: string

    @IsOptional()
    totalFare?: number

    @IsOptional()
    tripFare?: number

    @IsOptional()
    subTotal?: number

    @IsOptional()
    amountCharged?: number

    @IsOptional()
    pickUp?: string

    @IsOptional()
    dropOff?: string

    @IsOptional()
    dayPart?: string

    @IsOptional()
    riderName?: string

    @IsOptional()
    captainName?: string

    @IsOptional()
    tripNo?: number

    @IsOptional()
    startTime?: string

    @IsOptional()
    endTime?: string

    @IsOptional()
    tripTime?: string

    @IsOptional()
    totalKm?: number

    @IsOptional()
    carPlatNo?: string

    @IsOptional()
    mailDate?: string
}

export class DriverTripCompletedEmailDto {

    @IsOptional()
    mailDate?: string

    @IsOptional()
    dayPart?: string

    @IsOptional()
    totalCost?: number

    @IsOptional()
    tripFare?: number

    @IsOptional()
    perkmCharges?: number

    @IsOptional()
    perMinCharges?: number

    @IsOptional()
    serviceTax?: number

    @IsOptional()
    taxAmount?: number

    @IsOptional()
    amountEarned?: number

    @IsOptional()
    riderName?: string

    @IsOptional()
    captainName?: string

    @IsOptional()
    vehicleImage?: string

    @IsOptional()
    vehicleCategory?: string

    @IsOptional()
    vehicleDescription?: string

    @IsOptional()
    noOfSeats?: number

    @IsOptional()
    totalKm?: number

    @IsOptional()
    tripTime?: string

    @IsOptional()
    startTime?: string

    @IsOptional()
    pickUp?: string

    @IsOptional()
    endTime?: string

    @IsOptional()
    dropOff?: string

    @IsOptional()
    tripImage?: string
}
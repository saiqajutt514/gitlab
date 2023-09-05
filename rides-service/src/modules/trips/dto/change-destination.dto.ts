import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ChangeTripDestinationDto {

    @IsNumber()
    @IsNotEmpty()
    latitude: number

    @IsNumber()
    @IsNotEmpty()
    longitude: number

    @IsString()
    @IsNotEmpty()
    address: string

    @IsOptional()
    @IsString()
    cityNameInArabic?: string

}
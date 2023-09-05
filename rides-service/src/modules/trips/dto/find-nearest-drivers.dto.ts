import { IsNotEmpty, IsOptional } from "class-validator";

export class FindNearestDriversDto {
    @IsNotEmpty()
    latitude: number

    @IsNotEmpty()
    longitude: number
  
    @IsNotEmpty()
    radius?: number
  
    @IsOptional()
    limit?: number

    @IsOptional()
    excludeList?: string[];

    @IsOptional()
    cabId?: string;

    @IsOptional()
    destinationLatitude?: number

    @IsOptional()
    destinationLongitude?: number
}
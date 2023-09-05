import { IsOptional } from "class-validator";

export class GetCabTypeQueryDto {

    @IsOptional()
    originAddressLat: string

    @IsOptional()
    originAddressLng: string

    @IsOptional()
    destinationAddressLat: string

    @IsOptional()
    destinationAddressLng: string

}

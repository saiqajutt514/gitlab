import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class DistanceDto {
    @IsNumber()
    @IsNotEmpty()
    distance: number
}
export class TimeDto {
    @IsNumber()
    @IsOptional()
    time: number
}

export class CabIdDto {
    @IsString()
    @IsNotEmpty()
    cabId: string
}
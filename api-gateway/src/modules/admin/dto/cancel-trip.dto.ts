import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class CancelTripDto {

  @IsNotEmpty()
  @IsString()
  cancelReason: string;

  @IsOptional()
  superAdmin: boolean;

}

export class TripIdParamDto {

  @IsString()
  @IsNotEmpty()
  tripId: string;

}


export class AdminIdParamDto {

  @IsString()
  @IsNotEmpty()
  adminId: string;

}

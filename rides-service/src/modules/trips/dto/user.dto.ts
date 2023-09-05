import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class DriverIdDto {
    @IsString()
    @IsNotEmpty()
    driverId: string;
}

export class RiderIdDto {
    @IsString()
    @IsNotEmpty()
    riderId: string;
}

export class SessionIdDto {
  @IsNotEmpty()
  sessionId: string;
}

export class AdminIdDto {
  @IsNotEmpty()
  adminId: string;
}

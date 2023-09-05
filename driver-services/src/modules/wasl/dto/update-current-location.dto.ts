import { IsDateString, IsNotEmpty } from "class-validator";

export class UpdateCurrentLocationDto {
  @IsNotEmpty()
  driverIdentityNumber: string;

  @IsNotEmpty()
  vehicleSequenceNumber: string;

  @IsNotEmpty()
  latitude: number;

  @IsNotEmpty()
  longitude: number;

  @IsNotEmpty()
  hasCustomer: boolean;

  @IsNotEmpty()
  @IsDateString({ strict: true }, { message: "Date should be in ISO format" })
  updatedWhen: string;
}

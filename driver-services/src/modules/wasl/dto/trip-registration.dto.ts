import { IsDateString, IsNotEmpty, Max, Min } from "class-validator";

export class TripRegistrationDto {
  @IsNotEmpty()
  sequenceNumber: string;

  @IsNotEmpty()
  driverId: string;

  @IsNotEmpty()
  @IsDateString({ strict: true }, { message: "Date should be in ISO format" })
  startedWhen: string;

  @IsNotEmpty()
  @IsDateString({ strict: true }, { message: "Date should be in ISO format" })
  pickupTimestamp: string;

  @IsNotEmpty()
  @IsDateString({ strict: true }, { message: "Date should be in ISO format" })
  dropoffTimestamp: string;

  @IsNotEmpty()
  @Min(1)
  distanceInMeters: number;

  @IsNotEmpty()
  @Min(1)
  durationInSecondes: number;

  @IsNotEmpty()
  @Min(0)
  @Max(5)
  customerRating: number;

  @IsNotEmpty()
  customerWaitingTimeInSeconds: string;

  originCityNameInArabic: string | null | undefined;

  destinationCityNameInArabic: string | null | undefined;

  @IsNotEmpty()
  originLatitude: number;

  @IsNotEmpty()
  originLongitude: number;

  @IsNotEmpty()
  destinationLatitude: number;

  @IsNotEmpty()
  destinationLongitude: number;

  tripCost: number | null | undefined;
}

import { IsNotEmpty } from "class-validator";

export class DriverVehicleRegistrationDto {
  @IsNotEmpty()
  identityNumber: string;

  dateOfBirthHijri: string | null | undefined;

  dateOfBirthGregorian: string | null | undefined;

  emailAddress: string | null | undefined;

  @IsNotEmpty()
  mobileNumber: string;

  @IsNotEmpty()
  sequenceNumber: string;

  @IsNotEmpty()
  plateLetterRight: string;

  @IsNotEmpty()
  plateLetterMiddle: string;

  @IsNotEmpty()
  plateLetterLeft: string;

  @IsNotEmpty()
  plateNumber: string;

  @IsNotEmpty()
  plateType: string;
}

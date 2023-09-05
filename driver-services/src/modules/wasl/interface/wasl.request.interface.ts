import { CAR_LICENCE_TYPE } from "src/modules/captain/constants";

interface CaptainInterface {
  identityNumber: string;
  dateOfBirthHijri?: string;
  dateOfBirthGregorian?: string;
  emailAddress?: string;
  mobileNumber: string;
}

interface VehicleInterface {
  sequenceNumber: string;
  plateLetterRight: string;
  plateLetterMiddle: string;
  plateLetterLeft: string;
  plateNumber: string;
  plateType: CAR_LICENCE_TYPE;
}

export interface RegistrationInterface {
  driver: CaptainInterface;
  vehicle: VehicleInterface;
}

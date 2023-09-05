import {
  CriminalRecordsStatus,
  ELIGIBILITY,
  RejectReasons,
  ResultCodes,
} from "src/modules/wasl/wasl.enum";

export interface WASLRegistrationResponse {
  success: boolean;
  resultCode: string;
  result: {
    eligibility: ELIGIBILITY;
    eligibilityExpiryDate: string;
    rejectionReasons: RejectReasons[];
  };
}

export interface EligibilityInquiryResponseForAll {
  identityNumber: string;
  driverEligibility: ELIGIBILITY;
  eligibilityExpiryDate: string;
  vehicles: {
    sequenceNumber: string;
    vehicleEligibility: ELIGIBILITY;
  }[];
}

export interface EligibilityInquiryResponseForOne {
  identityNumber: string;
  driverEligibility: ELIGIBILITY;
  eligibilityExpiryDate: string;
  rejectionReasons: RejectReasons[];
  criminalRecordStatus: CriminalRecordsStatus;
  vehicles: {
    sequenceNumber: string;
    vehicleEligibility: ELIGIBILITY;
    rejectionReasons: RejectReasons[];
  }[];
}

export interface TripRegistrationResponse {
  success: boolean;
  resultCode: ResultCodes;
}

export interface UpdateCurrentLocationResponse {
  success: boolean;
  resultCode: ResultCodes;
  resultMsg?: string;
  result: {
    failedVehicles: string[];
  };
}

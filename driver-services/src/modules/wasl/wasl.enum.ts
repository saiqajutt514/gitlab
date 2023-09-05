export enum ELIGIBILITY {
  VALID = 'VALID',
  INVALID = 'INVALID',
  PENDING = 'PENDING',
}

export enum RejectReasons {
  ALIEN_LEGAL_STATUS_NOT_VALID = 'Alien residency is not valid',
  MAX_AGE_NOT_SATISFIED = 'Driver’s age is greater than 65',
  MIN_AGE_NOT_SATISFIED = 'Driver age is less than 18',
  DRIVER_IDENTITY_EXPIRED = 'Driver’s identity is expired',
  DRIVER_IS_BANNED = 'Driver is banned from practicing dispatching activities from Wasl platform per TGA order',
  DRIVER_LICENSE_EXPIRED = 'Driver license is expired',
  DRIVER_LICENSE_NOT_ALLOWED = 'Driver’s license type is not allowed',
  VEHICLE_INSURANCE_EXPIRED = 'Vehicle’s insurance has expired',
  VEHICLE_LICENSE_EXPIRED = 'Vehicle’s license has expired',
  VEHICLE_NOT_INSURED = 'Vehicle does not have a valid insured',
  OLD_VEHICLE_MODEL = 'Vehicle’s model is older than 5 years',
  PERIODIC_INSPECTION_POLICY_EXPIRED = 'Vehicle’s periodic inspection expired',
  DRIVER_FAILED_CRIMINAL_RECORD_CHECK = 'Criminal record check is complete and the driver is ineligible to practice the dispatching activity due to the criminal record check result',
  DRIVER_REJECTED_CRIMINAL_RECORD_CHECK = 'Criminal record check was declined by the driver on Absher portal',
  CRIMINAL_RECORD_CHECK_PERIOD_EXPIRED = 'The driver did not accept nor decline the criminal record check on Absher portal within 10 days since the request initiation date',
  VEHICLE_PLATE_TYPE_NOT_ALLOWED = 'Vehicle License Type/Category is not allowed',
  OPERATION_CARD_EXPIRED = 'Vehicle operation card is expired.Utilize the registration service in order to update the driver eligibility status.',
  DRIVER_ELIGIBILITY_EXPIRED = 'Driver eligibility status is expired.Utilize the registration service in order to update the driver eligibility status.',
}

export enum CriminalRecordsStatus {
  WAITING = 'Waiting for sending criminal record check request',
  PENDING_DRIVER_APPROVAL = 'Driver criminal record check request is initiated and an SMS message has been sent to the driver’s mobile number to approve/reject the request on Absher portal',
  DRIVER_APPROVED = 'Criminal record check was approved by the driver on Absher portal',
  DRIVER_REJECTED = 'Criminal record check was declined by the driver on Absher portal',
  UNDER_PROCESSING = 'Driver is undergoing criminal record checks',
  DONE_RESULT_OK = 'Criminal record check is complete and the result indicates that the driver can practice the dispatching activity',
  DONE_RESULT_NOT_OK = 'Criminal record check is complete and the driver is ineligible to practice the the driver is ineligible to practice the record check result',
  REQUEST_EXPIRED = 'The driver did not accept nor decline the criminal record check on Absher portal within 10 days since the request initiation date',
}

export enum ResultCodes {
  success = 'Technical Success',
  bad_request = 'Bad Request',
  DRIVER_VEHICLE_DUPLICATE = 'Driver or vehicle already registered',
  DRIVER_NOT_ALLOWED = 'Foreign nationalities are not allowed per TGA rules',
  DRIVER_NOT_FOUND = 'Driver information is not correct/ kindly revise input data before re - attempting registration',
  VEHICLE_NOT_FOUND = 'Vehicle information is not correct / kindly revise input data before re - attempting registration',
  VEHICLE_NOT_OWNED_BY_FINANCIER = 'Vehicle ownership is not associated / linked to the driver nor an approved by SAMA financer (check BR05 in driver and vehicle registration service business rules section)',
  DRIVER_NOT_AUTHORIZED_TO_DRIVE_VEHICLE = 'Driver does not own the vehicle and there is no legal association between the driver and the vehicle “Not the co - owner / actual driver of the vehicle in MOI / Absher systems” (check BR05 in driver and vehicle registration service business rules section)',
  NO_VALID_OPERATION_CARD = 'No valid operating card found(check BR05 in driver and vehicle registration service business rules section)',
  CONTACT_WASL_SUPPORT = 'System internal error / missing data, kindly contact Wasl Support(check support section in page 3)',
}

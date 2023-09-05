export const GET_USER_DETAILS = 'get-user-details';
export const GET_CUSTOMER_DETAIL = 'get-customer-detail';

export const FETCH_CAR_INFO = 'fetch-car-info';

export const UPSERT_CUSTOMER = 'upsert-customer';

export const UPSERT_CHAT_USER = 'upsert-chat-user';
export const CUSTOMER_KYC = 'customer-kyc';

export const GET_ALL_OTP = 'get-all-otp';
export const GET_CUSTOMER_DETAILS_FOR_OTP_LOGS =
  'get-customer-details-for-otp-logs';

export const customerRequestPatterns = [UPSERT_CUSTOMER];

export const chatUserRequestPatterns = [UPSERT_CHAT_USER];

//otp
export const SEND_OTP = 'send-otp';
export const VERIFY_OTP = 'verify-otp';

export const CHECK_IF_CUSTOMER_EXIST_BY_MOBILE_AND_TYPE =
  'check-if-customer-exist-by-mobile-and-type';

//sms
export const SEND_SMS = 'send-sms';

//yakeen

export const CAR_INFO_BY_SEQUENCE = 'car-info-by-sequence';

export const CITIZEN_INFO = 'citizen-info';

export const ALIEN_ADDRESS_INFO = 'alien-address-info';

export const ALIEN_DL_INFO = 'alien-dl-info';

export const CITIZEN_DL_INFO = 'citizen-dl-info';

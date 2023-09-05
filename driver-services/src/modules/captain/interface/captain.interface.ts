export interface FindCaptainListParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  excludeList?: string[];
  cabId?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

export interface FindCaptainsByAdminParams {
  // TODO: Specify addresses array
  addresses: any;
  cabId?: string;
  riderId: string;
  promoCode?: string;
  radius?: number;
  limit?: number;
}

export interface CaptainLocationInfo {
  driverId: string;
  latitude: number;
  longitude: number;
  isExternalId?: boolean;
}

export interface LocationInterface {
  lat: number;
  lng: number;
}

export interface RedisUserInterface {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  DobHijri: string;
  emailId: string;
  mobileNo: string;
  _timestamp: number;
}

export interface FindingDataInterface {
  isFullDetail?: boolean;
  isUserDetail?: boolean;
  isReviewDetail?: boolean;
  isRatingDetail?: boolean;
  isSubscription?: boolean;
  transCheck?: boolean;
}

export interface DriverListFilters {
  externalId?: number;
  driverName?: string;
  driverNationalId?: string;
  carPlateNo?: string;
  carSequenceNo?: string;
  carLicenceType?: number;
  approved?: boolean;
  driverModeSwitch?: boolean;
  drivingMode?: number;
  cabName: string;
  createdAt?: string[];
}

export interface ListSearchSortDto {
  filters?: DriverListFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

export interface SubscriptionParams {
  userId: number;
  status: number;
}

export interface VerifySubscriptionParams {
  autoRenewal?: boolean;
}

export enum paymentMethod {
  CLICKPAY_HOSTED = 1,
}

export enum applicableFor {
  rider = 1,
  driver = 2,
}
export class purchaseSubscriptionDto {
  promoCode?: string;
  method?: paymentMethod;
  userId: string;
}

interface PushNotificationKeyValuesDto {
  rejectionReasons?: string;
  days?: number;
}

interface PushNotificationExtraParamsDto {
  type?: string;
  userID?: number;
  conversationId?: string;
  tripID?: string;
}

interface PushNotificationExtraOptionsDto {
  badge?: number;
}

export interface PushNotificationReqDto {
  externalId?: string;
  language?: string;
  deviceToken: string;
  clientOs?: string;
  templateCode: string;
  title?: string;
  message?: string;
  keyValues?: PushNotificationKeyValuesDto;
  extraParams?: PushNotificationExtraParamsDto;
  extraOptions?: PushNotificationExtraOptionsDto;
  multiple?: boolean;
  deviceTokenList?: string[];
  isLoggable?: boolean;
}
export enum TRANSACTION_SOURCE {
  INTERNAL_WALLET = 1,
  CLICK_PAY = 2,
}

export interface addUserSubscriptionDto {
  source: TRANSACTION_SOURCE;
  sourceRef: string;
  transactionId?: string;
  promoCode?: string;
  promoCodeAmount?: number;
  userId: string;
  senderAmount: number;
  transactionAmount: number;
  senderTax?: number;
  senderFee?: number;
}

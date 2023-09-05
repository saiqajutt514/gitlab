import { AbstractEntityInterface } from 'transportation-common';
import {
  ReviewExternalType,
  UserExternalType,
} from '../trips/enums/driver.enum';

export interface CustomerInterface extends AbstractEntityInterface {
  userId: number;

  userStatus: string;

  authStatus: string;

  agentId: string;

  firstName: string;

  lastName: string;

  emailId: string;

  mobileNo: string;

  dateOfBirth: string;

  gender: string;

  address1: string;

  address2: string;

  regionId: string;

  pinCode: string;

  activationDate: string;

  remarks: string;

  rejectionReason: string;

  subStatus: string;

  creationDate: string;

  modificationDate: string;

  deviceId: string;

  deviceToken: string;

  prefferedLanguage: string;

  socialId: string;

  socialProfile: string;

  appVersion: string;

  deviceName: string;

  smsEnable: string;

  emailEnable: string;

  notificationEnable: string;

  nationality: string;

  otherDetails: string;

  latitude: number;

  longitude: number;

  additionalInfo: string;

  totalRides: number;

  userType: UserExternalType;

  driverId: string;
}

export interface ConditionsInterface {
  isReviewDetail?: boolean;
  isRatingDetail?: boolean;
  externalType?: ReviewExternalType;
}

export interface FindOneInterface {
  id?: string;
  userId?: number;
  driverId?: string;
  mobileNo?: string;
}

export interface UserListFilters {
  userId?: number;
  fullName?: string;
  mobileNo?: string;
  creationDate?: string[];
  totalRides?: number;
  userType?: number;
  isRider?: number;
}

export interface UserTripFilters {
  tripNo?: string;
  createdAt?: string[];
  updatedAt?: string[];
  riderScheduledAt: string[];
  estimatedBaseAmount: number;
  tripBaseAmount?: number;
  riderAmount?: number;
  driverAmount?: number;
  promoCodeAmount?: number;
  subTotal?: number;
  pickup?: string;
  dropoff?: string;
  status?: number;
  driverId?: string;
  driverName?: string;
  riderId?: string;
  riderName?: string;
  taxAmount?: number;
}

export interface ListSearchSortDto {
  filters?: UserListFilters & UserTripFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

export interface UpdateLocationInfo {
  riderId: string;
  latitude: number;
  longitude: number;
  isExternalId?: boolean;
}

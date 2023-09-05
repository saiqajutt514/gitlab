import { TripStatus, TransactionStatus, TripType } from '../trips.enum';

export interface LocationInterface {
  latitude: number;
  longitude: number;
}

export interface TripChangeDestinationInterface {
  riderId?: string;
  driverId?: string;
  tripId: string;
  address: string;
  cityNameInArabic?: string;
  latitude: number;
  longitude: number;
}

export interface DistanceResponseInterface {
  status: string;
  origin_addresses: string[];
  destination_addresses: string[];
  rows: {
    elements: {
      status: string;
      duration: {
        value: number;
        text: string;
      };
      distance: {
        value: number;
        text: string;
      };
    }[];
  }[];
}

export interface GoogleCalculatedResponse {
  distance: number;
  time: number;
  formattedDistance: string;
  formattedTime: string;
}

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

export interface TripDetailAddress {
  address: string;
  latitude: number;
  longitude: number;
}

export interface TripDetailUserInfo {
  id: number;
  name: string;
  arabicName?: string;
  image?: string;
  mobile?: string;
  rating?: number;
  profileImage: string;
  latitude?: number;
  longitude?: number;
}

export interface TripDetailRiderInfo extends TripDetailUserInfo {
  totalRides: number;
}

export interface TripDetailDriverInfo extends TripDetailUserInfo {
  carPlateNo: string;
  carSequenceNo: string;
  totalTrips: number;
}

export interface TripDetailCabInfo {
  id: string;
  name: string;
  description: string;
  nameArabic: string;
  descriptionArabic: string;
  noOfSeats: number;
  baseFare: number;
  baseDistance: number;
  baseTime: number;
  costPerMin: number;
  costPerKm: number;
  cancellationCharge: number;
  estimatedTimeArrival: number;
  waitChargePerMin: number;
  categoryIcon: string;
}

export interface TripDetailFormat {
  id: string;
  tripOtp: number;
  tripVerified: boolean;
  driverId: string;
  driverInfo: TripDetailDriverInfo;
  riderId: string;
  riderInfo: TripDetailRiderInfo;
  tripType: TripType;
  cabType: string;
  cabInfo: TripDetailCabInfo;
  // source: string
  // destination: string
  // destinationNew: string
  source: TripDetailAddress;
  destination: TripDetailAddress;
  destinationNew: TripDetailAddress;
  tripDistance: number;
  tripDistanceCovered: number;
  currentDistance?: number;
  estimatedTripTime: number;
  tripTime: number;
  currentTime?: number;
  estimatedBaseAmount: number;
  tripBaseAmount: number;
  taxPercentage: number;
  taxAmount: number;
  waitingCharge: number;
  riderAmount: number;
  driverAmount: number;
  promoCode: string;
  promoCodeAmount: number;
  status: TripStatus;
  transactionStatus: TransactionStatus;
  riderScheduledAt: Date;
  driverAssignedAt: Date;
  driverReachedAt: Date;
  tripStartedAt: Date;
  tripFinishedAt: Date;
  tripExpireTime?: Date;
}

export interface AmountCalcParams {
  tripBaseAmount?: number;
  taxAmount?: number;
  promoCodeAmount?: number;
  motAmount?: number;
  processingFee?: number;
  waslFee?: number;
  transactionFee?: number;
}

export interface CabFareParams {
  cabId?: string;
  baseFare?: number;
  costPerKm?: number;
  costPerMin?: number;
  fareMultiplier?: number;
}

export interface tripFees {
  waslFee?: string;
  processingFee?: number;
}

export interface CabCalcParams {
  country?: string;
  city?: string;
}

export interface TripAmountCalcParams {
  distance: number;
  time: number;
}

export interface TripListFilters {
  tripNo?: string;
  tripType?: number;
  createdAt?: string[];
  tripBaseAmount?: number;
  riderAmount?: number;
  driverAmount?: number;
  promoCodeAmount?: number;
  promoCode?: string;
  pickup?: string;
  dropoff?: string;
  status?: number;
  driverId?: string;
  driverName?: string;
  riderId?: string;
  riderName?: string;
  createdBy?: string;
  driverMobileNo?: number;
  riderMobileNo?: number;
}

export interface ListSearchSortDto {
  filters?: TripListFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

export interface StatsParams {
  type: string; // day,week,month,year,custom
  entity?: string;
  fromDate?: string;
  toDate?: string;
  cancelAction?: string; //before,after,both
}

export interface DriverIdInterface {
  driverId?: string;
}
export interface TripEstimatedCostForAdmin extends CabCalcParams {
  // TODO: Specify addresses array
  addresses: any;
  cabId: string;
  riderId: string;
  driverId: string;
  promoCode?: string;
}
export interface TripEstimatedCostForSocket {
  tripId: string;
  updatedAt?: string;
}

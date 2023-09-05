import { AbstractEntityInterface } from "transportation-common";

export interface ICabType extends AbstractEntityInterface {
  name: string;

  nameArabic?: string;

  description: string;

  descriptionArabic?: string;

  noOfSeats: number;

  // Passenger
  passengerEstimatedTimeArrival?: number;

  passengerDriverMatching?: number;

  passengerBaseFare?: number;

  passengerBaseDistance?: number;

  passengerBaseTime?: number;

  passengerCostPerMin?: number;

  passengerCostPerKm?: number;

  passengerCancellationCharge?: number;

  passengerDriverDistribution?: number;

  // Share

  shareEstimatedTimeArrival?: number;

  shareDriverMatching?: number;

  shareBaseFare?: number;

  shareBaseDistance?: number;

  shareBaseTime?: number;

  shareCostPerMin?: number;

  shareCancellationCharge?: number;

  shareDriverDistribution?: number;

  shareMaxThreshold?: number;

  // Pool

  carpoolEstimatedTimeArrival?: number;

  carpoolDriverMatching?: number;

  carpoolCostPerKmMin?: number;

  carpoolCostPerKmMax?: number;

  carpoolUserCancellationCharge?: number;

  carpoolDriverCancellationCharge?: number;

  carpoolDriverDistribution?: number;

  categoryIcon: string;

  isDeleted?: Date;

  modifiedBy?: string;

  createdBy?: string;

  status?: boolean;
}

export interface GetCabTypeLocationInterface {
  originAddressLat: string;
  originAddressLng: string;
  destinationAddressLat: string;
  destinationAddressLng: string;
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

import { AbstractEntityInterface } from 'transportation-common';

export interface CarInfo extends AbstractEntityInterface {
  carSequenceNo: string;

  chassisNumber?: string;

  cylinders?: number;

  licenseExpiryDate?: string;

  licenseExpiryDateEnglish?: Date;

  lkVehicleClass?: number;

  bodyType?: string;

  bodyTypeEnglish?: string;

  majorColor?: string;

  majorColorEnglish?: string;

  modelYear?: number;

  ownerName?: string;

  ownerNameEnglish?: string;

  plateNumber?: number;

  plateText1?: string;

  plateText1English?: string;

  plateText2?: string;

  plateText2English?: string;

  plateText3?: string;

  plateText3English?: string;

  plateTypeCode?: number;

  regplace?: string;

  regplaceEnglish?: string;

  vehicleCapacity: number;

  vehicleMaker: string;

  vehicleMakerEnglish: string;

  vehicleModel: string;

  vehicleModelEnglish: string;

  createdBy?: string;

  modifiedBy?: string;
}

export interface CarInfoListFilters {
  driverName?: string;
  externalId?: number;
  carSequenceNo?: string;
  chassisNumber?: string;
  cylinders?: number;
  lkVehicleClass?: number;
  licenseExpiryDate?: string;
  licenseExpiryDateEnglish?: string;
  bodyType?: string;
  bodyTypeEnglish?: string;
  majorColor?: string;
  majorColorEnglish?: string;
  modelYear?: number;
  ownerName?: string;
  ownerNameEnglish?: string;
  plateNumber?: number;
  plateText1?: string;
  plateText1English?: string;
  plateText2?: string;
  plateText2English?: string;
  plateText3?: string;
  plateText3English?: string;
  plateTypeCode?: number;
  regplace?: string;
  regplaceEnglish?: string;
  vehicleCapacity?: number;
  vehicleMaker?: string;
  vehicleMakerEnglish?: string;
  vehicleModel?: string;
  vehicleModelEnglish?: string;
  createdAt?: string[];
}

export interface ListSearchSortDto {
  filters?: CarInfoListFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

export interface SyncCarParams {
  carSequenceNo: string;
  driverId: string;
  cabId: string;
  userId: string;
}

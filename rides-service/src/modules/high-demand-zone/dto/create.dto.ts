export class createDto {
  latitude: number;
  longitude: number;
  address?: string;
  addressInArabic?: string;
}

export interface highDemandZoneListFilters {
  longitude?: number;
  latitude?: number;
  addressInArabic?: string;
  address?: string;
  updatedAt?: string;
  createdAt?: string[];
}

export interface ListSearchSortDto {
  filters?: highDemandZoneListFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

export enum highDemandZoneListSort {
  inquiryId = 'users.longitude',
  fullName = 'users.latitude',
  mobileNo = 'users.addressInArabic',
  email = 'users.address',
  city = 'users.updatedAt',
  createdAt = 'users.createdAt',
}

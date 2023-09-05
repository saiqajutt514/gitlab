import { IsNotEmpty, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsNotEmpty()
  take: string;

  @IsNotEmpty()
  skip: string;
}

export interface ListSearchSortDto {
  filters?: any;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

export interface DashboardAPIParams {
  type: string; // day, week, month, year (default 'week') 'custom'
  entity?: string; // (driver, subscription - Earnings), (stats, summary - Trips)
  fromDate?: Date;
  toDate?: Date;
  region?: string; // multiple support in future
}

export interface createHighDemandZone {
  latitude: number;
  longitude: number;
  address?: string;
  addressInArabic?: string;
}

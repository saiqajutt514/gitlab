import { AbstractEntityInterface } from "transportation-common";

export interface Vehicle extends AbstractEntityInterface {
  cylinders?: number;

  lkVehicleClass?: number;

  bodyType?: string;

  bodyTypeEnglish?: string;

  majorColor?: string;

  majorColorEnglish?: string;

  modelYear?: number;

  vehicleCapacity: number;

  vehicleMaker: string;

  vehicleMakerEnglish: string;

  vehicleModel: string;

  vehicleModelEnglish: string;

  vehicleImage?: string;

  createdBy?: string;

  modifiedBy?: string;
}

export interface VehicleListFilters {
  cabName?: string;
  cylinders?: number;
  lkVehicleClass?: number;
  bodyType?: string;
  bodyTypeEnglish?: string;
  majorColor?: string;
  majorColorEnglish?: string;
  modelYear?: number;
  vehicleCapacity?: number;
  vehicleMaker?: string;
  vehicleMakerEnglish?: string;
  vehicleModel?: string;
  vehicleModelEnglish?: string;
  createdAt?: string[];
}

export interface ListSearchSortDto {
  filters?: VehicleListFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

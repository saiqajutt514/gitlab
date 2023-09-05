export interface InventoryListFilters {
  modelYear?: number;
  bodyColor?: string;
  sequenceNo?: string;
  displacement?: number;
  fuelType?: string;
  noOfCylinder?: number;
  seatingCapacity?: number;
  transmission?: number;
  category?: string;
  createdAt?: string[];
  updatedAt?: string[];
  modelEnglish?: string;
  makerEnglish?: string;
  total?: number;
  registered?: number;
  avaliable?: number;
  iStatus?: number;
}

export interface ListSearchSortDto {
  filters?: InventoryListFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

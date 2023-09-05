export interface TransactionFilters {
  userId?: string;
  senderId?: string;
  entityType?: string;
  transactionId?: string;
  createdAt?: string[];
  startDate?: string[];
  endDate?: string[];
  packageName?: string;
  subscriptionAmount?: number;
  transactionAmount?: number;
  remainingDays?: number;
  status?: number;
}

export interface ListSearchSortDto {
  filters?: TransactionFilters;
  sort?: {
    field: string;
    order: string;
  };
  take: number;
  skip: number;
  keyword?: string;
}

export interface EarningListParams {
  type: string; // day, week, month, year (default 'week')
  entity: string; // driiver, subscription
  fromDate?: Date;
  toDate?: Date;
}

export interface StatsParams {
  type: string; // day,week,month,year,custom
  entity?: string;
  fromDate?: string;
  toDate?: string;
  cancelAction?: string; //before,after,both
}

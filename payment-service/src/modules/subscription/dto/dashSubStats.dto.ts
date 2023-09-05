export interface StatsParams {
  type: string; // day,week,month,year,custom
  entity?: string;
  fromDate?: string;
  toDate?: string;
  cancelAction?: string; //before,after,both
}

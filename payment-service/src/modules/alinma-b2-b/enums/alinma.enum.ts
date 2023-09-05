export enum TRANSACTION_ENTITY_TYPE {
  TOP_UP = 1,
  SUBSCRIPTION = 2,
  TRIP_AMOUNT = 3,
  TAX = 4,
  FEE = 5,
  DRIVER_WITHDRAWAL = 6,
}

export enum TRANSACTION_STATUS {
  PENDING = 1,
  COMPLETED = 2,
  FAILED = 3,
}

export enum RESPONSE_STATUS_CODE {
  SUCCESS = 'I000000',
}
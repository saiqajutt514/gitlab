export const DRIVER_SEARCH_LIMIT_FOR_ADMIN = 50;

export enum CAR_LICENCE_TYPE {
  PRIVATE = 1,
  PUBLIC_TRANSPORT = 2,
  TAXI = 3,
}

export enum DRIVING_MODE {
  PASSENGER_RIDE = 1,
  DELIVERY = 2,
}

export enum USER_TYPE {
  CUSTOMER = 1,
  CAPTAIN = 2,
}

export enum SUBSCRIPTION_TYPE {
  MONTHLY = 1,
  YEARLY = 2,
}

export enum SUBSCRIPTION_STATUS {
  ACTIVE = 1,
  OVERDUE = 2,
  EXPIRED = 3,
}

export enum WASL_ELIGIBILITY_STATUS {
  PENDING = 0,
  VALID = 1,
  INVALID = 2,
}

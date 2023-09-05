export enum TripType {
  IMMEDIATELY = 1,
  SCHEDULED = 2,
}

export enum TripSource {
  RIDE_APP = 1,
  ADMIN = 2,
}

export enum TripStatus {
  PENDING = 1,
  ACCEPTED_BY_DRIVER = 2,
  REJECTED_BY_DRIVER = 3,
  CANCELLED_BY_DRIVER = 4,
  DRIVER_ARRIVED = 5,
  CANCELLED_BY_RIDER = 6,
  STARTED = 7,
  COMPLETED = 8,
  NO_DRIVER = 9,
  EXPIRED = 10,
  CANCELLED_BY_ADMIN = 11,
  BOOKING_CANCELLED = 12,
  STOP_AND_ASSIGNED = 13,
  STOP_AND_COMPLETED = 14,
}

export enum TripPreviousStatus {
  IN_PROGRESS = 1,
  DRIVER_CANCELLED_BEFORE_ARRIVED = 2,
  DRIVER_CANCELLED_AFTER_ARRIVED = 3,
}

export enum TransactionStatus {
  BLOCKED = 1,
  DEDUCTED = 2,
  RELEASED = 3,
  FAILED = 4,
}

export enum TripCreatedBy {
  CUSTOMER = 1,
  ADMIN = 2,
  SUB_ADMIN = 3,
  EMERGENCY_ADMIN = 4,
  DISPATCHER_ADMIN = 5,
}

export enum SUBSCRIPTION_STATUS {
  ACTIVE = 1,
  OVERDUE = 2,
  EXPIRED = 3,
  CANCEL = 4,
}

export enum PromoCodeAction {
  VALIDATE = 'validate',
  APPLY = 'apply',
  REVERT = 'revert',
}

export enum PromoCodeTopic {
  apply = 'apply_promo_code',
  revert = 'revert_code',
  validate = 'validate_promo_code',
}

export enum PromoCodeResponse {
  apply = 'applied',
  revert = 'removed',
  validate = 'validated',
}

export enum TripsListingSort {
  tripNo = 'trips.tripNo',
  tripType = 'trips.tripType',
  createdAt = 'trips.createdAt',
  tripBaseAmount = 'trips.tripBaseAmount',
  riderAmount = 'trips.riderAmount',
  promoCodeAmount = 'trips.promoCodeAmount',
  waitingCharge = 'trips.waitingCharge',
  taxAmount = 'trips.taxAmount',
  promoCode = 'trips.promoCode',
  status = 'trips.status',
  pickup = 'pickup.address',
  dropoff = 'dropoff.address',
  riderId = 'rider.userId',
  driverId = 'driver.userId',
  riderName = 'rider.firstName',
  driverName = 'driver.firstName',
}

export enum TripsAction {
  'trip_completed' = 'trip_completed',
}

export enum TripUserType {
  RIDER = 1,
  DRIVER = 2,
}

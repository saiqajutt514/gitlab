export enum RiderListSort {
  userId = 'customer.userId',
  fullName = 'customer.firstName',
  mobileNo = 'customer.mobileNo',
  creationDate = 'customer.creationDate',
  totalRides = 'customer.totalRides',
  userType = 'customer.userType',
  userStatus = 'customer.userStatus',
  createdAt = 'customer.createdAt',
}

export enum RiderTripHistorySort {
  tripNo = 'trips.tripNo',
  createdAt = 'trips.createdAt',
  tripBaseAmount = 'trips.tripBaseAmount',
  waitingCharge = 'trips.waitingCharge',
  taxAmount = 'trips.taxAmount',
  promoCodeAmount = 'trips.promoCodeAmount',
  riderAmount = 'trips.riderAmount',
  status = 'trips.status',
  pickup = 'pickup.address',
  dropoff = 'dropoff.address',
  driverId = 'driver.userId',
  driverName = 'driver.firstName',
  riderId = 'rider.userId',
  riderName = 'rider.firstName',
  subTotal = 'subTotalAmt',
}

export enum RiderTripScheduledSort {
  tripNo = 'trips.tripNo',
  riderScheduledAt = 'trips.riderScheduledAt',
  updatedAt = 'trips.updatedAt',
  estimatedBaseAmount = 'trips.estimatedBaseAmount',
  pickup = 'pickup.address',
  dropoff = 'dropoff.address',
}

/**
 * mobileNo = 'customer.mobileNo',
 * firstName = 'customer.firstName',
 * lastName = 'customer.lastName',
 * userType = 'customer.userType',
 * userId = 'customer.userId',
 */
export enum OtpLogsListSortEnum {
  mobileNo = 'customer.mobileNo',
  firstName = 'customer.firstName',
  lastName = 'customer.lastName',
  userType = 'customer.userType',
  userId = 'customer.userId',
}

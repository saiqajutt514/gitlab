export enum RatingReportSort {
  tripNo = "trips.tripNo",
  createdAt = "trips.createdAt",
  status = "trips.status",
  pickup = "pickup.address",
  dropoff = "dropoff.address",
  riderId = "rider.userId",
  driverId = "driver.userId",
  riderName = "rider.firstName",
  driverName = "driver.firstName",
};

export enum RidersReportSort {
  userId = "customer.userId",
  fullName = "customer.firstName",
  emailId = "customer.emailId",
  mobileNo = "customer.mobileNo",
  creationDate = "customer.creationDate",
  totalRides = "customer.totalRides",
  userType = "customer.userType",
  userStatus = "customer.userStatus",
};

export enum DriverEarningsSort {
  userId = "customer.userId",
  driverName = "customer.firstName",
  totalTrips = "customer.totalTrips",
  totalEarned = "customer.totalEarned",
};

export enum TripsReportSort {
  tripNo = "trips.tripNo",
  tripType = "trips.tripType",
  createdAt = "trips.createdAt",
  riderAmount = "trips.riderAmount",
  status = "trips.status",
  pickup = "pickup.address",
  dropoff = "dropoff.address",
  riderId = "rider.userId",
  driverId = "driver.userId",
  riderName = "rider.firstName",
  driverName = "driver.firstName",
};

export enum RidersCancelledSort {
  userId = "customer.userId",
  riderName = "customer.firstName",
  completedRides = "customer.totalRides",
  ridesCancelled = "customer.ridesCancelled",
}

export enum DriverCancelledSort {
  userId = "customer.userId",
  driverName = "customer.firstName",
  completedTrips = "customer.totalTrips",
  tripsCancelled = "customer.tripsCancelled",
}

export enum DriverDeclinedSort {
  userId = "customer.userId",
  driverName = "customer.firstName",
  completedTrips = "customer.totalTrips",
  tripsDeclined = "customer.tripsDeclined",
  userStatus = "customer.userStatus",
}

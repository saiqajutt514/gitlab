export interface RatingFilters {
  tripNo?: string
  createdAt?: string[]
  pickup?: string
  dropoff?: string
  status?: string
  riderId?: string
  riderName?: string
  driverId?: string
  driverName?: string
}

export interface RidersFilters {
  userId?: number
  fullName?: string
  emailId?: string
  mobileNo?: string
  creationDate?: string[]
  totalRides?: number
  upcomingRides?: number
  userType?: number
}

export interface EarningsFilters {
  totalEarned?: number
  totalTrips?: number
}

export interface TripsFilters {
  riderAmount?: number
  tripType?: number
}

export interface CancelDeclineFilters {
  completedRides?: number
  completedTrips?: number
  ridesCancelled?: number
  tripsCancelled?: number
  tripsDeclined?: number
}

export interface ListSearchSortDto {
  filters?: RatingFilters & RidersFilters & EarningsFilters & TripsFilters & CancelDeclineFilters
  sort?: {
    field: string
    order: string
  }
  take: number
  skip: number
  keyword?: string
}

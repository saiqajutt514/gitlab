export enum TripDriverStatus {
    PENDING = 1,
    ACCEPTED = 2,
    DECLINED = 3,
    EXPIRED = 4,
    CANCELLED = 5,
}

export enum TripDriverRequestedStatus {
    TRIP_INITIATE = 1,
    TRIP_CANCELLED_BY_DRIVER = 2,
    TRIP_REJECTED_BY_DRIVER = 3,
}
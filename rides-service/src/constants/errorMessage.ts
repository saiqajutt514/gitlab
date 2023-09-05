export const errorMessage = {
  SOMETHING_WENT_WRONG: 'Something went wrong, please try again later',
  FETCH_DRIVERS_ERROR: 'Some error occurred while fetching nearest drivers',
  UNAUTHORIZED_ACTION: 'Unauthorized action',
  successMessage: {
    PICTURE_UPDATE_SUCCESS: 'Profile picture updated',
  },
  HIGH_DEMAND_ZONE: { ALREADY_EXIST: 'Zone already exist with same points' },
  TRIP: {
    WAIT_SOMETIME: 'Please wait at least 15 min for rider to arrive',
    TRIP_ALREADY_RUNNING:
      'You have either already running a trip or a scheduled a trip',
    IMMEDIATE_TRIP_RUNNING_ALREADY: 'You have already running a trip',
    SCHEDULED_TRIP_PRESENT_ALREADY: 'You have scheduled trip present already',
    SCHEDULED_TRIP_RUNNING_ALREADY:
      'You have scheduled trip which is running already',
    TRIP_SCHEDULE_TIME_ERROR:
      'Schedule time must be after 30 minutes from current time',
    SCHEDULE_TRIP_TIME_RANGE_ERROR:
      'Scheduled trip can be created between 09:00 to 20:00',
    DRIVER_DID_NOT_ARRIVED: 'Driver should arrived at pickup point',
    DRIVER_ALREADY_ARRIVED: 'Driver already arrived at pickup point',
    INVALID_TRIP_OTP: 'Enter valid otp',
    TRIP_NOT_FOUND: 'Trip not found',
    TRIP_RIDER_DROP_LOCATION_NOT_FOUND: "Please add rider's drop location",
    TRIP_RIDER_DROP_LOCATION_NOT_FOUND_LAT:
      "Please add rider's drop location latitude",
    TRIP_RIDER_DROP_LOCATION_NOT_FOUND_LONG:
      "Please add rider's drop location longitude",
    TRIP_HAS_BEEN_EXPIRED: 'Trip has already been expired',
    TRIP_HAS_BEEN_CANCELLED: 'Trip has already been cancelled',
    TRIP_NOT_STARTED: 'Trip has not started yet',
    TRIP_HAS_BEEN_STARTED: 'Trip has already been started',
    TRIP_HAS_BEEN_COMPLETED: 'Trip has already been completed',
    BOOKING_ALREADY_CANCELLED: 'Booking request Already cancelled',
    BOOKING_CANT_BE_CANCELLED: 'Booking request cannot be cancelled now',
    DROP_REVIEW_AFTER_COMPLETING_TRIP:
      'You can drop review after completing the trip',
    REVIEW_ACTION_NOT_ALLOWED: 'You are not authorised to give rating',
    REVIEW_DROPPED_ALREADY: 'You have already dropped review for this trip',
    TRIP_DESTINATION_CAN_NOT_CHANGED:
      'Trip destination can not be changed more than once',
    TRIP_ACCEPTED_BY_ANOTHER_DRIVER_ALREADY:
      'Trip has already been accepted by another driver',
    TRIP_HAS_NOT_ASSIGNED_ANY_DRIVER: 'Trip has not assigned any driver yet',
    DRIVER_HAS_BEEN_ASSIGNED_TO_THIS_TRIP:
      'Driver has been assigned to this trip',
    // TRIP_CAN_NOT_CANCELLED_AFTER_RIDER_PICKED_UP: "Trip can not be cancelled after picking up a rider",
    TRIP_CAN_NOT_BE_REJECT_AFTER_ACCEPTING_REQUEST:
      'Trip can not be reject after accepting a request',
    TRIP_SHOULD_ACCEPTED_TO_PICKUP_CUSTOMER:
      'Trip should be accepted in order to pick up customer',
    RIDER_IS_NOT_A_PART_OF_TRIP: 'Rider is not part of a trip',
    DRIVER_IS_NOT_A_PART_OF_TRIP: 'Driver is not part of a trip',
    RIDER_HAS_INSUFFICIENT_BALANCE: 'Rider has insufficient balance',
    TRANSACTION_ROLLBACK: 'Some error occurred in transaction rollback/release',
    TRANSACTION_UPDATE: 'Some error occurred in transaction update',
    TRANSACTION_CONFIRM: 'Some error occurred in transaction confirmation',
  },
  CAPTAIN: {
    CAPTAIN_NOT_FOUND: 'Captain not found',
    CAN_NOT_BE_CREATED: 'Not able to create captain',
    DRIVER_MODE_CAN_NOT_BE_CHANGED: 'Not able to change driver mode',
  },
  CUSTOMER: {
    //Muzz start
    CUSTOMER_ALREADY_EXIST: 'Customer already exist',
    //end
    CUSTOMER_NOT_FOUND: 'Customer not found',
    USER_TYPE_NOT_PROVIDED: 'Customer user type is not provided',
  },
  EMERGENCY: {
    NOT_FOUND: 'Emergency request not found',
  },
  DISTANCE_MATRIX: {
    NOT_FOUND:
      'the origin and/or destination of this pairing could not be geocoded',
    ZERO_RESULTS: 'no route could be found between the origin and destination',
    MAX_ROUTE_LENGTH_EXCEEDED:
      'the requested route is too long and cannot be processed',
  },
  OTP: {
    OTP_NOT_FOUND: 'Invalid OTP',
  },
};

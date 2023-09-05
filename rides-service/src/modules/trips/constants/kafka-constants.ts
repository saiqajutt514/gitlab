// trip
export const TRIP_INITIALIZE = 'tripInit';
export const GET_ALL_TRIPS = 'get-all-trips';
export const CREATE_TRIP = 'create-trip';
export const CREATE_SCHEDULE_TRIP = 'create-schedule-trip';
export const ACCEPT_TRIP_WITH_ALL_CABS = 'accept-trip-with-all-cabs';
export const DECLINE_TRIP_WITH_ALL_CABS = 'decline-trip-with-all-cabs';
export const CONFIRM_SCHEDULE_TRIP = 'confirm-schedule-trip';
export const DECLINE_SCHEDULE_TRIP = 'decline-schedule-trip';
export const RIDER_CANCELS_TRIP = 'rider-cancels-trip';
export const DRIVER_CANCELS_TRIP = 'driver-cancels-trip';
export const DRIVER_REJECTS_TRIP = 'driver-rejects-trip';
export const DRIVER_ACCEPTS_TRIP = 'driver-accepts-trip';
export const DRIVER_REACHED = 'driver-reached';
export const TRIP_STARTED = 'trip-started';
export const TRIP_COMPLETED = 'trip-completed';
export const TRIP_ESTIMATE_COST = 'trip-estimate-cost';
export const CHANGE_TRIP_DESTINATION = 'change-trip-destination';
export const GET_RIDER_FUTURE_TRIPS = 'get-rider-future-trips';
export const RIDER_RECENT_ADDRESS = 'rider-recent-address';
export const GET_ALL_RIDER_TRIPS = 'get-all-rider-trips';
export const GET_ALL_DRIVER_TRIPS = 'get-all-driver-trips';
export const DRIVER_CANCELLED_TRIPS = 'driver-cancelled-trips';
export const RIDER_CANCELLED_TRIPS = 'rider-cancelled-trips';
export const DRIVER_COMPLETED_TRIPS = 'driver-completed-trips';
export const RIDER_COMPLETED_TRIPS = 'rider-completed-trips';
export const CHECK_TRIP_DETAIL = 'check-trip-detail';
export const TRIP_DETAIL_BY_ID = 'trip-detail-by-id';
export const TRIP_INVOICE_BY_ID = 'trip-invoice-by-id';
export const TRIP_DETAIL = 'trip-detail';
export const UPLOAD_TRIP_PHOTO = 'upload-trip-photo';
export const ADMIN_CANCELS_TRIP = 'admin-cancels-trip';
export const RIDER_CANCELS_BOOKING = 'rider-cancels-booking';

// promo-code
export const CREATE_PROMO_CODE = 'create_promo_code';
export const VALIDATE_PROMO_CODE = 'validate_promo_code';
export const APPLY_PROMO_CODE = 'apply_promo_code';
export const REVERT_CODE = 'revert_code';

// review
export const CAN_REVIEW = 'can-review';
export const CREATE_TRIP_REVIEW = 'create-trip-review';

export const GET_REVIEWS = 'get-reviews';
export const CREATE_REVIEW = 'create-review';
export const GET_META_REVIEWS = 'get-meta-reviews';
export const GET_META_REVIEW_BY_EXTERNAL = 'get-meta-review-by-external';
export const GET_RATING_COUNTS_BY_EXTERNAL = 'get-rating-counts-by-external';

// captain
export const FIND_NEAREST_DRIVERS = 'find-nearest-drivers';
export const CAPTAIN_DETAIL = 'captain-detail';
export const GET_CAB_TYPE_DETAIL = 'get-cab-type-detail';
export const FIND_DRIVERS = 'find-drivers';
export const UPDATE_CAPTAIN = 'update-captain';
export const GET_SELECTED_CAPTAINS = 'get-selected-captains';
export const CHANGE_DRIVER_AVAILABILITY = 'change-driver-availability';
export const GET_DRIVER_MODE = 'get-driver-mode';

// wasl
export const WASL_TRIP_CHECK = 'wasl-trip-check';

// socket
export const NOTIFY_TRIP_DETAIL = 'notify-trip-detail';
export const EMIT_TO_ADMIN_DASHBOARD = 'emit-to-admin-dashboard';

// notifications
export const SEND_EMAIL_NOTIFICATION = 'send-email-notification';
export const SEND_PUSH_NOTIFICATION = 'send-push-notification';
export const SEND_SMS_NOTIFICATION = 'send-sms-notification';

// Hold amounts from trip flow
export const BLOCK_TRIP_AMOUNT = 'block-amount';
export const UPDATE_TRIP_AMOUNT = 'update-amount';
export const RELEASE_TRIP_AMOUNT = 'release-amount';
export const CONFIRM_TRIP_AMOUNT = 'confirm-amount';

// User Subscriptions
export const GET_USER_SUBSCRIPTION_DETAIL = 'get-user-subscription-detail';
export const GET_USER_SUBSCRIPTION_COUNT = 'get-user-subscription-count';
export const UPDATE_USER_SUBSCRIPTION = 'update-user-subscription';

// SUBSCRIPTION_TRANSACTION
export const ADD_SUBSCRIPTION_TRANSACTION = 'add-subscription-transaction';

// Admin Dashboard
export const DASHBOARD_STATS = 'dashboard-stats';
export const DASHBOARD_TRIP_STATS = 'dashboard-trip-stats';
export const DASHBOARD_ACTIVE_DRIVERS = 'dashboard-active-drivers';
export const DASHBOARD_ACTIVE_RIDERS = 'dashboard-active-riders';
export const DASHBOARD_STATUS_WISE_COUNT = 'dashboard-statuswise-count';
export const DASHBOARD_CANCEL_SUMMARY = 'dashboard-cancel-summary';

// Emergency
export const GET_ALL_EMERGENCY_TRIPS = 'get-all-emergency-trips';

// Dispatcher
export const GET_ALL_DISPATCHER_TRIPS = 'get-all-dispatcher-trips';
export const GET_ALL_INCOMPLETE_TRIPS = 'get-all-incomplete-trips';
export const GET_TRIP_ESTIMATED_COST = 'get-trip-estimated-cost';
export const GET_TRIP_ESTIMATED_COST_SOCKET = 'get-trip-estimated-cost-socket';

export const GET_CHAT_USER_LAST_SEEN_AND_LOC =
  'get-chat-user-last-seen-and-loc';

export const GET_INVOICE_QR = 'get-invoice-qr';

export const tripPatterns = [TRIP_INITIALIZE];


export const GET_BALANCE = 'get-balance';
// Patterns
export const promoCodePatterns = [
  VALIDATE_PROMO_CODE,
  CREATE_PROMO_CODE,
  APPLY_PROMO_CODE,
  REVERT_CODE,
];
export const reviewsPatterns = [
  CREATE_REVIEW,
  GET_REVIEWS,
  GET_META_REVIEWS,
  GET_META_REVIEW_BY_EXTERNAL,
  GET_RATING_COUNTS_BY_EXTERNAL,
];

export const captainPatterns = [
  CAPTAIN_DETAIL,
  WASL_TRIP_CHECK,
  FIND_NEAREST_DRIVERS,
  DASHBOARD_ACTIVE_DRIVERS,
  CHANGE_DRIVER_AVAILABILITY,
  GET_DRIVER_MODE,
];

export const paymentPatterns = [
  BLOCK_TRIP_AMOUNT,
  UPDATE_TRIP_AMOUNT,
  RELEASE_TRIP_AMOUNT,
  CONFIRM_TRIP_AMOUNT,
  GET_USER_SUBSCRIPTION_DETAIL,
  UPDATE_USER_SUBSCRIPTION,
  ADD_SUBSCRIPTION_TRANSACTION,
];

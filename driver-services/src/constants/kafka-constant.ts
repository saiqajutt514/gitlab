export const CREATE_CAPTAIN = 'create-captain';
export const FIND_NEAREST_DRIVERS = 'find-nearest-drivers';
export const CAPTAIN_DETAIL = 'captain-detail';
export const UPDATE_CAPTAIN_LOCATION = 'update-captain-location';
export const CHANGE_DRIVER_MODE = 'change-driver-mode';
export const GET_DRIVER_MODE = 'get-driver-mode';
export const CHANGE_DRIVER_STATUS = 'change-driver-status';

export const CHANGE_ONLINE_STATUS = 'change-online-status'

export const CHANGE_WASL_STATUS = 'change-wasl-status';

export const CHANGE_DRIVER_AVAILABILITY = 'change-driver-availability';
export const GET_ALL_CAPTAINS = 'get-all-captains';
export const UPDATE_CAPTAIN = 'update-captain';
export const GET_SELECTED_CAPTAINS = 'get-selected-captains';
export const GET_CAPTAIN_SUBSCRIPTIONS = 'get-captain-subscriptions';

export const UPDATE_CAB_ID = 'update-cab-id';

export const GET_CAPTAIN_SELECTED_SUBSCRIPTION =
  'get-captain-selected-subscription';

export const GET_CAPTAIN_EARNINGS = 'get-captain-earnings';
export const GET_CAPTAINS_REPORT = 'get-captains-report';
export const UPDATE_CAPTAIN_SUBSCRIPTION = 'update-captain-subscription';

// CAPTAIN SUBSCRIPTION Active/Cancel
export const ACTIVATE_CAPTAIN_SUBSCRIPTION = 'activate-captain-subscription';
export const CANCEL_CAPTAIN_SUBSCRIPTION = 'cancel-captain-subscription';
export const VERIFY_CAPTAIN_SUBSCRIPTION = 'verify-captain-subscription';
export const PURCHASE_SUBSCRIPTION = 'purchase-subscription';
export const SUBSCRIPTION_INVOICE = 'subscription-invoice';
export const ADD_USER_SUBSCRIPTION = 'add-user-subscription';

export const UPDATE_SUBSCRIPTION_PACKAGE = 'update-subscription-package';

// Cab Types
export const CREATE_CAB_TYPE = 'create-cab-type';
export const UPDATE_CAB_TYPE = 'update-cab-type';
export const DELETE_CAB_TYPE = 'delete-cab-type';
export const GET_ALL_CAB_TYPES = 'get-all-cab-types';
export const GET_CAB_TYPE_DETAIL = 'get-cab-type-detail';
export const UPDATE_CAB_TYPE_ORDER = 'update-cab-type-order';

// Cab Charges
export const CREATE_CAB_CHARGE = 'create-cab-charge';
export const UPDATE_CAB_CHARGE = 'update-cab-charge';
export const DELETE_CAB_CHARGE = 'delete-cab-charge';
export const GET_ALL_CAB_CHARGES = 'get-all-cab-charges';
export const GET_CHARGE_CITIES = 'get-charge-cities';
export const GET_COUNTRIES = 'get-countries';
export const GET_CITIES = 'get-cities';
export const ADD_COUNTRY = 'add-country';
export const ADD_CITY = 'add-city';
export const UPDATE_COUNTRY = 'update-country';
export const UPDATE_CITY = 'update-city';
export const DELETE_CITY = 'delete-city';

// Customized Charges
export const ADD_CUSTOMIZED_CHARGE = 'add-customized-charge';
export const UPDATE_CUSTOMIZED_CHARGE = 'update-customized-charge';
export const DELETE_CUSTOMIZED_CHARGE = 'delete-customized-charge';
export const GET_ALL_CUSTOMIZED_CHARGES = 'get-all-customized-charges';
export const GET_CUSTOMIZED_CHARGE = 'get-customized-charge';

// Car Info
export const CREATE_CAR_INFO = 'create-car-info';
export const UPDATE_CAR_INFO = 'update-car-info';
export const DELETE_CAR_INFO = 'delete-car-info';
export const GET_ALL_CARS_INFO = 'get-all-cars-info';
export const GET_CAR_INFO_DETAIL = 'get-car-info-detail';
export const FETCH_CAR_INFO = 'fetch-car-info';

// Vehicles
export const CREATE_VEHICLE = 'create-vehicle';
export const UPDATE_VEHICLE = 'update-vehicle';
export const DELETE_VEHICLE = 'delete-vehicle';
export const GET_ALL_VEHICLES = 'get-all-vehicles';
export const GET_VEHICLE_DETAIL = 'get-vehicle-detail';
export const GET_VEHICLE_MASTER_INFO = 'get-vehicle-master-info';

// WASL
export const WASL_TRIP_CHECK = 'wasl-trip-check';
export const WASL_CAPTAIN_CHECK = 'wasl-captain-check';

// Subscription
export const GET_SUBSCRIPTION_DETAIL = 'get-subscription-detail';

// Subscription Transaction
export const GET_SUBSCRIPTION_TRANSACTIONS = 'get-subscription-transactions';

// User Subscriptions
export const CREATE_USER_SUBSCRIPTION = 'create-user-subscription';
export const GET_ALL_USER_SUBSCRIPTIONS = 'get-all-user-subscriptions';
export const GET_USER_EARNINGS = 'get-user-earnings';
export const GET_USER_SUBSCRIPTION_DETAIL = 'get-user-subscription-detail';
export const ADD_SUBSCRIPTION_TRANSACTION = 'add-subscription-transaction';

// review
export const GET_RATING_COUNTS_BY_EXTERNAL = 'get-rating-counts-by-external';
export const GET_META_REVIEW_BY_EXTERNAL = 'get-meta-review-by-external';
export const GET_META_REVIEWS = 'get-meta-reviews';

// customer
export const UPDATE_CUSTOMER = 'update-customer';
export const GET_CUSTOMER_DETAIL = 'get-customer-detail';
export const GET_SELECTED_CUSTOMERS = 'get-selected-customers';

export const VALIDATE_IBAN = 'validate-iban';
export const GET_IBAN = 'get-iban';
export const CREATE_IBAN = 'createIban';
export const CLICK_PAY_HOSTED = 'click-hosted-top-up';

// Admin Dashboard
export const DASHBOARD_ACTIVE_DRIVERS = 'dashboard-active-drivers';
export const EMIT_TO_ADMIN_DASHBOARD = 'emit-to-admin-dashboard';
export const DASHBOARD_STATS = 'dashboard-stats';

// USER SUBSCRIPTION
export const CANCEL_USER_SUBSCRIPTION = 'cancel-user-subscription';
export const ACTIVATE_USER_SUBSCRIPTION = 'activate-user-subscription';

// Audit Log
export const CREATE_AUDIT_LOG = 'create-audit-log';

// Search Drivers
export const SEARCH_DRIVERS_LIST = 'search-drivers-list';

// Notifications
export const SEND_PUSH_NOTIFICATION = 'send-push-notification';

// SMS NOTIFICATIONS
export const SEND_SMS_NOTIFICATION = 'send-sms-notification';

//dashboard wasl approved count
export const WASL_APPROVED_COUNT = 'wasl-approved-count';


export const ALL_DRIVER_WASL_CHECK = 'all-driver-wasl-check';



export const DRIVER_ONLINE_STATUS = 'driver-online-status';

export const paymentRequestPattern = [
  GET_SUBSCRIPTION_DETAIL,
  CREATE_USER_SUBSCRIPTION,
  GET_ALL_USER_SUBSCRIPTIONS,
  GET_USER_SUBSCRIPTION_DETAIL,
  GET_SUBSCRIPTION_TRANSACTIONS,
  GET_USER_EARNINGS,
  CANCEL_USER_SUBSCRIPTION,
  ACTIVATE_USER_SUBSCRIPTION,
];

export const reviewPattern = [
  GET_RATING_COUNTS_BY_EXTERNAL,
  GET_META_REVIEW_BY_EXTERNAL,
  GET_META_REVIEWS,
];

export const customerPattern = [
  UPDATE_CUSTOMER,
  GET_CUSTOMER_DETAIL,
  GET_SELECTED_CUSTOMERS,
];

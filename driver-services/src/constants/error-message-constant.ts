export const errorMessage = {
  SOMETHING_WENT_WRONG: 'Something went wrong, please try again later',
  PROMO_CODE_NOT_VALID: 'Promo code is not valid',
  CREATE_CAPTAIN_ERROR: 'Some error occurred while creating a captain',
  DRIVER_EXIST: 'Driver already exists',
  DRIVER_EXIST_WITH_NATIONAL_ID: 'Driver already exists with this national id',
  DRIVER_NOT_FOUND: 'Driver Not Found',
  DRIVER_NOT_APPROVED: 'Driver is not approved yet or block by admin',
  CAB_TYPE_NOT_FOUND: 'Cab Type not found',
  CAR_INFO_NOT_FOUND: 'Car Info not found',
  NOT_ELIGIBLE: 'You are not eligible to become a captain',
  DRIVER_ELIGIBILITY_NOT_VALID:
    'Driver eligibility is not valid, please try again',
  DRIVER_ELIGIBILITY_DATA_NOT_FOUND: 'Driver eligibility data not found',
  DRIVER_ELIGIBILITY_EXPIRY_DATE_NOT_FOUND:
    'Driver eligibility expiry date not found',
  ADD_SUBSCRIPTION: 'Something went wrong, Cant add subscription',
  SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
  CANCEL_EXISTING_SUBSCRIPTION: 'Please cancel existing subscription',
  SUBSCRIPTION_TXN_ALREADY_EXIST: 'Subscription transaction already exist',
  SWITCH_MODE_NOT_ALLOWED: 'You are not allowed to switch mode at this time',
  CAB_TYPE_ORDER_EXIST: 'Sequence already assigned to other cab type',
  NO_DATA_FOUND: 'No data found',
  CAB_CHARGE_DUPLICATE_EXISTS: 'Charge with this configuration already exists',
  INPUT_CAB_TYPE_NOT_FOUND: "Oops! Given Cab type doesn't exists",
  INPUT_COUNTRY_NOT_FOUND: "Oops! Given Country doesn't exists",
  INPUT_CITY_NOT_FOUND: "Oops! Given City doesn't exists",
  CUSTOMIZED_CHARGE_DUPLICATE: 'Charge with this range of dates already exists',
  CUSTOMIZED_CHARGE_DATE_RANGE_ERROR:
    'From Date cannot be greater than To date',
  CUSTOMIZED_CHARGE_DATE_MIN_ERROR:
    'To Date should be atleast 30 min greater than From date',
  DISTANCE_MATRIX: {
    NOT_FOUND:
      'the origin and/or destination of this pairing could not be geocoded',
    ZERO_RESULTS: 'no route could be found between the origin and destination',
    MAX_ROUTE_LENGTH_EXCEEDED:
      'the requested route is too long and cannot be processed',
  },
};

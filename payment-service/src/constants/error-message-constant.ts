export const errorMessage = {
  SOMETHING_WENT_WRONG: 'Something went wrong, please try again later',
  SUBSCRIPTION_NOT_FOUND: 'Subscription Not Found',
  SUBSCRIPTION_NOT_AVAILABLE: 'No such active subscription available',
  CANCEL_SUBSCRIPTION_NOT_AVAILABLE:
    'No such cancelled subscription available that can reactivated again',
  SUBSCRIPTION_ALREADY_EXISTS: 'Same subscription is already exist',
  SUBSCRIPTION_HAS_DUE_AMOUNT:
    "Subscription can't be cancel as it has some error while making transaction for due amount, please try after some times",
  SUBSCRIPTION_PASSED_DUE_DATE: "Expired subscription can't be activated",
  DISCOUNT_PRICE_ERROR: 'Discount Value should be less than base price',
  DISCOUNT_PRICE_RANGE_ERROR: 'Discount Value should be between 1 to 100',
  SUBSCRIPTION_TRANSACTION_NOT_FOUND: 'Subscription transaction not found',
  SUBSCRIPTION_TRANSACTION_FAILED:
    'Subscription transaction failed, please try after some times',
  CAPTAIN_DETAILS_NOT_FOUND: 'Captain details not found',
  WALLET_NOT_FOUND: 'Wallet not found',
  HOLD_AMOUNT_NOT_FOUND: 'Hold amount not found',

  INVALID_IBAN: 'Invalid iban',
  NON_KSA_IBAN: 'IBAN must start with SA',

  NO_SUBSCRIPTION_FOUND: 'Subscription transactions not found',

  HOLD_AMOUNT_ALREADY_PROCEED: 'Hold amount already proceed',
  WALLET_COULD_NOT_UPDATE: "Wallet couldn't update",
  SENDER_WALLET_NOT_FOUND: 'Sender wallet not found',

  INVALID_REQUEST: 'Invalid request',
  RECEIVER_WALLET_NOT_FOUND: 'Receiver wallet not found',
  REMAINING_BALANCE_IS_LESS_THAN_ZERO: 'Remaining balance is less than zero',
  NOT_ENOUGH_BALANCE: 'Insufficient balance please transfer first',

  TRANSACTION_NOT_ALLOWED_TO_RETRY:
    'Retry action now allowed to this transaction',
  TRANSACTION_RETRY_FAILED: 'Request Failed',
  TRANSACTION_COMPLETED: 'Tranasction completed',
  MINIMUM_TOP: 'Minimum topup 3 and above',
  RIDER_HAVE_NOT_ENOUGH_BALANCE:
    'Rider is out of balance, Please let them know',
  TRIP_TRANSACTION: {
    HOLD_TX_NOT_FOUND: 'Hold transaction not found',
  },
};

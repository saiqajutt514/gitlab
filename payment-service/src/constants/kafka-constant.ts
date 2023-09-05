// Subscriptions
export const CREATE_SUBSCRIPTION = 'create-subscription';
export const UPDATE_SUBSCRIPTION = 'update-subscription';
export const DELETE_SUBSCRIPTION = 'delete-subscription';
export const GET_ALL_SUBSCRIPTIONS = 'get-all-subscriptions';
export const GET_SUBSCRIPTION_DETAIL = 'get-subscription-detail';
export const DASHBOARD_SUBSCRIPTION_STATS = 'dashboard-subscription-stats';

// User Subscriptions
export const CREATE_USER_SUBSCRIPTION = 'create-user-subscription';
export const UPDATE_USER_SUBSCRIPTION = 'update-user-subscription';
export const CANCEL_USER_SUBSCRIPTION = 'cancel-user-subscription';
export const ACTIVATE_USER_SUBSCRIPTION = 'activate-user-subscription';
export const GET_ALL_USER_SUBSCRIPTIONS = 'get-all-user-subscriptions';
export const GET_USER_SUBSCRIPTION_DETAIL = 'get-user-subscription-detail';
export const GET_ALL_USER_TRANSACTIONS = 'get-all-user-transactions';
export const GET_DRIVER_SUBSCRIPTIONS = 'get-driver-subscriptions';
export const GET_ACTIVE_SUBSCRIPTIONS = 'get-active-subscriptions';
export const GET_EXPIRED_SUBSCRIPTIONS = 'get-expired-subscriptions';
export const GET_USER_SUBSCRIPTION_COUNT = 'get-user-subscription-count';
export const ADD_USER_SUBSCRIPTION = 'add-user-subscription';
export const CHANGE_AUTO_RENEWAL_STATUS = 'change-auto-renewal-status';
export const SUBSCRIBERS_FROM_SUSCRIPTION_ID =
  'subscribers-from-subscription-id';
export const SUBSCRIPTION_DETAILS_FROM_USERID =
  'subscription-details-from-userid';

// Transactions
export const CREATE_TRANSACTION = 'create-transaction';
export const UPDATE_TRANSACTION = 'update-transaction';
export const GET_ALL_TRANSACTIONS = 'get-all-transactions';
export const GET_TRANSACTION_DETAIL = 'get-transaction-detail';

export const GET_ALINMA_TRANSACTIONS = 'get-alinma-transactions';

export const RETRY_ALINMA_TRANSACTIONS = 'retry-alinma-transactions';

export const GET_ALINMA_BALACE = 'get-alinma-balace';

// Hold amount APIs
export const BLOCK_AMOUNT = 'block-amount';
export const UPDATE_AMOUNT = 'update-amount';
export const RELEASE_AMOUNT = 'release-amount';
export const CONFIRM_AMOUNT = 'confirm-amount';

// Subscription Transaction
export const GET_SUBSCRIPTION_TRANSACTIONS = 'get-subscription-transactions';
export const ADD_SUBSCRIPTION_TRANSACTION = 'add-subscription-transaction';

// Captains
export const GET_SELECTED_CAPTAINS = 'get-selected-captains';
export const CAPTAIN_DETAIL = 'captain-detail';

// Admin Dashboard
export const DASHBOARD_GET_EARNINGS = 'dashboard-get-earnings';
export const DASHBOARD_EARNING_TOPUP_GRAPH = 'dashboard_earning_topup_graph';
export const DASHBOARD_GET_SINGLE_DAY_EARNING =
  'dashboard_get_single_day_earning';

export const DASHBOARD_EARNING_AVERAGE_GRAPH =
  'dashboard-earning-average-graph';

export const DASHBOARD_SPENT_TOPUP_GRAPH = 'dashboard_spent_topup_graph';

export const DASHBOARD_CASH_FLOW = 'dashboard_get_cash_flow';

// User Transactions
export const GET_USER_EARNINGS = 'get-user-earnings';

// Customer
export const GET_CUSTOMER_DETAIL = 'get-customer-detail';

// notifications
export const SEND_EMAIL_NOTIFICATION = 'send-email-notification';
export const SEND_PUSH_NOTIFICATION = 'send-push-notification';
export const SEND_SMS_NOTIFICATION = 'send-sms-notification';

export const UPDATE_CAPTAIN_SUBSCRIPTION = 'update-captain-subscription';

// Socket Gateway
export const EMIT_TO_ADMIN_DASHBOARD = 'emit-to-admin-dashboard';

//Balance
export const GET_BALANCE = 'get-balance';

export const ADD_BALANCE = 'add-balance';

export const GET_INVOICE_QR = 'get-invoice-qr';
export const GET_IBAN = 'get-iban';

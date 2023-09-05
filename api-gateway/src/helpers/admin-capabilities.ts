export const GET_METHODS = {

    //Dashboard
    'dashboard': 'dashboard-view',
    'dashboard/trip-stats': 'dashboard-view',
    'dashboard/active-riders': 'dashboard-view',
    'dashboard/earnings': 'dashboard-view',
    'dashboard/cancel-summary': 'dashboard-view',
    'dashboard/trip-summary': 'dashboard-view',

    //Role
    'role': 'roles-list',
    'role/*': 'roles-view',
    'capabilities/all': 'roles-view',

    //Sub Admin
    'subadmin/*': 'subadmin-view',

    //Rider
    'riders/*': 'riders-view',

    //Captain
    'captain/*': 'drivers-view',
    'captain-subscriptions/*': 'drivers-subscriptions',

    //Trips
    'trips/*': 'trips-view',

    //Promo Codes
    'all-promo-Codes': 'promotions-list',

    //Emergency
    'emergency-admin': 'emergency-team-list',

    //Vehicle
    'vehicle/*': 'vehicles-view',

    //Cab Type
    'cab-type/all': 'vehicle-type-list',

    //Rejected Reason
    'rejected-reason/type/3': 'rejected-reasons-list',
    'rejected-reason/type/1': 'rejected-reasons-list',
    'rejected-reason/type/2': 'rejected-reasons-list',

    //Subscription
    'subscription': 'subcription-packages-list',

    //Email Templates
    'templates/email': 'email-templates-list',
    'templates/email/*': 'email-templates-view',

    //SMS Templates
    'templates/sms': 'sms-templates-list',
    'templates/sms/*': 'sms-templates-view',

    //Push Templates
    'templates/push': 'push-templates-list',
    'templates/push/*': 'push-templates-view',

    //Dispatcher
    'dispatcher-admin': 'dispatcher-team-list',
    'dispatchers-trips/*': 'dispatcher-trips-list',
    'search-riders': 'dispatcher-trips-add',
    'rider-details/*': 'dispatcher-trips-add',

    //Setting
    'settings': 'settings-list',
    'chat-settings': 'chat-settings-list',

    //Fare Calculation
    'cab-charge-cities': 'fare-calculation-list',
    'cab-charge-detail/*': 'fare-calculation-view',

    // Chat
    'chat-user-detail/*': 'chat-user-detail'
}

export const POST_METHODS = {
    //Sub Admin
    'subadmin/list': 'subadmin-list',
    'subadmin': 'subadmin-add',

    //Rider
    'riders': 'riders-list',
    'rider-trip-scheduled/*': 'riders-view',
    'rider-trip-history/*': 'riders-view',

    //Captains
    'captains': 'drivers-list',
    'captain-trip-history/*': 'drivers-trip-history',
    'captain-earnings/*': 'drivers-earnings',
    'audit-log/driver-status': 'drivers-view',

    //Trips
    'trips': 'trips-list',

    //Review and Rating
    'riders-rating': 'rider-ratings-list',
    'captains-rating': 'driver-ratings-list',

    //Promo Codes
    'coupon': 'promotions-add',
    'voucher': 'promotions-add',

    //Subscriptions
    'active-subscriptions': 'subscription-transaction-active-list',
    'expired-subscriptions': 'subscription-transaction-expired-list',

    //Driver Registration
    'notify-users': 'driver-registrations-list',

    //Emergency
    'emergency-request/all': 'emergency-request-list',

    //Reports
    'reports/riders': 'report-riders-list',
    'reports/captains': 'report-drivers-list',
    'reports/captains-earnings': 'report-driver-earnings',
    'reports/trips': 'report-trips-list',
    //'reports/trips-cancelled-by-captain': '',
    'user-transactions': 'report-transactions',
    'reports/trips-cancelled-by-rider': 'report-trips-cancelled-by-rider',
    'reports/trips-declined-by-captain': 'report-trips-cancelled-by-driver',

    //Vehicle Registrations
    'car-info/all': 'report-vehicle-registrations',

    //Vehicle
    'vehicle/all': 'vehicles-list',

    //Cab Type
    'cab-type': 'vehicle-type-add',

    //Rejected Reason
    'rejected-reason': 'rejected-reasons-add',

    //subscription
    'subscription': 'subcription-packages-add',

    //Dispatcher
    'dispatchers-trips/all': 'dispatcher-trips-list',
    'search-drivers': 'dispatcher-trips-add',
    'estimate-trip-cost': 'dispatcher-trips-add',
    'create-trip-now': 'dispatcher-trips-add',
    'create-trip-schedule': 'dispatcher-trips-add',
    'rider-create-otp': 'dispatcher-trips-add',
    'rider-verify-otp': 'dispatcher-trips-add',
    'incomplete-trips': 'incomplete-trips-requests',

    // Chat
    'chat-user-list': 'chat-user-list',
    'chat-user-audit-log': 'chat-user-audit-log',
    'audit-log/chat-settings': 'chat-settings-audit-log',
}

export const PATCH_METHODS = {
    //Sub Admin
    'subadmin/*': 'subadmin-edit',

    //Captain
    'approve-captain/*': 'drivers-view',
    'reject-captain/*': 'drivers-view',

    //Trip
    'cancel-trip/*' : 'trips-canel',

    //Role
    'role/*': 'roles-edit',

    //Vehicle
    'vehicle/*': 'vehicles-edit',

    //Cab Type
    'cab-type/*': 'vehicle-type-edit',

    //Rejected Reason
    'rejected-reason/*': 'rejected-reasons-edit',

    //Subscription
    'subscription/*': 'subcription-packages-edit',

    //Email Templates
    'templates/email/*': 'email-templates-edit',
    'templates/email-status/*': 'email-templates-edit',

    //SMS Templates
    'templates/sms/*': 'sms-templates-edit',
    'templates/sms-status/*': 'sms-templates-edit',

    //Push Templates
    'templates/push/*': 'push-templates-edit',
    'templates/push-status/*': 'push-templates-edit',

    // Chat
    'chat-user-status/*': 'chat-user-status'
}

export const PUT_METHODS = {

    //Promo Codes
    'promo-code/*': 'promotions-edit'

}

export const DELETE_METHODS = {

    //Sub Admin
    'subadmin/*': 'subadmin-delete',

    //Promo Codes
    'promo-code/*': 'promotions-delete',

    //Role
    'role/*': 'roles-delete',

    //Cab Type
    'cab-type/*': 'vehicle-type-delete',

    //Rejected Reason
    'rejected-reason/*': 'rejected-reasons-delete',

    //Subscription
    'subscription/*': 'subcription-packages-delete'
}
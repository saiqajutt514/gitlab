SET NAMES utf8mb4;

TRUNCATE `setting`;
INSERT INTO `setting` (`id`, `createdAt`, `updatedAt`, `name`, `value`, `category`, `description`) VALUES
(UUID(),	NOW(),	NOW(),	'ADMIN_RIDE_NOTIFICATION_EMAIL',	'',	'3',	'Admin ride notification email'),
(UUID(),	NOW(),	NOW(),	'ADMIN_TRANSACTION_NOTIFY_EMAIL',	'',	'3',	'Admin transaction notification email'),
(UUID(),	NOW(),	NOW(),	'COMPANY_LOGO',	'https://loop-transportation-uat.s3.me-south-1.amazonaws.com/email/loop-logo.jpg',	'3',	'Company logo url'),
(UUID(),	NOW(),	NOW(),	'COMPANY_NAME',	'Loop Transportation',	'3',	'Company name'),
(UUID(),	NOW(),	NOW(),	'COPYRIGHT_TEXT',	'Copyright © 2021 Loop',	'3',	'Copyright text'),
(UUID(),	NOW(),	NOW(),	'DRIVER_DECLINE_TIME_LIMIT',	'30',	'2',	'Allowed time for a driver to decline trip request ( in seconds )'),
(UUID(),	NOW(),	NOW(),	'DRIVER_WAITING_TIME_LIMIT',	'5',	'2',	'Allowed waiting time for driver after reached pickup location OR in middle of trip ( in minutes )'),
(UUID(),	NOW(),	NOW(),  'EMAIL_NOTIFICATION_FROM_EMAIL',	'customerservice@bayanwallet.com',	'3','Email notification \"From Email\"'),
(UUID(),	NOW(),	NOW(),	'EMAIL_NOTIFICATION_FROM_NAME',	'Loop Admin',	'3',	'Email notification \"From Name\"'),
(UUID(),	NOW(),	NOW(),	'NOTIFY_TIME_SCHEDULED_TRIP',	'30',	'1',	'Time the rider will be notified of scheduled trips ( in minutes )'),
(UUID(),	NOW(),	NOW(),	'RECENT_ADDRESSES_LIMIT',	'2',	'1',	'No.of addresses to be show in recent list'),
(UUID(),	NOW(),	NOW(),	'RIDER_CANCEL_TIME_LIMIT',	'5',	'2',	'Allowed time for a rider to cancel current trip ( in minutes )'),
(UUID(),	NOW(),	NOW(),	'SCHEDULE_TRIP_MAX_DAYS',	'30',	'1',	'No. of days till a trip can be scheduled'),
(UUID(),	NOW(),	NOW(),	'SCHEDULE_TRIP_TIME_RANGE',	'{\"start\":\"09:00\",\"end\":\"20:00\"}',	'1',	'Allowed Time range while creating schedule trip'),
(UUID(),	NOW(),	NOW(),	'SCHEDULED_TRIP_MIN_TIME',	'30',	'1',	'Scheduled trip can be created after this many minutes from the current time'),
(UUID(),	NOW(),	NOW(),	'SITE_URL',	'https://www.loop.sa',	'3',	'Site url'),
(UUID(),	NOW(),	NOW(),	'SUPPORT_TOLL_FREE_NO',	'8001222228',	'1',	'Support team Toll Free number'),
(UUID(),	NOW(),	NOW(),	'TRIP_DRIVER_SEARCH_LIMIT',	'5',	'2',	'Max no.of drivers a trip request can search for'),
(UUID(),	NOW(),	NOW(),	'TRIP_DRIVER_SEARCH_RADIUS',	'50',	'3',	'Range of kilomenters a trip reqest can search for'),
(UUID(),	NOW(),	NOW(),	'TRIP_TAX_PERCENTAGE',	'15',	'1',	'Applicable tax for a trip amount ( in percentage )'),
(UUID(),	NOW(),	NOW(),	'WAITING_CHARGE_PER_MINUTE',	'1',	'2',	'Per minute charge for a rider if waiting time crossed ( in SAR )'),
(UUID(),	NOW(),	NOW(),	'DRIVER_PICKUP_REACH_RANGE',	'500',	'1',	'Distance Range the driver allowed to reach pickup location ( in meters )'),
(UUID(),	NOW(),	NOW(),	'DRIVER_END_TRIP_RANGE',	'500',	'1',	'Distance Range the driver allowed to end trip ( in meters )'),
(UUID(),	NOW(),	NOW(),	'RIDER_CANCEL_AMOUNT_WITH_TAX',	'1',	'1',	'what kind of amount needs to consider as cancellation fee for Rider i.e Base fare OR Base fare with Tax'),
(UUID(),	NOW(),	NOW(),	'CHANGE_DESTINATION_LIMIT_FOR_RIDER',	'4',	'1',	'Maximum no.of destinations the rider allowed to update in an ongoing trip'),
(UUID(),	NOW(),	NOW(),	'MAX_DRIVERS_REQUEST_LIMIT_FOR_PENDING_TRIP',	'5',	'1',	'Max no. of drivers to request in trip''s initial state'),
(UUID(),	NOW(),	NOW(),	'MAX_TRIP_REQUESTS_LIMIT_FOR_CANCELLED_TRIP',	'3',	'1',	'Max no. of times trip can be cancelled'),
(UUID(),	NOW(),	NOW(),	'MAX_DRIVERS_REQUEST_LIMIT_FOR_CANCELLED_TRIP',	'3',	'1',	'Max no. of drivers to request after trip gets cancelled'),
(UUID(),	NOW(),	NOW(),	'MAX_TRIP_REQUESTS_LIMIT_FOR_REJECTED_TRIP',	'3',	'1',	'Max no. of times trip can be rejected'),
(UUID(),	NOW(),	NOW(),  'NOTIFY_ELIGIBILITY_EXPIRY_TIME_PERIODS',	'[{\"notifiedCount\":0,\"days\":30},{\"notifiedCount\":1,\"days\":20},{\"notifiedCount\":2,\"days\":15},{\"notifiedCount\":3,\"days\":7},{\"notifiedCount\":4,\"days\":3},{\"notifiedCount\":5,\"days\":1}]',	'4',	'Notify for eligibility expiry time periods/intervals');

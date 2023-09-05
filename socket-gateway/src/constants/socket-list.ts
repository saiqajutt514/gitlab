// Communication through users
export const SC_SUBSCRIBE_USER = 'subscribe-user';
export const SC_UNSUBSCRIBE_USER = 'unsubscribe-user'
export const SC_DECLINE_REASONS = 'decline-reasons';

export const SC_UPDATE_CAPTAIN_LOCATION = 'update-captain-location';
export const SC_UPDATE_CUSTOMER_LOCATION = 'update-customer-location';
export const SC_DRIVER_LOCATION_UPDATES = 'driver-location-updates';
export const SC_RIDER_LOCATION_UPDATES = 'rider-location-updates';

export const SC_ESTIMATE_TRIP_DETAILS_UPDATES = 'estimate-trip-details-update';

export const SC_FIND_DRIVERS = 'find-drivers';
export const SC_TRIP_DETAIL = 'trip-detail';

// Internal communication
export const SC_NOTIFY_TRIP_DETAIL= 'notify-trip-detail'
export const SC_UPDATE_ADMIN_DASHBOARD_STATS = 'update-admin-dashboard-stats'

// Chat
export const SC_SEND_CHAT_MESSAGE = 'send-message'
export const SC_SEND_CHAT_MESSAGE_ACK = 'send-message-ack'
export const SC_RECEIVE_CHAT_MESSAGE = 'receive-message'
export const SC_CHAT_MESSAGE_DELIVERED = 'message-delivered'
export const SC_CHAT_MESSAGE_READ = 'message-read'
export const SC_CHAT_MESSAGE_DELETE = 'delete-message'
export const SC_BLOCK_CHAT_USER = 'block-user'
export const SC_UNBLOCK_CHAT_USER = 'unblock-user'
export const SC_TYPING_EVENT = 'typing-event'
export const SC_CONVERSATION_GET = 'conversation-get'
export const SC_UPDATE_CHAT_USER_LAST_SEEN = 'update-chat-user-last-seen'
export const SC_GET_CHAT_USER_LAST_SEEN = 'get-chat-user-last-seen'
export const SC_MUTE_UNMUTE_CONVERSATION = 'mute-unmute-conversation'
export const SC_CHAT_MESSAGE_READ_ALL = 'message-read-all'

// Admin
export const SC_ADMIN_DASHBOARD_STATS = 'admin-dashboard-stats'

// Socket connection
export const SOCKET_CONN_HEARTBEAT = 'heartbeat'
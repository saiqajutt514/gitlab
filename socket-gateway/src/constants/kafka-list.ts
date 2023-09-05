export const UPDATE_CAPTAIN_LOCATION = 'update-captain-location';
export const UPDATE_RIDER_LOCATION = 'update-rider-location';

export const DRIVER_ONLINE_STATUS = 'driver-online-status';

export const UPSERT_APP_USAGE = 'upsert-app-usage';
export const NOTIFY_TRIP_DETAIL = 'notify-trip-detail';
export const EMIT_TO_ADMIN_DASHBOARD = 'emit-to-admin-dashboard';

export const GET_DECLINE_REASONS = 'get-all-rejected-reasons';
export const FIND_NEAREST_DRIVERS = 'find-nearest-drivers';
export const TRIP_DETAIL = 'trip-detail';
export const GET_TRIP_ESTIMATED_COST_SOCKET = 'get-trip-estimated-cost-socket';

// Chat
export const CREATE_CHAT_MESSAGE = 'create-chat-message';
export const DELETE_CHAT_MESSAGE = 'delete-chat-message';
export const GET_CHAT_CONVERSATION_DETAIL = 'get-conversation-detail';
export const UPDATE_MESSAGE_DELIVERY_STATUS = 'update-message-delivery-status';
export const UPDATE_MESSAGE_READ_STATUS = 'update-message-read-status';

export const BLOCK_CHAT_USER = 'block-chat-user';
export const UNBLOCK_CHAT_USER = 'unblock-chat-user';
export const CREATE_CHAT_CONVERSATION = 'create-chat-converation';
export const UPDATE_CHAT_USER_LAST_SEEN = 'update-chat-user-last-seen';
export const MUTE_UNMUTE_CONVERSATION = 'mute-unmute-conversation';
export const MARK_MESSAGES = 'mark-messages';

export const tripKafkaPatterns = [TRIP_DETAIL];

export const adminKafkaPatterns = [GET_DECLINE_REASONS];

export const captainKafkaPatterns = [FIND_NEAREST_DRIVERS];

export const chatKafkaPatterns = [
  CREATE_CHAT_MESSAGE,
  DELETE_CHAT_MESSAGE,
  UPDATE_MESSAGE_DELIVERY_STATUS,
  UPDATE_MESSAGE_READ_STATUS,
  BLOCK_CHAT_USER,
  UNBLOCK_CHAT_USER,
  GET_CHAT_CONVERSATION_DETAIL,
  CREATE_CHAT_CONVERSATION,
  UPDATE_CHAT_USER_LAST_SEEN,
  MUTE_UNMUTE_CONVERSATION,
  MARK_MESSAGES,
];

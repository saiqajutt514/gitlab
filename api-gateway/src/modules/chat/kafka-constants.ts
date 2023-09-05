// Chat
export const VERIFY_CHAT_USER = 'verify-chat-user'
export const GET_CHAT_USER_DETAIL = 'get-chat-user-detail'
export const GET_BLOCKED_USERS = 'get-blocked-users'

export const CREATE_CHAT_CONVERSATION = 'create-chat-converation'
export const GET_CHAT_CONVERSATIONS = 'get-chat-conversations'
export const GET_CHAT_ARCHIVED_CONVERSATIONS = 'get-chat-archived-conversations'
export const GET_CHAT_USER_MESSAGES = 'get-chat-user-messages';
export const MARK_MESSAGES = 'mark-messages'
export const GET_CHAT_USER_LAST_SEEN = 'get-chat-user-last-seen'

export const CREATE_CHAT_GROUP = 'create-chat-group'
export const UPDATE_CHAT_GROUP = 'update-chat-group'
export const DELETE_CHAT_GROUP = 'delete-chat-group'
export const GET_CHAT_GROUP_DETAIL = 'get-chat-group-detail'
export const GET_CHAT_GROUP_MEMBERS = 'get-chat-group-members'
export const GET_CHAT_GROUP_MESSAGES = 'get-chat-group-messages'
export const ADD_CHAT_GROUP_MEMBERS = 'add-chat-group-members'
export const DELETE_CHAT_GROUP_MEMBERS = 'delete-chat-group-members'
export const UPDATE_CHAT_GROUP_ADMIN = 'update-chat-group-admin'
export const UPDATE_CHAT_GROUP_IMAGE = 'update-chat-group-image'
export const DELETE_ALL_MESSAGE = 'mark-all-as-delete'
export const GET_UNREAD_MESSAGE_COUNT = 'get-unread-message-count'
export const ARCHIVE_UNARCHIVE_CHAT = 'archive-unarchive-chat'

export const chatPatterns = [
  VERIFY_CHAT_USER,
  GET_CHAT_USER_DETAIL,
  GET_BLOCKED_USERS,

  CREATE_CHAT_CONVERSATION,
  GET_CHAT_CONVERSATIONS,
  GET_CHAT_ARCHIVED_CONVERSATIONS,
  GET_CHAT_USER_MESSAGES,
  MARK_MESSAGES,
  GET_CHAT_USER_LAST_SEEN,

  CREATE_CHAT_GROUP,
  UPDATE_CHAT_GROUP,
  DELETE_CHAT_GROUP,
  GET_CHAT_GROUP_DETAIL,
  GET_CHAT_GROUP_MEMBERS,
  GET_CHAT_GROUP_MESSAGES,
  DELETE_ALL_MESSAGE,

  ADD_CHAT_GROUP_MEMBERS,
  DELETE_CHAT_GROUP_MEMBERS,
  UPDATE_CHAT_GROUP_IMAGE,
  UPDATE_CHAT_GROUP_ADMIN,

  GET_UNREAD_MESSAGE_COUNT,
  ARCHIVE_UNARCHIVE_CHAT
];

export const CHAT_USER_LIST = "chat-user-list"
export const CHAT_USER_DETAIL = "chat-user-detail"
export const CHAT_USER_UPDATE_STATUS = "chat-user-update-status"

export const adminChatPatterns = [
  CHAT_USER_LIST,
  CHAT_USER_DETAIL,
  CHAT_USER_UPDATE_STATUS
]
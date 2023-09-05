import { MESSAGE_KIND, MESSAGE_TYPE, TYPING_STATUS } from "src/constants/constans";

export interface UserReqMessage {
  userID: string
}

export interface FindDriversReqMessage {
  userID?: string
  data: {
    latitude: number
    longitude: number
    destinationLatitude: number
    destinationLongitude: number
    excludeList?: string[]
    radius?: number
    limit?: number
  }
}

export interface TripDetailReqMessage {
  userID?: string
  data: {
    tripId: string
  }
}

export interface UpdateCaptainLocationReqMessage {
  userID?: string
  data: {
    driverId: string
    latitude: number
    longitude: number
  }
}

export interface UpdateRiderLocationReqMessage {
  userID?: string
  data: {
    riderId: string
    latitude: number
    longitude: number
  }
}

export interface TripLocationParams {
  driverId?: string
  riderId?: string
  latitude: number
  longitude: number
}

// Chat related channel messages
export interface ChatSendMsg extends UserReqMessage {
  data: {
    chatType: MESSAGE_KIND
    receiverId?: string
    conversationId?: string
    groupId?: string
    messageType: MESSAGE_TYPE
    messageContent?: string
    metadata?: any,
    mediaIdentifier?: string
  }
}

export interface ChatMsgDelivered extends UserReqMessage {
  data: {
    messageId: string
    receiverId: number
    senderId: string
  }
}

export interface ChatMsgRead extends UserReqMessage {
  data: {
    messageId: string
    receiverId: number
    senderId: string
  }
}

export interface ChatDeleteMsg extends UserReqMessage {
  data: {
    _id: string
    senderId: string
  }
}

export interface ChatGetConv extends UserReqMessage {
  data: {
    conversationId: string
  }
}

export interface ChatBlockUser extends UserReqMessage {
  data: {
    receiverId: number
  }
}

export interface ChatUnblockUser extends UserReqMessage {
  data: {
    receiverId: number
  }
}

export interface ChatTyping extends UserReqMessage {
  data: {
    groupId?: string
    receiverId?: string
    conversationId?: string
    action: TYPING_STATUS
  }
}
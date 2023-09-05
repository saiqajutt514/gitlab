import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray } from 'class-validator';
import { MESSAGE_KIND, MESSAGE_STATUS, MESSAGE_TYPE } from '../mesages.enum';

export class SaveConversationDto {
  @IsNotEmpty()
  @IsNumber()
  initiator: number

  @IsArray()
  receivers: any

  @IsOptional()
  groupId?: string

  @IsOptional()
  @IsEnum(MESSAGE_KIND)
  chatType: MESSAGE_KIND = MESSAGE_KIND.PERSONAL
}

export class CreateConversationDto {
  @IsNotEmpty()
  @IsNumber()
  senderId: number

  @IsNotEmpty()
  @IsNumber()
  receiverId: number

  @IsOptional()
  @IsEnum(MESSAGE_KIND)
  chatType: MESSAGE_KIND = MESSAGE_KIND.PERSONAL
}

export class UpdateConversationDto {
  @IsOptional()
  @IsNumber()
  lastMessageBy: number

  @IsOptional()
  @IsNumber()
  lastMessageType: number

  @IsOptional()
  @IsString()
  lastMessageContent: string
}

export class UpdateLastMessage {

  @IsNotEmpty()
  @IsString()
  conversationId?: string

  @IsNotEmpty()
  @IsNumber()
  senderId: number

  @IsOptional()
  @IsNumber()
  receiverId?: number

  @IsOptional()
  @IsString()
  groupId?: string

  @IsOptional()
  @IsString()
  messageContent: string

  @IsOptional()
  @IsEnum(MESSAGE_TYPE)
  messageType: MESSAGE_TYPE = MESSAGE_TYPE.TEXT

  @IsOptional()
  @IsEnum(MESSAGE_KIND)
  chatType: MESSAGE_KIND = MESSAGE_KIND.PERSONAL
}

export class PersonalMessageDto {

  @IsOptional()
  @IsString()
  conversationId?: string

  @IsNotEmpty()
  @IsString()
  messageId: string

  @IsNotEmpty()
  @IsNumber()
  timestamp?: number

  @IsNotEmpty()
  @IsNumber()
  senderId: number

  @IsNotEmpty()
  @IsNumber()
  receiverId: number

  @IsOptional()
  @IsString()
  messageContent?: string

  @IsOptional()
  @IsEnum(MESSAGE_TYPE)
  messageType: MESSAGE_TYPE = MESSAGE_TYPE.TEXT

  @IsOptional()
  @IsEnum(MESSAGE_KIND)
  chatType: MESSAGE_KIND = MESSAGE_KIND.PERSONAL

  @IsOptional()
  @IsEnum(MESSAGE_STATUS)
  status: MESSAGE_STATUS = MESSAGE_STATUS.SENT

  @IsOptional()
  metadata?: {}
}

export class GroupMessageDto {

  @IsNotEmpty()
  @IsString()
  messageId: string

  @IsNotEmpty()
  @IsNumber()
  timestamp: number

  @IsNotEmpty()
  @IsString()
  groupId: string

  @IsOptional()
  @IsString()
  conversationId?: string

  @IsNotEmpty()
  @IsNumber()
  senderId: number

  @IsNotEmpty()
  @IsNumber()
  receiverId: number

  @IsOptional()
  @IsString()
  messageContent?: string

  @IsOptional()
  @IsEnum(MESSAGE_TYPE)
  messageType: MESSAGE_TYPE = MESSAGE_TYPE.TEXT

  @IsOptional()
  @IsEnum(MESSAGE_KIND)
  chatType: MESSAGE_KIND = MESSAGE_KIND.GROUP

  @IsOptional()
  @IsEnum(MESSAGE_STATUS)
  status: MESSAGE_STATUS = MESSAGE_STATUS.SENT

  @IsOptional()
  metadata?: {}
}

export class SaveMessageDto {

  @IsOptional()
  @IsString()
  conversationId?: string

  @IsNotEmpty()
  @IsNumber()
  senderId: number

  @IsNotEmpty()
  @IsString()
  messageId: string

  @IsNotEmpty()
  @IsNumber()
  timestamp: number

  @IsNotEmpty()
  @IsNumber()
  receiverId: number

  @IsOptional()
  @IsString()
  messageContent?: string

  @IsOptional()
  @IsEnum(MESSAGE_TYPE)
  messageType: MESSAGE_TYPE = MESSAGE_TYPE.TEXT

  @IsOptional()
  @IsEnum(MESSAGE_KIND)
  chatType: MESSAGE_KIND = MESSAGE_KIND.PERSONAL

  @IsOptional()
  @IsEnum(MESSAGE_STATUS)
  status: MESSAGE_STATUS = MESSAGE_STATUS.SENT

  @IsOptional()
  metadata?: {}
}

export class DeliveryStatusDto {
  @IsNotEmpty()
  @IsNumber()
  receiverId: number

  @IsNotEmpty()
  @IsNumber()
  status: number

  @IsNotEmpty()
  deliveredAt: Date
}

export class ReadStatusDto {
  @IsNotEmpty()
  @IsNumber()
  receiverId: number

  @IsNotEmpty()
  @IsNumber()
  status: number

  @IsNotEmpty()
  readAt: Date
}

export class ChatPaginationDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class GetMessagesDto {
  @IsOptional()
  @IsString()
  lastMessageId?: string;
}

export class MarkMessagesDto {
  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

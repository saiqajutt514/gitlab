import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { MESSAGE_KIND, MESSAGE_TYPE } from '../constants/constans';

export class CreateMessageDto {

  @IsNotEmpty()
  @IsString()
  messageId: string

  @IsNotEmpty()
  @IsNumber()
  timestamp: number

  @IsNotEmpty()
  @IsNumber()
  senderId: number

  @IsNumber()
  receiverId?: number

  @IsString()
  groupId?: string

  @IsString()
  conversationId?: string

  @IsNotEmpty()
  @IsString()
  messageContent?: string

  @IsOptional()
  @IsEnum(MESSAGE_TYPE)
  messageType: MESSAGE_TYPE = MESSAGE_TYPE.TEXT

  @IsOptional()
  @IsEnum(MESSAGE_KIND)
  chatType: MESSAGE_KIND = MESSAGE_KIND.PERSONAL

  @IsOptional()
  status: number

  @IsOptional()
  metadata?: {}
}

export class DeliveryStatusDto {
  @IsNotEmpty()
  @IsNumber()
  receiverId?: number

  @IsNotEmpty()
  @IsNumber()
  status: number

  @IsNotEmpty()
  deliveredAt: Date
}

export class ReadStatusDto {
  @IsNotEmpty()
  @IsNumber()
  receiverId?: number

  @IsNotEmpty()
  @IsNumber()
  status: number

  @IsNotEmpty()
  readAt: Date
}

export class BlockUnblockDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  blockedId: number;
}

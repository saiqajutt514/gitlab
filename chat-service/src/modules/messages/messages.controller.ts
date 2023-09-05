import { Controller, HttpStatus, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import {
  CREATE_CHAT_CONVERSATION, UPDATE_CHAT_CONVERSATION, GET_CHAT_CONVERSATIONS, GET_CHAT_ARCHIVED_CONVERSATIONS,
  GET_CHAT_USER_MESSAGES, GET_CHAT_GROUP_MESSAGES, GET_CHAT_MESSAGE_DETAIL,
  UPDATE_MESSAGE_DELIVERY_STATUS, UPDATE_MESSAGE_READ_STATUS,
  CREATE_CHAT_MESSAGE, DELETE_CHAT_MESSAGE, GET_CHAT_CONVERSATION_DETAIL, DELETE_ALL_MESSAGE, MARK_MESSAGES, GET_UNREAD_MESSAGE_COUNT, ARCHIVE_UNARCHIVE_CHAT, CHAT_USER_DETAIL
 } from 'src/constants/kafka-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { MESSAGE_KIND } from './mesages.enum';
import {
  CreateConversationDto, UpdateConversationDto, ChatPaginationDto,
  PersonalMessageDto, GroupMessageDto, DeliveryStatusDto, ReadStatusDto, GetMessagesDto, MarkMessagesDto
} from './dto/messages.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {

  private readonly logger = new LoggerHandler(MessagesController.name).getInstance();

  constructor(private messagesService: MessagesService) { }

  @MessagePattern(CREATE_CHAT_CONVERSATION)
  async createConversation(@Payload() message) {
    this.logger.log(`kafka::chat::${CREATE_CHAT_CONVERSATION}::recv -> ${JSON.stringify(message.value)}`);
    const data: CreateConversationDto = message.value;
    return await this.messagesService.createConversation(data);
  }

  @MessagePattern(GET_CHAT_CONVERSATION_DETAIL)
  async getConversationDetail(@Payload() message) {
    this.logger.log(`kafka::chat::${GET_CHAT_CONVERSATION_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    return await this.messagesService.getConversationDetail(message?.value?.userId, message?.value?.conversationId);
  }

  @MessagePattern(UPDATE_CHAT_CONVERSATION)
  async updateConversation(@Payload() message) {
    this.logger.log(`kafka::chat::${UPDATE_CHAT_CONVERSATION}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    const data: UpdateConversationDto = message.value?.data;
    return await this.messagesService.updateConversation(id, data);
  }

  @MessagePattern(CREATE_CHAT_MESSAGE)
  async createMessage(@Payload() message) {
    this.logger.log(`kafka::chat::${CREATE_CHAT_MESSAGE}::recv -> ${JSON.stringify(message.value)}`);
    if(message?.value?.chatType === MESSAGE_KIND.GROUP) {
      const data: GroupMessageDto = message.value;
      return await this.messagesService.createGroupMessage(data);
    } else {
      const data: PersonalMessageDto = message.value;
      return await this.messagesService.createPersonalMessage(data);
    }
  }

  @EventPattern(UPDATE_MESSAGE_DELIVERY_STATUS)
  async updateDeliveryStatus(@Payload() message) {
    this.logger.log(`kafka::chat::${UPDATE_MESSAGE_DELIVERY_STATUS}::recv -> ${JSON.stringify(message.value)}`);
    const messageId: string = message.value?.messageId;
    const data: DeliveryStatusDto = message.value?.data;
    return await this.messagesService.updateDeliveryStatus(messageId, data);
  }

  @EventPattern(UPDATE_MESSAGE_READ_STATUS)
  async updateReadStatus(@Payload() message) {
    this.logger.log(`kafka::chat::${UPDATE_MESSAGE_READ_STATUS}::recv -> ${JSON.stringify(message.value)}`);
    const messageId: string = message.value?.messageId;
    const data: ReadStatusDto = message.value?.data;
    return await this.messagesService.updateReadStatus(messageId, data);
  }

  @MessagePattern(DELETE_CHAT_MESSAGE)
  async deleteMessage(@Payload() message) {
    this.logger.log(`kafka::chat::${DELETE_CHAT_MESSAGE}::recv -> ${JSON.stringify(message.value)}`);
    return await this.messagesService.deleteMessage(message.value?.id, message.value?.senderId);
  }

  @MessagePattern(GET_CHAT_MESSAGE_DETAIL)
  async findById(@Payload() message) {
    this.logger.log(`kafka::chat::${GET_CHAT_MESSAGE_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    return await this.messagesService.findMessageById(message.value?.id);
  }

  @MessagePattern(GET_CHAT_CONVERSATIONS)
  async getRecentChat(@Payload() message) {
    this.logger.log(`kafka::chat::${GET_CHAT_CONVERSATIONS}::recv -> ${JSON.stringify(message.value)}`);
    const userId: number = message.value?.userId;
    const data: ChatPaginationDto = message.value?.params;
    return await this.messagesService.getChatConversations(userId, data, false);
  }

  @MessagePattern(GET_CHAT_ARCHIVED_CONVERSATIONS)
  async getRecentArchivedChat(@Payload() message) {
    this.logger.log(`kafka::chat::${GET_CHAT_ARCHIVED_CONVERSATIONS}::recv -> ${JSON.stringify(message.value)}`);
    const userId: number = message.value?.userId;
    const data: ChatPaginationDto = message.value?.params;
    return await this.messagesService.getChatConversations(userId, data, true);
  }

  @MessagePattern(GET_CHAT_USER_MESSAGES)
  async getChatMessages(@Payload() message) {
    this.logger.log(`kafka::chat::${GET_CHAT_USER_MESSAGES}::recv -> ${JSON.stringify(message.value)}`);
    const senderId: number = message.value?.senderId;
    const receiverId: number = message.value?.receiverId;
    const params: GetMessagesDto = message.value;
    return await this.messagesService.getChatUserMessages(senderId, receiverId, params);
  }

  @MessagePattern(GET_CHAT_GROUP_MESSAGES)
  async getGroupMessages(@Payload() message) {
    this.logger.log(`kafka::chat::${GET_CHAT_GROUP_MESSAGES}::recv -> ${JSON.stringify(message.value)}`);
    const groupId: string = message.value?.id;
    const userId: number = message.value?.userId;
    const params: GetMessagesDto = message.value;
    return await this.messagesService.getGroupMessages(groupId, userId, params);
  }

  @MessagePattern(DELETE_ALL_MESSAGE)
  async markAllAsRead(@Payload() message) {
    this.logger.log(`kafka::chat::${DELETE_ALL_MESSAGE}::recv -> ${JSON.stringify(message.value)}`);
    const conversationId: string = message.value?.conversationId;
    const userId: number = message.value?.userId;
    const deleteConversation: boolean = message.value?.deleteConversation;
    return await this.messagesService.markAllAsDelete(userId, conversationId, deleteConversation);
  }

  @MessagePattern(MARK_MESSAGES)
  async markConversations(@Payload() message) {
    this.logger.log(`kafka::chat::${MARK_MESSAGES}::recv -> ${JSON.stringify(message.value)}`);
    const userId: number = message.value?.userId;
    const data: MarkMessagesDto = message.value?.body;
    return await this.messagesService.markMessages(userId, data);
  }

  @MessagePattern(GET_UNREAD_MESSAGE_COUNT)
  async getUnreadCount(@Payload() message) {
    this.logger.log(`kafka::chat::${GET_UNREAD_MESSAGE_COUNT}::recv -> ${JSON.stringify(message.value)}`);
    const userId: number = message.value?.userId;
    return await this.messagesService.getAllUnreadMessageCount(userId);
  }

  @MessagePattern(ARCHIVE_UNARCHIVE_CHAT)
  async archiveUnarchiveChat(@Payload() message) {
    this.logger.log(`kafka::chat::${ARCHIVE_UNARCHIVE_CHAT}::recv -> ${JSON.stringify(message.value)}`);
    const conversationId: string = message.value?.conversationId;
    const userId: number = message.value?.userId;
    const isArchived: boolean = message.value?.isArchived;
    return await this.messagesService.archiveUnarchiveChat(userId, conversationId, isArchived);
  }

  @MessagePattern(CHAT_USER_DETAIL)
  async getUserDetail(@Payload() message) {
    this.logger.log(`kafka::chat::${CHAT_USER_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.messagesService.getUserDetail(id);
  }
}

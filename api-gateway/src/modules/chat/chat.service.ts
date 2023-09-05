import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { ClientKafka, Client } from '@nestjs/microservices';

import { chatMicroServiceConfig } from 'src/microServiceConfigs';
import {
  chatPatterns, VERIFY_CHAT_USER, GET_CHAT_USER_DETAIL, GET_CHAT_USER_LAST_SEEN, GET_BLOCKED_USERS, ARCHIVE_UNARCHIVE_CHAT,
  CREATE_CHAT_CONVERSATION, GET_CHAT_CONVERSATIONS, GET_CHAT_ARCHIVED_CONVERSATIONS, GET_CHAT_USER_MESSAGES, CREATE_CHAT_GROUP, UPDATE_CHAT_GROUP, DELETE_CHAT_GROUP, GET_CHAT_GROUP_DETAIL, GET_CHAT_GROUP_MEMBERS,
  GET_CHAT_GROUP_MESSAGES, ADD_CHAT_GROUP_MEMBERS, DELETE_CHAT_GROUP_MEMBERS, UPDATE_CHAT_GROUP_ADMIN, UPDATE_CHAT_GROUP_IMAGE, DELETE_ALL_MESSAGE, MARK_MESSAGES, GET_UNREAD_MESSAGE_COUNT
} from './kafka-constants';

import {
  VerifyChatUserDto, ConversationDto, ChatPaginationDto, UserIdDto, SenderIdDto, ReceiverIdDto, GetMessagesDto,
  CreateGroupDto, UpdateGroupDto, AddGroupMemberDto, DeleteGroupMemberDto, GroupAdminAddRemoveDto, UpdateGroupImageDto, GroupImageDto, MarkMessagesDto
} from './dto/chat-user.dto';

import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class ChatService {

  constructor() { }

  private readonly logger = new LoggerHandler(ChatService.name).getInstance();

  @Client(chatMicroServiceConfig)
  clientChat: ClientKafka;

  onModuleInit() {
    chatPatterns.forEach((pattern) => {
      this.clientChat.subscribeToResponseOf(pattern);
    });
  }

  async verifyChatUser(data: VerifyChatUserDto) {
    this.logger.log(`kafka::chat::${VERIFY_CHAT_USER}::send -> ${JSON.stringify(data)}`);
    try {
      return await this.clientChat.send(VERIFY_CHAT_USER, JSON.stringify(data)).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async createConversation(data: ConversationDto) {
    this.logger.log(`kafka::chat::${CREATE_CHAT_CONVERSATION}::send -> ${JSON.stringify(data)}`);
    try {
      return await this.clientChat.send(CREATE_CHAT_CONVERSATION, JSON.stringify(data)).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getConversations(userId: number, params: ChatPaginationDto) {
    this.logger.log(`kafka::chat::${GET_CHAT_CONVERSATIONS}::send -> ${JSON.stringify(params)}`);
    try {
      return await this.clientChat.send(GET_CHAT_CONVERSATIONS, JSON.stringify({ userId, params })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getArchivedConversations(userId: number, params: ChatPaginationDto) {
    this.logger.log(`kafka::chat::${GET_CHAT_ARCHIVED_CONVERSATIONS}::send -> ${JSON.stringify(params)}`);
    try {
      return await this.clientChat.send(GET_CHAT_ARCHIVED_CONVERSATIONS, JSON.stringify({ userId, params })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getUserMessages(params: GetMessagesDto & SenderIdDto & ReceiverIdDto ) {
    this.logger.log(`kafka::chat::${GET_CHAT_USER_MESSAGES}::send -> ${JSON.stringify(params)}`);
    try {
      return await this.clientChat.send(GET_CHAT_USER_MESSAGES, JSON.stringify(params)).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getUserDetails(id: number, userId: number) {
    this.logger.log(`kafka::chat::${GET_CHAT_USER_DETAIL}::send -> userId: ${userId} |  id: ${id} `);
    try {
      return await this.clientChat.send(GET_CHAT_USER_DETAIL, JSON.stringify({ userId, id })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getUserLastSeen(userId: number) {
    this.logger.log(`kafka::chat::${GET_CHAT_USER_LAST_SEEN}::send -> ${userId}`);
    try {
      return await this.clientChat.send(GET_CHAT_USER_LAST_SEEN, JSON.stringify({ userId })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  // Group
  async createGroup(param : CreateGroupDto) {
    this.logger.log(`kafka::chat::${CREATE_CHAT_GROUP}::send -> param: ${JSON.stringify(param)}`);
    try {
      return await this.clientChat.send(CREATE_CHAT_GROUP, JSON.stringify({ ...param })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async updateGroup(userId: number, groupId: string, param : UpdateGroupDto) {
    this.logger.log(`kafka::chat::${UPDATE_CHAT_GROUP}::send -> userId: ${userId} | groupId: ${groupId} | param: ${JSON.stringify(param)}`);
    try {
      return await this.clientChat.send(UPDATE_CHAT_GROUP, JSON.stringify({ userId, groupId, ...param })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async deleteGroup(id: string, userId: number) {
    this.logger.log(`kafka::chat::${DELETE_CHAT_GROUP}::send -> param: ${JSON.stringify({id, userId})}`);
    try {
      return await this.clientChat.send(DELETE_CHAT_GROUP, JSON.stringify({ id, userId })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getGroupDetail(id: string, userId: number) {
    this.logger.log(`kafka::chat::${GET_CHAT_GROUP_DETAIL}::send -> param: ${JSON.stringify({id, userId})}`);
    try {
      return await this.clientChat.send(GET_CHAT_GROUP_DETAIL, JSON.stringify({ id, userId })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async createGroupMember(param : AddGroupMemberDto) {
    this.logger.log(`kafka::chat::${ADD_CHAT_GROUP_MEMBERS}::send -> param: ${JSON.stringify(param)}`);
    try {
      return await this.clientChat.send(ADD_CHAT_GROUP_MEMBERS, JSON.stringify({ ...param })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getGroupMembers(id: string, userId: number) {
    this.logger.log(`kafka::chat::${GET_CHAT_GROUP_MEMBERS}::send -> param: ${JSON.stringify({id, userId})}`);
    try {
      return await this.clientChat.send(GET_CHAT_GROUP_MEMBERS, JSON.stringify({ id, userId })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async deleteGroupMember(userId: number, param: DeleteGroupMemberDto) {
    this.logger.log(`kafka::chat::${DELETE_CHAT_GROUP_MEMBERS}::send -> param: ${JSON.stringify({userId, param})}`);
    try {
      return await this.clientChat.send(DELETE_CHAT_GROUP_MEMBERS, JSON.stringify({ userId, param })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async updateGroupAdmin(userId: number, param: GroupAdminAddRemoveDto) {
    this.logger.log(`kafka::chat::${UPDATE_CHAT_GROUP_ADMIN}::send -> param: ${JSON.stringify({userId, param})}`);
    try {
      return await this.clientChat.send(UPDATE_CHAT_GROUP_ADMIN, JSON.stringify({ userId, param })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }
  async updateGroupImage(params: UpdateGroupImageDto & GroupImageDto) {
    this.logger.log(`kafka::chat::${UPDATE_CHAT_GROUP_IMAGE}::send -> param: ${JSON.stringify({...params})}`);
    try {
      return await this.clientChat.send(UPDATE_CHAT_GROUP_IMAGE, JSON.stringify({ ...params })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getGroupMessages(id: string, params: GetMessagesDto & UserIdDto) {
    this.logger.log(`kafka::chat::${GET_CHAT_GROUP_MESSAGES}::send -> param: ${JSON.stringify({ id, params })}`);
    try {
      return await this.clientChat.send(GET_CHAT_GROUP_MESSAGES, JSON.stringify({ id, ...params })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getBlockedUsers(userId: number) {
    this.logger.log(`kafka::chat::${GET_BLOCKED_USERS}::send -> param: ${userId}`);
    try {
      return await this.clientChat.send(GET_BLOCKED_USERS, JSON.stringify({userId})).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async deleteAllMessage(userId: number, conversationId: string, deleteConversation: boolean) {
    this.logger.log(`kafka::chat::${DELETE_ALL_MESSAGE}::send -> param:  userId | ${userId} , conversationId | ${conversationId}, deleteConversation : ${deleteConversation}`);
    try {
      return await this.clientChat.send(DELETE_ALL_MESSAGE, JSON.stringify({userId, conversationId, deleteConversation})).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async archiveUnarchiveChat(userId: number, conversationId: string, isArchived: boolean) {
    this.logger.log(`kafka::chat::${ARCHIVE_UNARCHIVE_CHAT}::send -> param:  userId | ${userId} , conversationId | ${conversationId}, isArchived : ${isArchived}`);
    try {
      return await this.clientChat.send(ARCHIVE_UNARCHIVE_CHAT, JSON.stringify({userId, conversationId, isArchived})).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async markMessages(userId: number, body: MarkMessagesDto) {
    this.logger.log(`kafka::chat::${MARK_MESSAGES}::send -> ${JSON.stringify(body)}`);
    try {
      return await this.clientChat.send(MARK_MESSAGES, JSON.stringify({ userId, body })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

  async getUnreadMessageCount(userId: number) {
    this.logger.log(`kafka::chat::${GET_UNREAD_MESSAGE_COUNT}::send -> ${userId}`);
    try {
      return await this.clientChat.send(GET_UNREAD_MESSAGE_COUNT, JSON.stringify({ userId })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }
}

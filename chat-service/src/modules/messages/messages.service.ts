import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { plainToClass } from 'class-transformer';

import { errorMessage } from 'src/constants/error-message-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseData } from 'src/helpers/responseHandler';

import { MESSAGE_KIND, MESSAGE_STATUS, MESSAGE_TYPE } from './mesages.enum';
import {
  SaveConversationDto, CreateConversationDto, UpdateConversationDto, ChatPaginationDto, UpdateLastMessage,
  PersonalMessageDto, DeliveryStatusDto, ReadStatusDto, GetMessagesDto, SaveMessageDto, GroupMessageDto, MarkMessagesDto
} from './dto/messages.dto';
import { BlockUnblockDto } from '../users/dto/blocked-users.dto';
import { Conversations } from './conversations.schema';
import { Messages } from './messages.schema';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { toTimestamp } from '../../helpers/date-formatter';
import { ChatUserDetailDto } from '../users/dto/users.dto';
import { GET_META_REVIEW_BY_EXTERNAL, GET_RATING_COUNTS_BY_EXTERNAL } from 'src/constants/kafka-constant';
import { Client, ClientProxy } from '@nestjs/microservices';
import { reviewsTCPConfig } from 'src/microServicesConfigs/review.microservice.config';

@Injectable()
export class MessagesService {

  @Client(reviewsTCPConfig)
  clientReviewTCP: ClientProxy

  private readonly logger = new LoggerHandler(MessagesService.name).getInstance();

  constructor(
    @InjectModel(Conversations.name) private conversationModel: Model<Conversations>,
    @InjectModel(Messages.name) private messagesModel: Model<Messages>,
    private userService: UsersService,
    private groupService: GroupsService
  ) { }

  async createConversation(data: CreateConversationDto) {
    try {
      let conversationExist = await this.findConversation(data);
      if(conversationExist.statusCode === HttpStatus.OK && conversationExist.data) {
        return ResponseData.success(conversationExist.data);
      }

      let { senderId, receiverId } = data || {};
      let receivers = [
        { userId: Number(senderId) },
        { userId: Number(receiverId) }
      ];

      let conversation: SaveConversationDto = {
        initiator: Number(data.senderId),
        receivers: receivers,
        chatType: MESSAGE_KIND.PERSONAL
      }

      const createdConversation = new this.conversationModel(conversation);
      const response = await createdConversation.save();
      return ResponseData.success(response);
    } catch (err) {
      this.logger.error(`createConversation -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getConversationDetail(userId: number,id: string) {
    try {
      userId = Number(userId);
      const conversationDetail = await this.conversationModel.findById(id).lean();
      if(conversationDetail?.deletedFor) {
        let deletedFor = conversationDetail.deletedFor.filter((row) => row.userId != userId);
        delete conversationDetail?.deletedFor;
        if(deletedFor) {
          conversationDetail['deletedFor'] = [];
          deletedFor.map( (deleted) => {
            conversationDetail['deletedFor'].push({userId: Number(deleted?.userId) })
          });
        }
        await this.conversationModel.updateOne({_id: conversationDetail._id}, conversationDetail)
      }

      const mutedConversationData = await this.userService.getMutedConversationLists(userId);
      let mutedList = [];
      if(mutedConversationData?.statusCode === HttpStatus.OK) {
        if(mutedConversationData?.data) {
          mutedList = mutedConversationData?.data?.mutedChat;
        }
      }

      //const conversation = await this.conversationModel.findById(id);
      const conversations: any = await this.conversationModel.aggregate(
        [
          {
            $lookup: {
                from: "messages",
                let: { id: '$_id'},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: [ "$$id", { $toObjectId: "$conversationId" }] },
                                    { $eq: [ "$receiverId", userId ] },
                                    { $ne: [ "$status", MESSAGE_STATUS.BLOCKED ] }
                                ]
                            }
                        }
                    },
                    { $sort: { 'createdAt': -1 } },
                    { $limit: 1 },
                    { $project: { messageId: 1, messageContent: 1, messageType: 1, status: 1, createdAt: 1, timestamp: 1 } }
                ],
                as: "lastMessage"
            }
          },
          { $unwind: { path: "$lastMessage", "preserveNullAndEmptyArrays": true }  },
          { $match: { _id: Types.ObjectId(id)} },
        ]
      );

      let groupIds = [];
      let receiverIds = [];
      conversations.map((doc) => {
        if(mutedList.includes(doc._id)) {
          doc['muted'] = true;
        }
        else {
          doc['muted'] = false;
        }
        doc['receivers'] = doc.receivers.filter((row) => row.userId != userId);
        doc['createdAt'] = toTimestamp(doc.createdAt);
        doc['updatedAt'] = toTimestamp(doc.updatedAt);
        if(doc?.groupId) {
          groupIds.push(doc.groupId);
        } else {
          doc.receivers.map((row) => {
            receiverIds.push(row?.userId)
          });
        }
        // delete doc['lastMessageBy'];
        // delete doc['lastMessageType'];
        // delete doc['lastMessageContent'];
      });

      // Fetch Profiles Data
      let receiverData = await this.userService.findByUserIds(receiverIds);
      let receiverList = [];
      if (receiverData.statusCode === HttpStatus.OK) {
        receiverList = receiverData.data;
      }

      let groupsData = await this.groupService.findByGroupIds(groupIds);
      let groupList = [];
      if (groupsData.statusCode === HttpStatus.OK) {
        groupList = groupsData.data;
      }
      conversations.map((doc) => {
        doc['unread'] = 0;
        if (doc?.chatType === MESSAGE_KIND.GROUP) {
          if(doc?.groupId) {
            const groupInfo = groupList.filter((rec) => rec._id == doc?.groupId);
            if(groupInfo && groupInfo.length > 0) {
              doc['group'] = groupInfo;
            }
          }
          else {
            doc['group'] = {};
          }
        } else {
          if(doc['receivers']) {
            const receivers = doc['receivers'][0];
            const receiverInfo = receiverList.filter((rec) => rec.userId === receivers?.userId);
            if (receiverInfo && receiverInfo.length > 0) {
              let arabicFullName: string;
              if(receiverInfo[0]['firstNameArabic'] && receiverInfo[0]['lastNameArabic']) {
                arabicFullName = `${receiverInfo[0]['firstNameArabic']} ${receiverInfo[0]['lastNameArabic']}`
              }
              if(receiverInfo[0]['arabicName']) {
                arabicFullName = receiverInfo[0]['arabicName'];
              }

              let englishName = `${receiverInfo[0]['firstName']} ${receiverInfo[0]['lastName']}`;
              if(receiverInfo[0]['englishName']) {
                englishName = receiverInfo[0]['englishName'];
              }

              doc['receiver'] = {
                userId: receiverInfo[0]['userId'],
                englishName: englishName,
                arabicName: arabicFullName,
                profileImage: receiverInfo[0]['profileImage']
              }
            }
          } else {
            doc['receiver'] = {};
          }
        }
        delete doc['receivers'];
      });

      let blockedUsers = [];
      const blockedUsersData = await this.userService.getBlockedUsers(userId);
      if(blockedUsersData.statusCode === HttpStatus.OK) {
        if(blockedUsersData?.data) {
          blockedUsersData.data.map( (user) => {
            blockedUsers.push(user?.blockedId)
          });
        }
      }
      for (let i = 0; i < conversations.length; i++) {
        if(conversations[i]['chatType'] === MESSAGE_KIND.GROUP) {
          conversations[i]['unread'] =  await this.getUnreadMessageCountForGroup(conversations[i]['groupId'], userId);
        }
        else {
          conversations[i]['blocked'] = false;
          if(conversations[i]['receiver']?.userId && blockedUsers.includes(conversations[i]['receiver']?.userId)) {
            conversations[i]['blocked'] = true;
          }
          conversations[i]['unread'] =  await this.getUnreadMessageCountForConversation(userId, Number(conversations[i]['receiver'].userId || 0));
        }
      }

      return ResponseData.success(conversations);
    } catch (err) {
      this.logger.error(`getConversation -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateConversation(id: string, data: UpdateConversationDto) {
    try {
      const existingConversation = await this.conversationModel.findByIdAndUpdate(
        { _id: id }, data
      );
      if (!existingConversation) {
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.CONVERSATION_NOT_FOUND);
      }
      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`updateConversation -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findConversation(data: CreateConversationDto) {
    try {
      let { senderId, receiverId } = data || {};
      let conversation = await this.conversationModel
        .findOne({
          $and: [
            { chatType: MESSAGE_KIND.PERSONAL },
            { 'receivers.userId': Number(senderId) },
            { 'receivers.userId': Number(receiverId) }
          ]
        });
      return ResponseData.success(conversation);
    }
    catch (err) {
      this.logger.error(`findConversation -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateConversationData(data: UpdateLastMessage, conversationDetail: any) {
    try {
      if(conversationDetail?.deletedFor) {
        delete conversationDetail?.deletedFor;
        await this.conversationModel.updateOne({_id: conversationDetail._id}, {$unset: {deletedFor: 1 }})
      }
    } catch (err) {
      this.logger.error(`updateLastMessage -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async createPersonalMessage(data: PersonalMessageDto) {
    try {
      const { senderId, receiverId, chatType, messageType, messageContent, messageId, timestamp, conversationId: conversationId, metadata, status } = data;
      const receivers = [
        { userId: Number(receiverId) }
      ];
      //let status = MESSAGE_STATUS.SENT;

      //Create message for receiver
      const messageData: SaveMessageDto = {
        conversationId: conversationId,
        messageId: messageId,
        timestamp: timestamp,
        senderId: Number(senderId),
        receiverId: Number(receiverId),
        chatType: chatType,
        messageType: messageType,
        messageContent: messageContent,
        status: status,
        metadata: metadata
      };

      const createdMessage = new this.messagesModel(messageData);
      const response = await createdMessage.save();

      //Create message for sender
      const messageDataForsender: SaveMessageDto = {
        conversationId: conversationId,
        messageId: messageId,
        timestamp: timestamp,
        senderId: Number(senderId),
        receiverId: Number(senderId),
        chatType: chatType,
        messageType: messageType,
        messageContent: messageContent,
        status: MESSAGE_STATUS.READ,
        metadata: metadata
      };

      const senderMessage = new this.messagesModel(messageDataForsender);
      await senderMessage.save();

      const lastMessage: UpdateLastMessage = {
        conversationId: conversationId,
        senderId: Number(senderId),
        receiverId: Number(receiverId),
        chatType: chatType,
        messageType: messageType,
        messageContent: messageContent
      };

      // Send notifications
      const notifyMessage = {
        ...lastMessage,
        messageId,
        timestamp,
        conversationId
      }

      const conversationDetail = await this.conversationModel.findById(conversationId).lean();
      this.updateConversationData(lastMessage, conversationDetail);
      let checkIsArchive = false;
      if(conversationDetail?.archivedFor) {
        let isArchive = conversationDetail.archivedFor.filter((row) => row.userId != receiverId);
        if(isArchive.length > 0) {
          checkIsArchive = true;
        }
      }
      if(status !== MESSAGE_STATUS.BLOCKED && checkIsArchive === false) {
        this.userService.sendMultiNotifications({
          conversationId: conversationId,
          sender: Number(senderId),
          receivers: [Number(receiverId)],
          data: {
            messageContent,
            conversationId,
            messageType: messageType
          },
          extra: notifyMessage
        });
      }

      return ResponseData.success(response);
    } catch (err) {
      this.logger.error(`createPersonalMessage -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async createGroupMessage(data: GroupMessageDto) {
    try {
      const { groupId, senderId, chatType, messageType, messageContent, messageId, timestamp, metadata, conversationId } = data;

      const membersResponse = await this.groupService.getGroupMemberUserIds(groupId);
      if(membersResponse?.statusCode !== HttpStatus.OK) {
        throw new Error(errorMessage.SOMETHING_WENT_WRONG);
      }
      membersResponse.data.map(async (member) => {
        if (member.memberId !== senderId) {
          const messageData: GroupMessageDto = {
            messageId: messageId,
            conversationId: conversationId,
            timestamp: timestamp,
            groupId: groupId,
            senderId: senderId,
            receiverId: member.memberId,
            chatType: chatType,
            messageType: messageType,
            messageContent: messageContent,
            status: ( Number(senderId) === Number(member.memberId) ) ? MESSAGE_STATUS.READ : MESSAGE_STATUS.SENT,
            metadata: metadata
          };
          const createdMessage = new this.messagesModel(messageData);
          await createdMessage.save();
        }
      });

      const lastMessage: UpdateLastMessage = {
        conversationId: conversationId,
        groupId: groupId,
        senderId: senderId,
        chatType: chatType,
        messageType: messageType,
        messageContent: messageContent
      };

      const conversationDetail = await this.conversationModel.findById(conversationId).lean();
      this.updateConversationData(lastMessage, conversationDetail);

      // Send notifications
      const notifyMessage = {
        ...lastMessage,
        messageId,
        timestamp
      }
      const memberIds = membersResponse.data.map(memberRow => memberRow.memberId)
      this.userService.sendMultiNotifications({
        conversationId: conversationId,
        sender: Number(senderId),
        receivers: memberIds,
        data: {
          messageContent,
          messageType: messageType
        },
        extra: notifyMessage
      });

      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`createGroupMessage -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateDeliveryStatus(id: string, data: DeliveryStatusDto) {
    try {

      const existingMessage = await this.messagesModel.findOneAndUpdate(
        {
          messageId: id,
          receiverId: data.receiverId
        }, {
          status: data.status,
          deliveredAt: data.deliveredAt
        }
      );
      if (!existingMessage) {
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.MESSAGE_NOT_FOUND);
      }
      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`updateDeliveryStatus -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateReadStatus(id: string, data: ReadStatusDto) {
    try {
      const existingMessage = await this.messagesModel.findOneAndUpdate(
        {
          messageId: id,
          receiverId: data.receiverId
        }, {
          status: data.status,
          readAt: data.readAt
        }
      );
      if (!existingMessage) {
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.MESSAGE_NOT_FOUND);
      }
      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`updateReadStatus -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async deleteMessage(id: string, senderId: number) {
    try {
      const existingMessage = await this.messagesModel.deleteOne(
        { messageId: id, receiverId: Number(senderId) });
      if (!existingMessage) {
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.MESSAGE_NOT_FOUND);
      }
      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`delete -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findMessageById(id: string) {
    try {
      const messageDetail = await this.messagesModel
      .findById({ _id: id })
      .exec();

      if (!messageDetail) {
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.MESSAGE_NOT_FOUND);
      }
      return ResponseData.success(messageDetail);
    } catch (err) {
      this.logger.error(`findById -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findMessageByMessageId(id: string) {
    try {
      const messageDetail = await this.messagesModel
      .findOne({ messageId: id })
      .exec();

      if (!messageDetail) {
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.MESSAGE_NOT_FOUND);
      }
      return ResponseData.success(messageDetail);
    } catch (err) {
      this.logger.error(`findById -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getUnreadMessageCountForGroup(groupId: string, userId:number) {

    const userMatch = [
      {
        $and: [
          { receiverId: userId },
          {
            senderId: { $ne: userId }
          }
        ]
      }
    ];
    let conditions = {
      chatType: MESSAGE_KIND.GROUP,
      groupId: groupId,
      isDeleted: { $exists: false },
      readAt: { $exists: false },
      $and: userMatch
    }

    const result = await this.messagesModel.countDocuments(conditions);
    return result || 0;

  }

  async getUnreadMessageCountForConversation(senderId: number, receiverId: number) {

    const userMatch = [
      {
        $and: [
          { senderId: receiverId },
          { receiverId: senderId }
        ]
      }
    ];

    let conditions = {
      chatType: MESSAGE_KIND.PERSONAL,
      status: { $ne: MESSAGE_STATUS.BLOCKED },
      isDeleted: { $exists: false },
      readAt: { $exists: false },
      $and: userMatch
    }

    const result = await this.messagesModel.countDocuments(conditions);
    return result || 0;
  }

  async getChatConversations(userId: number, params: ChatPaginationDto, archived: boolean) {
    try {
      userId = Number(userId);
      let { page, limit } = params || {};
      if (!page || page <= 0) {
        page = 1;
      }
      if (!limit || limit <= 0) {
        limit = 50;
      }
      let skip = (page - 1) * limit;

      const mutedConversationData = await this.userService.getMutedConversationLists(userId);
      let mutedList = [];
      if(mutedConversationData?.statusCode === HttpStatus.OK) {
        if(mutedConversationData?.data) {
          mutedList = mutedConversationData?.data?.mutedChat;
        }
      }

      let matchCond:any = {
        'receivers.userId': userId,
        'deletedFor.userId': { $ne: userId },
        'archivedFor.userId': { $ne: userId }
      };
      if(archived === true) {
        matchCond = {
          'receivers.userId': userId,
          'deletedFor.userId': { $ne: userId },
          'archivedFor.userId': { $eq: userId }
        };
      }
      const conversations: any = await this.conversationModel.aggregate(
        [
          {
            $lookup: {
                from: "messages",
                let: { id: '$_id'},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: [ "$$id", { $toObjectId: "$conversationId" }] },
                                    { $eq: [ "$receiverId", userId ] },
                                    { $ne: [ "$status", MESSAGE_STATUS.BLOCKED ] }
                                ]
                            }
                        }
                    },
                    { $sort: { 'createdAt': -1 } },
                    { $limit: 1 },
                    { $project: { messageId: 1, messageContent: 1, messageType: 1, status: 1, createdAt: 1, timestamp: 1 } }
                ],
                as: "lastMessage"
            }
          },
          { $unwind: { path: "$lastMessage", "preserveNullAndEmptyArrays": true }  },
          { $match: matchCond },
          { $sort: { 'lastMessage.createdAt': -1,  updatedAt: -1 } },
          { $limit: Number(limit) },
          { $skip: Number(skip) },
        ]
      );

      let groupIds = [];
      let receiverIds = [];
      conversations.map((doc) => {
        if(mutedList.includes(doc._id)) {
          doc['muted'] = true;
        }
        else {
          doc['muted'] = false;
        }
        doc['receivers'] = doc.receivers.filter((row) => row.userId != userId);
        doc['createdAt'] = toTimestamp(doc.createdAt);
        doc['updatedAt'] = toTimestamp(doc.updatedAt);
        if(doc?.groupId) {
          groupIds.push(doc.groupId);
        } else {
          doc.receivers.map((row) => {
            receiverIds.push(row?.userId)
          });
        }
        delete doc['lastMessageBy'];
        delete doc['lastMessageType'];
        delete doc['lastMessageContent'];
      });

      // Fetch Profiles Data
      let receiverData = await this.userService.findByUserIds(receiverIds);
      let receiverList = [];
      if (receiverData.statusCode === HttpStatus.OK) {
        receiverList = receiverData.data;
      }

      let groupsData = await this.groupService.findByGroupIds(groupIds);
      let groupList = [];
      if (groupsData.statusCode === HttpStatus.OK) {
        groupList = groupsData.data;
      }
      conversations.map((doc) => {
        doc['unread'] = 0;
        if (doc?.chatType === MESSAGE_KIND.GROUP) {
          if(doc?.groupId) {
            const groupInfo = groupList.filter((rec) => rec._id == doc?.groupId);
            if(groupInfo && groupInfo.length > 0) {
              doc['group'] = groupInfo[0];
            }
          }
          else {
            doc['group'] = {};
          }
        } else {
          if(doc['receivers']) {
            const receivers = doc['receivers'][0];
            const receiverInfo = receiverList.filter((rec) => rec.userId === receivers.userId);
            if (receiverInfo && receiverInfo.length > 0) {
              let arabicFullName: string;
              if(receiverInfo[0]['firstNameArabic'] && receiverInfo[0]['lastNameArabic']) {
                arabicFullName = `${receiverInfo[0]['firstNameArabic']} ${receiverInfo[0]['lastNameArabic']}`
              }
              if(receiverInfo[0]['arabicName']) {
                arabicFullName = receiverInfo[0]['arabicName'];
              }

              let englishName = `${receiverInfo[0]['firstName']} ${receiverInfo[0]['lastName']}`;
              if(receiverInfo[0]['englishName']) {
                englishName = receiverInfo[0]['englishName'];
              }

              doc['receiver'] = {
                userId: receiverInfo[0]['userId'],
                englishName: englishName,
                arabicName: arabicFullName,
                mobileNo: receiverInfo[0]['mobileNo'],
                profileImage: receiverInfo[0]['profileImage']
              }
            }
          } else {
            doc['receiver'] = {};
          }
        }
        delete doc['receivers'];
      });
      let blockedUsers = [];
      const blockedUsersData = await this.userService.getBlockedUsers(userId);
      if(blockedUsersData.statusCode === HttpStatus.OK) {
        if(blockedUsersData?.data) {
          blockedUsersData.data.map( (user) => {
            blockedUsers.push(user?.blockedId)
          });
        }
      }

      for (let i = 0; i < conversations.length; i++) {
        if(conversations[i]['chatType'] === MESSAGE_KIND.GROUP) {
          conversations[i]['unread'] =  await this.getUnreadMessageCountForGroup(conversations[i]['groupId'], userId);
        } else {
          conversations[i]['blocked'] = false;
          if(conversations[i]['receiver']?.userId && blockedUsers.includes(conversations[i]['receiver']?.userId)) {
            conversations[i]['blocked'] = true;
          }
          conversations[i]['unread'] =  await this.getUnreadMessageCountForConversation(userId, Number(conversations[i]['receiver']?.userId || 0));
        }
      }

      // TODO: Update sender last seen details on first page
      return ResponseData.success(conversations);
    } catch (err) {
      this.logger.error(`[getChatConversations] -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getChatUserMessages(senderId: number, receiverId: number, params: GetMessagesDto) {
    try {
      let { lastMessageId } = params || {};
      let limit: number = 50;
      senderId = Number(senderId);
      receiverId = Number(receiverId);

      // Prev Timestamp
      let messageTimeStamp: any = null;
      if(lastMessageId) {
        const lastMessageData = await this.findMessageByMessageId(lastMessageId);
        if(lastMessageData?.statusCode === HttpStatus.OK && lastMessageData?.data) {
          messageTimeStamp = lastMessageData?.data?.createdAt;
        }
      }

      //Find conversation
      const data: CreateConversationDto = {
        senderId: Number(senderId),
        receiverId: Number(receiverId),
        chatType: MESSAGE_KIND.PERSONAL
      }
      let conversationExist = await this.findConversation(data);
      let conversationId: string;
      if(conversationExist.statusCode === HttpStatus.OK && conversationExist.data) {
        conversationId = conversationExist.data?._id;
      }

      // Fetch Messages
      let conditions = {};
      // const userMatch = [
      //   {
      //     $or: [
      //       { senderId: senderId },
      //       { receiverId: senderId }
      //     ]
      //   },
      //   {
      //     $or: [
      //       { senderId: receiverId },
      //       { receiverId: senderId }
      //     ]
      //   }
      // ];
      if(messageTimeStamp) {
        conditions = {
          chatType: MESSAGE_KIND.PERSONAL,
          status: { $ne: MESSAGE_STATUS.BLOCKED },
          isDeleted: { $exists: false },
          createdAt: { $lt: new Date(messageTimeStamp) },
          //$and: userMatch,
          conversationId: String(conversationId),
          receiverId: Number(senderId)
        }
      } else {
        conditions = {
          chatType: MESSAGE_KIND.PERSONAL,
          status: { $ne: MESSAGE_STATUS.BLOCKED },
          isDeleted: { $exists: false },
          //$and: userMatch,
          conversationId: String(conversationId),
          receiverId: Number(senderId)
        }
      }

      const messages = await this.messagesModel.aggregate(
        [
          {
            $match: conditions
          },
          // {
          //   $lookup: {
          //     from: "users",
          //     localField: "senderId",
          //     foreignField: "userId",
          //     as: "sender"
          //   }
          // },
          // { $unwind: '$sender' },
          {
            "$lookup": {
              "from": "messages",
              "localField": "messageId",
              "foreignField": "messageId",
              "as": "receiver"
            }
          },
          {
            "$addFields": {
              "receiver": {
                "$filter": {
                  "input": "$receiver",
                  "cond": { "$ne": ["$$this._id", "$_id"]}
                }
              }
            }
          },
          {
            $project: {
              _id: 1,
              chatType: 1,
              metadata: 1,
              messageId:1,
              timestamp:1,
              messageType: 1,
              messageContent: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              senderId: 1,
              conversationId: 1,
              receiverId: 1,
              'receiver.status': 1
              // "sender.userId": 1,
              // "sender.fullName": {
              //   $concat: [ "$sender.firstName", " ", "$sender.lastName" ]
              // },
              // "sender.profileImage": 1
            }
          },
          { $unwind: { path: "$receiver", "preserveNullAndEmptyArrays": true }  },
          { $sort: { createdAt: -1 } },
          { $limit: Number(limit) },
        ]
      );
      // TODO: Filter undelivered messages and emit to socket

      return ResponseData.success(messages);
    } catch (err) {
      this.logger.error(`[getChatUserMessages] -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getGroupMessages(groupId: string, userId: number, params: GetMessagesDto) {
    try {
      let { lastMessageId } = params || {};
      let limit: number = 50;
      userId = Number(userId);

      // Prev Timestamp
      let messageTimeStamp: any = null;
      if(lastMessageId) {
        const lastMessageData = await this.findMessageByMessageId(lastMessageId);
        if(lastMessageData?.statusCode === HttpStatus.OK && lastMessageData?.data) {
          messageTimeStamp = lastMessageData?.data?.createdAt;
        }
      }

      // Fetch Messages
      let conditions = {};
      const userMatch = [
        {
          $or: [
            { receiverId: userId }
          ]
        }
      ];
      if(messageTimeStamp) {
        conditions = {
          groupId: groupId,
          chatType: MESSAGE_KIND.GROUP,
          isDeleted: { $exists: false },
          //"deletedFor.userId" : { $ne: userId },
          createdAt: { $lt: new Date(messageTimeStamp) },
          $and: userMatch
        }
      } else {
        conditions = {
          groupId: groupId,
          chatType: MESSAGE_KIND.GROUP,
          isDeleted: { $exists: false },
          //"deletedFor.userId" : { $ne: userId },
          $and: userMatch
        }
      }

      const messages = await this.messagesModel.aggregate(
        [
          {
            $match: conditions
          },
          // {
          //   $lookup: {
          //     from: "users",
          //     localField: "senderId",
          //     foreignField: "userId",
          //     as: "sender"
          //   }
          // },
          // { $unwind: '$sender' },
          {
            $project: {
              _id: 1,
              groupId: 1,
              chatType: 1,
              messageId:1,
              timestamp:1,
              metadata: 1,
              messageType: 1,
              messageContent: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              senderId: 1,
              conversationId: 1,
              // "sender.userId": 1,
              // "sender.fullName": {
              //   $concat: [ "$sender.firstName", " ", "$sender.lastName" ]
              // },
              // "sender.profileImage": 1
            }
          },
          { $sort: { createdAt: -1 } },
          { $limit: Number(limit) },
        ]
      );

      // TODO: Filter undelivered messages and emit to socket

      return ResponseData.success(messages);
    } catch (err) {
      this.logger.error(`[getGroupMessages] -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async markAllAsDelete(userId: number, conversationId: string, deleteConversation: boolean) {
    try {

      const conversationDetail = await this.conversationModel
      .findById(conversationId)
      .exec();

      if (!conversationDetail) {
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.CONVERSATION_NOT_FOUND);
      }

      if(deleteConversation === true) {
        conversationDetail.deletedFor.push({userId: Number(userId)});
        conversationDetail.save();
      }

      const existingMessage = await this.messagesModel.deleteMany(
        { conversationId: conversationId, receiverId: Number(userId) }
      );

      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`[getGroupMessages] -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async markMessages(userId: number, params: MarkMessagesDto) {
    try {
      this.logger.log(`[markMessages] -> input params : ${userId} : ${JSON.stringify(params)}`)
      const { conversationId, groupId } = params

      let res = await this.messagesModel.updateMany({
        conversationId: conversationId,
        receiverId: Number(userId),
        status: { $ne: MESSAGE_STATUS.BLOCKED }
      }, {
        status: MESSAGE_STATUS.READ,
        readAt: new Date()
      });


      // let conditions = []
      // if (groupId) {
      //   conditions = [
      //     { groupId },
      //     { chatType: MESSAGE_KIND.GROUP }
      //   ]
      // } else if (conversationId) {
      //   conditions = [
      //     { conversationId },
      //     { chatType: MESSAGE_KIND.PERSONAL }
      //   ]
      // }
      // if (conditions.length === 0) {
      //   this.logger.error(`[markMessages] -> conversationId(${conversationId}) OR groupId(${groupId}) is invalid`)
      //   throw new Error('Invalid input params');
      // }
      // const messages = await this.messagesModel.find({
      //   receiverId: userId,
      //   status: { $ne: MESSAGE_STATUS.BLOCKED },
      //   isDeleted: { $exists: false },
      //   $and: [
      //     ...conditions,
      //     {
      //       $or: [
      //         { senderId: userId },
      //         { receiverId: userId }
      //       ]
      //     },
      //     {
      //       $or: [
      //         { readAt: { $exists: false } },
      //         { readAt: null }
      //       ]
      //     }
      //   ]
      // });
      // const messageIds = messages.map(msg => msg._id);
      // this.logger.log(`[markMessages] -> found messages : ${messageIds.length}`)
      // if (messageIds.length) {
      //   await this.messagesModel.updateMany({
      //     _id: { $in: messageIds }
      //   }, {
      //     readAt: new Date()
      //   })
      // }
      return ResponseData.success({ res });
    } catch (err) {
      this.logger.error(`[markMessages] -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getAllUnreadMessageCount(userId: number) {
    try {
       const userMatch = [
        {
          $and: [
            { receiverId: Number(userId) },
            {
              senderId: { $ne: Number(userId) }
            }
          ]
        }
      ];
      let conditions = {
        isDeleted: { $exists: false },
        readAt: { $exists: false },
        $and: userMatch
      }

      let totalUnread = await this.messagesModel.countDocuments(conditions);
      totalUnread = totalUnread || 0;
      return ResponseData.success({ unreadCount: totalUnread });
    } catch (err) {
      this.logger.error(`[getAllUnreadMessageCount] -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async archiveUnarchiveChat(userId: number, conversationId: string, isArchived: boolean) {
    try {

      const conversationDetail = await this.conversationModel
      .findById(conversationId)
      .exec();

      if (!conversationDetail) {
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.CONVERSATION_NOT_FOUND);
      }

      let archiveList = conversationDetail.archivedFor ? conversationDetail.archivedFor : [];
      if(isArchived === true) {
        archiveList.push({userId: Number(userId)});
      }
      else {
        archiveList =  conversationDetail.archivedFor.filter((row) => row.userId != userId);
      }

      const isArchive = await this.conversationModel.findOneAndUpdate(
        {
          _id: conversationId,
        }, {
          archivedFor: archiveList
        },
        {
          upsert: true
        }
      );

      return ResponseData.success(isArchive);
    } catch (err) {
      this.logger.error(`[archiveUnarchiveChat] -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getUserDetail(id: string) {
    try {
      let details = await this.userService.findById(id);
      if (details.statusCode !== HttpStatus.OK) {
        this.logger.error(`user not found | _id: ${id}`)
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.USER_NOT_FOUND);
      }

      let userDetail = plainToClass(ChatUserDetailDto, details.data._doc, { excludeExtraneousValues: true })
      userDetail['fullName'] = `${userDetail?.firstName} ${userDetail?.lastName}` || '';
      userDetail['fullNameArabic'] = userDetail?.firstNameArabic ? `${userDetail?.firstNameArabic} ${userDetail?.lastNameArabic}` : '';

      // TODO: Need to update below with dynamic
      const { data: captainReview } = await this.clientReviewTCP.send(GET_META_REVIEW_BY_EXTERNAL, JSON.stringify({ externalId: userDetail.userId, externalType: 1 })).pipe().toPromise()
      userDetail['rating'] = captainReview?.overallRating || 0;

      const { data: userReview } = await this.clientReviewTCP.send(GET_META_REVIEW_BY_EXTERNAL, JSON.stringify({ externalId: userDetail.userId, externalType: 1 })).pipe().toPromise()
      userDetail['rating'] = userReview?.overallRating || 0;

      const { data: userRatings } = await this.clientReviewTCP.send(GET_RATING_COUNTS_BY_EXTERNAL, JSON.stringify({ externalId: userDetail.userId, externalType: 1 })).pipe().toPromise()
      userDetail['ratingDetail'] = {
        "1": Number(userRatings[0]?.star_1 || 0),
        "2": Number(userRatings[0]?.star_2 || 0),
        "3": Number(userRatings[0]?.star_3 || 0),
        "4": Number(userRatings[0]?.star_4 || 0),
        "5": Number(userRatings[0]?.star_5 || 0),
      }
      const groupResponse = await this.groupService.getUserGroupCount(userDetail.userId);
      userDetail['totalGroup'] = groupResponse.statusCode === HttpStatus.OK ? groupResponse.data : 0;

      const messageStats = await this.messagesModel.aggregate([
        {
          $match: { senderId: userDetail.userId }
        },
        {
          $group: {
            _id: { msgType: "$messageType" },
            count: { $sum: 1 }
          }
        }
      ]);

      const textChats = messageStats.find(statRow => statRow._id.msgType === MESSAGE_TYPE.TEXT);
      userDetail['totalChat'] = textChats?.count || 0;

      const videoChats = messageStats.find(statRow => statRow._id.msgType === MESSAGE_TYPE.AUDIO || statRow._id.msgType === MESSAGE_TYPE.VIDEO);
      userDetail['totalVideo'] = videoChats?.count || 0;

      const mediaChats = messageStats.find(statRow => statRow._id.msgType === MESSAGE_TYPE.IMAGE || statRow._id.msgType === MESSAGE_TYPE.DOCUMENT);
      userDetail['totalMedia'] = mediaChats?.count || 0;

      const locationChats = messageStats.find(statRow => statRow._id.msgType === MESSAGE_TYPE.LOCATION);
      userDetail['totalLocation'] = locationChats?.count || 0;

      return ResponseData.success(userDetail);
    } catch (err) {
      this.logger.error(`getUserDetail -> error -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { errorMessage } from 'src/constants/error-message-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseData } from 'src/helpers/responseHandler';
import { Client, ClientKafka } from '@nestjs/microservices';
import {
  CreateUserDto,
  UpdateUserDto,
  MuteUnmuteConversationDto,
  ChatUserStatusDto,
} from './dto/users.dto';
import { BlockUnblockDto } from './dto/blocked-users.dto';

import { Users } from './users.schema';
import { BlockedUsers } from './blocked-users.schema';
import { notificationMicroServiceConfig } from '../../microServicesConfigs/notification.microservice.config';
import {
  SEND_PUSH_NOTIFICATION,
  CREATE_AUDIT_LOG,
} from '../../constants/kafka-constant';
import { RedisClient } from 'redis';
import { promisify } from 'util';
import { RedisHandler } from '../../helpers/redis-handler';
import appConfig from 'config/appConfig';
import {
  Conversations,
  ConversationsSchema,
} from '../messages/conversations.schema';
import {
  MESSAGE_KIND,
  MESSAGE_STATUS,
  MESSAGE_TYPE,
  MESSAGE_TEXT_ENGLISH,
  MESSAGE_TEXT_ARABIC,
} from '../messages/mesages.enum';
import { UserListingParams } from './interfaces/users.interface';
import { auditLogMicroServiceConfig } from 'src/microServicesConfigs/audit.microservice.config';
import { Groups } from '../groups/groups.schema';
import { AwsS3Service } from 'src/helpers/aws-s3-service';
import { USER_STATUS } from './users.enum';
import { Messages } from '../messages/messages.schema';
@Injectable()
export class UsersService {
  private readonly logger = new LoggerHandler(UsersService.name).getInstance();
  redisClient: RedisClient;
  getRedisKey: Function;
  constructor(
    @InjectModel(Users.name) private usersModel: Model<Users>,
    @InjectModel(BlockedUsers.name)
    private blockedUsersModel: Model<BlockedUsers>,
    @InjectModel(Conversations.name)
    private conversationModel: Model<Conversations>,
    @InjectModel(Groups.name) private groupModel: Model<Groups>,
    private redisHandler: RedisHandler,
    private awsS3Service: AwsS3Service,
    @InjectModel(Messages.name) private messagesModel: Model<Messages>,
  ) {
    this.redisClient = new RedisClient({
      host: appConfig().RedisHost,
      port: appConfig().RedisPort,
    });
    this.getRedisKey = promisify(this.redisClient.get).bind(this.redisClient);
  }

  @Client(notificationMicroServiceConfig)
  clientNotification: ClientKafka;

  @Client(auditLogMicroServiceConfig)
  clientAudit: ClientKafka;

  async syncBlockedUser(userId: number) {
    const chatUserKey = `chat-user-${userId}`;
    let userData: any = await this.getRedisKey(chatUserKey);
    this.logger.log(
      `[syncBlockedUser] data from cache: ${JSON.stringify(userData)}`,
    );
    if (!userData) {
      userData = {};
    } else {
      userData = JSON.parse(userData);
    }
    if (!userData?.blockedUsers) {
      userData['blockedUsers'] = [];
    }
    const blockedUsers = await this.blockedUsersModel.find({ userId: userId });
    if (!blockedUsers || !blockedUsers.length) {
      delete userData['blockedUsers'];
    } else {
      userData['blockedUsers'] = [];
      blockedUsers.map((user) => {
        userData['blockedUsers'].push(user?.blockedId);
      });
    }
    userData['lastSyncedAt'] = new Date();
    userData['isOnline'] = userData?.isOnline ? userData?.isOnline : false;

    const updateData = [];
    updateData.push(chatUserKey);
    updateData.push(JSON.stringify(userData));
    this.redisHandler.client.mset(updateData);
    this.logger.log(`[syncBlockedUser] data: ${JSON.stringify(updateData)}`);
    this.logger.log('[syncBlockedUser] to redis success');
  }

  async syncOnlineStatus(userId: number, isOnline: boolean) {
    const chatUserKey = `chat-user-${userId}`;
    let userData: any = await this.getRedisKey(chatUserKey);
    this.logger.log(
      `[syncBlockedUser] data from cache: ${JSON.stringify(userData)}`,
    );
    if (!userData) {
      userData = {};
    } else {
      userData = JSON.parse(userData);
    }

    //Update block case here
    if (!userData?.blockedUsers) {
      userData['blockedUsers'] = [];
    }
    const blockedUsers = await this.blockedUsersModel.find({ userId: userId });
    if (!blockedUsers || !blockedUsers.length) {
      delete userData['blockedUsers'];
    } else {
      userData['blockedUsers'] = [];
      blockedUsers.map((user) => {
        userData['blockedUsers'].push(user?.blockedId);
      });
    }

    userData['isOnline'] = isOnline;
    userData['lastSyncedAt'] = new Date();
    const updateData = [];
    updateData.push(chatUserKey);
    updateData.push(JSON.stringify(userData));
    this.redisHandler.client.mset(updateData);
    this.logger.log(`[syncOnlineStatus] data: ${JSON.stringify(updateData)}`);
    this.logger.log('[syncOnlineStatus] to redis success');
  }

  async sendMultiNotifications(params: any) {
    const { sender, receivers, data, extra, conversationId } = params;
    //Get user info

    let receiverList = await this.usersModel
      .find({
        userId: {
          $in: [...receivers, sender],
        },
        deviceToken: {
          $exists: true,
        },
      })
      .select({
        userId: 1,
        firstName: 1,
        lastName: 1,
        profileImage: 1,
        appVersion: 1,
        clientOs: 1,
        deviceId: 1,
        deviceName: 1,
        deviceToken: 1,
        prefferedLanguage: 1,
        mutedChat: 1,
        arabicName: 1,
        englishName: 1,
        _id: 0,
      })
      .lean();

    let senderDetail = receiverList.find((s) => s.userId === sender);
    const senderEnglishName = senderDetail?.englishName;
    const senderArabicName = senderDetail?.arabicName;

    receiverList = receiverList.filter((r) => r.userId !== sender);
    //let receiverTokens = receiverList.map(receiverRow => receiverRow.deviceToken)

    //Add unread count
    for (let i = 0; i < receiverList.length; i++) {
      const userMatch = [
        {
          $and: [
            { receiverId: Number(receiverList[i]['userId']) },
            {
              senderId: { $ne: Number(receiverList[i]['userId']) },
            },
          ],
        },
      ];
      let conditions = {
        isDeleted: { $exists: false },
        readAt: { $exists: false },
        $and: userMatch,
      };

      let totalUnread = await this.messagesModel.countDocuments(conditions);
      receiverList[i]['unread'] = totalUnread;
    }

    let receiverTokens = [];
    receiverList.map((receiverRow) => {
      let prefferedLanguage = receiverRow.prefferedLanguage
        ? receiverRow.prefferedLanguage
        : 'EN';
      if (receiverRow?.mutedChat) {
        if (!receiverRow?.mutedChat.includes(conversationId)) {
          receiverTokens.push({
            deviceToken: receiverRow.deviceToken,
            unread: receiverRow['unread'] || 0,
            prefferedLanguage: prefferedLanguage,
          });
        }
      } else {
        receiverTokens.push({
          deviceToken: receiverRow.deviceToken,
          unread: receiverRow['unread'] || 0,
          prefferedLanguage: prefferedLanguage,
        });
      }
    });

    if (!receiverTokens.length) {
      //TODO: Need to handle this case
      this.logger.error(`[TokenNotFound] for receivers`);
      return;
    }

    const code = 'send_message';
    const pushActionCodes = {
      send_message: 'CHAT_MESSAGE',
    };
    if (code in pushActionCodes) {
      try {
        receiverTokens.map((userData) => {
          let messageContent = data?.messageContent;
          if (data.messageType !== MESSAGE_TYPE.TEXT) {
            let languageKeys: any = MESSAGE_TEXT_ENGLISH;
            if (userData?.prefferedLanguage === 'AR') {
              languageKeys = MESSAGE_TEXT_ARABIC;
            }
            //Set message content here
            messageContent = languageKeys[`_${data.messageType}`];
          }

          let senderName =
            userData?.prefferedLanguage === 'AR' && senderArabicName
              ? senderArabicName
              : senderEnglishName;
          const pushParams: any = {
            externalId: sender,
            language: userData?.prefferedLanguage,
            deviceToken: userData?.deviceToken,
            // multiple: true,
            // deviceTokenList: receiverTokens,

            templateCode: pushActionCodes[code],
            keyValues: {
              senderName: senderName,
              message: messageContent,
            },
            extraParams: {
              type: code,
              userID: sender,
              conversationId: data?.conversationId || '',
              ...extra,
            },
            extraOptions: {
              badge: userData?.unread,
            },
          };
          this.logger.log(
            `[sendNotifications] push notify to : ${pushParams.externalId}`,
          );
          this.logger.log(
            `[sendNotifications] params : ${JSON.stringify(pushParams)}`,
          );
          this.clientNotification.emit(
            SEND_PUSH_NOTIFICATION,
            JSON.stringify(pushParams),
          );
        });
      } catch (e) {
        this.logger.error(e.message);
      }
    }
  }

  async sendNotifications(senderId: number, receiverId: number) {
    //TODO: below payload need to send
    // {
    //   "messageId": "60f170e2b6c8bb40d76b76ca",
    //   “timestamp”: "1177947885",
    //   "senderId": "1177947885",
    //   "receiverId": "1102847303",
    //   "chatType": 1,
    //   "messageType": 1,
    //      "messageContent": "Hi"
    // }

    // let senderId = 1177947885;
    // let receiverId = 1102847303;
    let conversationId = '60f14d58b2a69812071e86c3';
    let code = 'send_message';
    let messageContent = 'Hello There';

    const pushActionCodes = {
      send_message: 'CHAT_MESSAGE',
    };

    //Get user info
    const userDetails = await this.usersModel
      .find({
        userId: {
          $in: [senderId, receiverId],
        },
      })
      .select({
        userId: 1,
        firstName: 1,
        lastName: 1,
        profileImage: 1,
        appVersion: 1,
        clientOs: 1,
        deviceId: 1,
        deviceName: 1,
        deviceToken: 1,
        prefferedLanguage: 1,
        _id: 0,
      });

    if (!userDetails.length) {
      //TODO: Need to handle this case
      this.logger.log(`[usersNotFound]`);
      return;
    }

    let senderIndex = userDetails.findIndex((s) => s.userId === senderId);
    if (senderIndex < 0) {
      //TODO: Need to handle this case
      this.logger.log(`[senderNotFound]`);
      return;
    }

    //Get sender
    let senderDetail = userDetails[senderIndex];
    const senderFullName = senderDetail?.firstName
      ? `${senderDetail?.firstName} ${senderDetail?.lastName}`
      : '';
    userDetails.splice(senderIndex, 1);

    let language =
      userDetails.length > 1 ? 'EN' : userDetails[0].prefferedLanguage || 'EN';

    //Get device tokens
    let deviceToekns = [];
    userDetails.map((data) => {
      if (data.deviceToken) {
        deviceToekns.push(data.deviceToken);
      }
    });

    if (!deviceToekns.length) {
      //TODO: Need to handle this case
      this.logger.log(`[deviceTokenNotFound]`);
      return;
    }

    if (code in pushActionCodes) {
      try {
        const pushParams: any = {
          externalId: senderId,
          language: language,
          deviceToken: deviceToekns[0], //TODO: Need to handle multiple as well
          templateCode: pushActionCodes[code],
          keyValues: {
            senderName: senderFullName,
            message: messageContent,
          },
          extraParams: {
            type: code,
            userID: senderId,
            conversationId: conversationId,
          },
        };
        this.logger.log(
          `[sendNotifications] push notify to : ${pushParams.externalId}`,
        );
        this.logger.log(
          `[sendNotifications] params : ${JSON.stringify(pushParams)}`,
        );
        this.clientNotification.emit(
          SEND_PUSH_NOTIFICATION,
          JSON.stringify(pushParams),
        );
      } catch (e) {
        this.logger.error(e.message);
      }
    }
  }

  async create(data: CreateUserDto) {
    try {
      const createdUser = new this.usersModel(data);
      await createdUser.save();
      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`create -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async update(id: string, data: UpdateUserDto) {
    try {
      const params: any = data;
      const existingUser = await this.usersModel
        .findByIdAndUpdate({ _id: id }, params)
        .exec();

      if (!existingUser) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.USER_NOT_FOUND,
        );
      }
      return ResponseData.success(existingUser);
    } catch (err) {
      this.logger.error(`update -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findById(id: string) {
    try {
      const userDetail = await this.usersModel.findById({ _id: id }).exec();

      if (!userDetail) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.USER_NOT_FOUND,
        );
      }
      return ResponseData.success(userDetail);
    } catch (err) {
      this.logger.error(`findById -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findByMobile(mobileNo: string, userId: number) {
    try {
      let userDetail: any = await this.usersModel
        .findOne({ mobileNo: mobileNo })
        .exec();

      if (!userDetail) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.USER_NOT_FOUND,
        );
      }
      //Add conversation here
      let conversation = await this.conversationModel.findOne({
        $and: [
          { chatType: MESSAGE_KIND.PERSONAL },
          { 'receivers.userId': Number(userDetail.userId) },
          { 'receivers.userId': Number(userId) },
        ],
      });
      if (conversation) {
        userDetail = userDetail.toJSON();
        userDetail['conversation'] = conversation;
      }
      return ResponseData.success(userDetail);
    } catch (err) {
      this.logger.error(
        `findByMobile -> error: ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findByUserId(userId: number) {
    try {
      let userDetail: any = await this.usersModel
        .findOne({ userId: userId })
        .exec();

      if (!userDetail) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.USER_NOT_FOUND,
        );
      }
      if (!userDetail['arabicName']) {
        let arabicFullName: string;
        if (userDetail['firstNameArabic'] && userDetail['lastNameArabic']) {
          arabicFullName = `${userDetail['firstNameArabic']} ${userDetail['lastNameArabic']}`;
        }
        userDetail['arabicName'] = arabicFullName;
      }
      if (!userDetail['englishName']) {
        let englishName: string;
        if (userDetail['firstName'] && userDetail['lastName']) {
          englishName = `${userDetail['firstName']} ${userDetail['lastName']}`;
        }
        userDetail['englishName'] = englishName;
      }
      return ResponseData.success(userDetail);
    } catch (err) {
      this.logger.error(
        `findByUserId -> error: ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getGroupAdmin(userId: number) {
    try {
      let userDetail: any = await this.usersModel
        .findOne({ userId: userId })
        .select({
          firstName: 1,
          lastName: 1,
          mobileNo: 1,
          userId: 1,
          profileImage: 1,
        })
        .exec();

      if (!userDetail) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.USER_NOT_FOUND,
        );
      }
      userDetail['fullName'] = `${userDetail.firstName} ${userDetail.lastName}`;
      delete userDetail['firstName'];
      delete userDetail['lastName'];
      return ResponseData.success(userDetail);
    } catch (err) {
      this.logger.error(
        `findByUserId -> error: ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findByUserIds(userIds: number[]) {
    try {
      const userDetails = await this.usersModel
        .find({ userId: { $in: userIds } })
        .select([
          'userId',
          'firstName',
          'lastName',
          'profileImage',
          'firstNameArabic',
          'lastNameArabic',
          'arabicName',
          'englishName',
          'mobileNo',
        ])
        .exec();

      return ResponseData.success(userDetails);
    } catch (err) {
      this.logger.error(
        `findByUserIds -> error: ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async checkIsBlocked(data: BlockUnblockDto) {
    try {
      let { userId, blockedId } = data || {};
      let blockedUser = await this.blockedUsersModel
        .findOne({ userId: userId, blockedId: blockedId })
        .select(['_id', 'createdAt']);

      return ResponseData.success(blockedUser);
    } catch (err) {
      this.logger.error(
        `checkIsBlocked -> error: ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getLastSeen(userId: number) {
    try {
      //Get data from redis
      const chatUserKey = `chat-user-${userId}`;
      let userData = await this.getRedisKey(chatUserKey);
      let onlineStatus = false;
      if (userData) {
        userData = JSON.parse(userData);
        if (userData['isOnline']) {
          onlineStatus = userData['isOnline'];
        }
      }

      // const userDetail = await this.usersModel
      //   .findOne({ userId: userId })
      //   .select(['isOnline', 'lastSeenAt'])
      //   .exec();

      // if (!userDetail) {
      //   return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.USER_NOT_FOUND);
      // }
      return ResponseData.success({ onlineStatus });
    } catch (err) {
      this.logger.error(
        `findByUserId -> error: ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateLastSeen(userId: number, onlineStatus: boolean) {
    try {
      const userDetail = await this.usersModel
        .findOneAndUpdate({ userId: userId }, { lastSeenAt: new Date() })
        .exec();

      if (!userDetail) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.USER_NOT_FOUND,
        );
      }
      await this.syncOnlineStatus(userId, onlineStatus);

      const result = await this.conversationModel.aggregate([
        {
          $match: {
            'receivers.userId': Number(userId),
            groupId: { $exists: false },
          },
        },
        {
          $project: { receivers: 1 },
        },
      ]);

      return ResponseData.success(result);
    } catch (err) {
      this.logger.error(
        `findByUserId -> error: ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async blockUser(data: BlockUnblockDto) {
    try {
      let { userId, blockedId } = data || {};
      let blockedUser = await this.blockedUsersModel.findOne({
        userId: userId,
        blockedId: blockedId,
      });
      if (!blockedUser) {
        const blockUser = new this.blockedUsersModel(data);
        await blockUser.save();
      }
      // TODO: Save in redis and update conversation record
      this.syncBlockedUser(userId);
      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`blockUser -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async unblockUser(data: BlockUnblockDto) {
    try {
      let { userId, blockedId } = data || {};
      await this.blockedUsersModel.deleteOne({
        userId: userId,
        blockedId: blockedId,
      });
      // TODO: Delete from redis and update conversation record
      this.syncBlockedUser(userId);
      return ResponseData.success({});
    } catch (err) {
      this.logger.error(`unblockUser -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAll() {
    try {
      const users = await this.usersModel.find().exec();
      return ResponseData.success({ users });
    } catch (err) {
      this.logger.error(`findAll -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getBlockedUsers(id: number) {
    try {
      const blockedUsers = await this.blockedUsersModel.aggregate([
        { $match: { userId: Number(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'blockedId',
            foreignField: 'userId',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            blockedId: 1,
            'user.englishName': 1,
            'user.userId': 1,
            'user.arabicName': 1,
            'user.profileImage': 1,
          },
        },
      ]);
      return ResponseData.success(blockedUsers);
    } catch (err) {
      this.logger.error(`getBlockedUsers -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async muteUnmuteConversation(param: MuteUnmuteConversationDto) {
    try {
      this.logger.log(
        `muteUnmuteConversation -> param received -> ${JSON.stringify(param)}`,
      );
      const { userId, conversationId, status } = param;

      let userDetail = await this.usersModel.findOne({
        userId: Number(userId),
      });

      if (status === true) {
        if (!userDetail.mutedChat) {
          userDetail['mutedChat'] = [conversationId];
        } else {
          userDetail['mutedChat'].push(conversationId);
        }
      } else {
        if (userDetail.mutedChat) {
          const index = userDetail.mutedChat.indexOf(conversationId);
          if (index > -1) {
            userDetail.mutedChat.splice(index, 1);
          }
        } else {
          userDetail.mutedChat = null;
        }
      }
      userDetail.save();
      return ResponseData.success(userDetail);
    } catch (err) {
      this.logger.error(`muteUnmuteConversation -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getMutedConversationLists(userId: number) {
    try {
      const userDetail = await this.usersModel
        .findOne({ userId: Number(userId) })
        .select({ userId: 1, mutedChat: 1 });
      return ResponseData.success(userDetail);
    } catch (err) {
      this.logger.error(`getMutedConversationLists -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getUserList(params: UserListingParams) {
    try {
      let field: string = params.sort?.field || 'createdAt';
      let order: number = params.sort?.order === 'asc' ? 1 : -1;
      const sortParam = {
        [field]: order,
      };

      const tableFieldConditions = {
        isDeleted: { $exists: false },
      };
      if ([0, 1].includes(params?.filters?.status)) {
        tableFieldConditions['status'] = params.filters.status;
      }
      if (params?.filters?.userId) {
        tableFieldConditions['userIdStr'] = {
          $regex: params.filters.userId,
          $options: 'i',
        };
      }
      if (params?.filters?.emailId) {
        tableFieldConditions['emailId'] = {
          $regex: params.filters.emailId,
          $options: 'i',
        };
      }
      if (params?.filters?.mobileNo) {
        tableFieldConditions['mobileNo'] = {
          $regex: params.filters.mobileNo,
          $options: 'i',
        };
      }

      let customFieldConditions = {};
      if (params?.keyword) {
        const inputKeyword = String(params.keyword);
        customFieldConditions = {
          $or: [
            { userIdStr: { $regex: inputKeyword, $options: 'i' } },
            { emailId: { $regex: inputKeyword, $options: 'i' } },
            { mobileNo: { $regex: inputKeyword, $options: 'i' } },
            { fullName: { $regex: inputKeyword, $options: 'i' } },
          ],
        };
      }
      if (params?.filters?.fullName) {
        customFieldConditions['fullName'] = {
          $regex: params?.filters?.fullName,
          $options: 'i',
        };
      }
      this.logger.debug(`params || ${JSON.stringify(params)}`);
      this.logger.debug(
        `tableFieldConditions || ${JSON.stringify(tableFieldConditions)}`,
      );
      this.logger.debug(
        `customFieldConditions || ${JSON.stringify(customFieldConditions)}`,
      );

      const users = await this.usersModel.aggregate([
        {
          $addFields: {
            userIdStr: {
              $toString: '$userId',
            },
          },
        },
        {
          $match: tableFieldConditions,
        },
        {
          $project: {
            userId: 1,
            userIdStr: 1,
            fullName: {
              $concat: ['$firstName', ' ', '$lastName'],
            },
            fullNameArabic: {
              $concat: ['$firstNameArabic', ' ', '$lastNameArabic'],
            },
            emailId: 1,
            mobileNo: 1,
            status: 1,
            reason: 1,
          },
        },
        {
          $match: customFieldConditions,
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$root', '$$ROOT'],
            },
          },
        },
        {
          $project: {
            root: 0,
            userIdStr: 0,
          },
        },
        { $sort: sortParam },
        { $limit: Number(params.skip) + Number(params.take) },
        { $skip: Number(params.skip) },
      ]);

      // const conditions = []
      // conditions.push({
      //   isDeleted: { $exists: false }
      // })
      // if (params?.filters?.userId) {
      //   conditions.push({
      //     userId: { $eq: params.filters.userId }
      //   })
      // }
      // if (params?.filters?.fullName) {
      //   conditions.push({
      //     $or: [
      //       { firstName: { $regex: params.filters.fullName, $options: 'i' } },
      //       { lastName: { $regex: params.filters.fullName, $options: 'i' } },
      //     ]
      //   })
      // }
      // if (params?.filters?.emailId) {
      //   conditions.push({
      //     emailId: { $regex: params.filters.emailId, $options: 'i' }
      //   })
      // }
      // if (params?.filters?.mobileNo) {
      //   conditions.push({
      //     mobileNo: { $regex: params.filters.mobileNo, $options: 'i' }
      //   })
      // }

      // const users = await this.usersModel.find({
      //   $and: conditions
      // }).select({
      //   userId: 1,
      //   firstName: 1,
      //   lastName: 1,
      //   firstNameArabic: 1,
      //   lastNameArabic: 1,
      //   emailId: 1,
      //   mobileNo: 1,
      //   status: 1,
      //   reason: 1
      // }).sort([
      //   [params.sort?.field || 'createdAt', params.sort?.order || 'desc']
      // ]);

      // Collect list of group ids from user records

      // Prepare result array to return to FE
      const userList = [];
      users.forEach((userRow) => {
        const rowData = JSON.parse(JSON.stringify(userRow));
        userList.push({
          ...rowData,
          // old records may don't have data and FE may got errors due to below keys not available
          // status: rowData?.status ?? USER_STATUS.ACTIVE,
          // reason: rowData?.reason ?? ''
        });
      });
      return ResponseData.success({
        users: userList,
        totalCount: userList.length,
      });
    } catch (err) {
      this.logger.error(`getUserList -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateUserStatus(id: string, data: ChatUserStatusDto) {
    try {
      let details: any = await this.usersModel
        .findOne({
          _id: id,
        })
        .select({
          userId: 1,
          status: 1,
          reason: 1,
        })
        .exec();

      if (!details) {
        this.logger.error(`user not found | _id: ${id}`);
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.USER_NOT_FOUND,
        );
      }

      await this.usersModel.updateOne(
        {
          _id: id,
        },
        {
          status: data.status,
          reason: data.reason,
        },
      );

      // Audit log entry
      try {
        const auditParams = {
          moduleName: 'chat',
          entityName: 'chat-user-status',
          entityId: id,
          actionType: 'update',
          oldValues: {},
          newValues: {},
        };
        auditParams.oldValues = {
          status: details._doc.status,
          reason: details._doc.reason,
        };
        auditParams.newValues = {
          status: data.status,
          reason: data.reason,
        };
        this.clientAudit.emit(CREATE_AUDIT_LOG, JSON.stringify(auditParams));
        this.logger.log(
          `[changeUserStatus] audit log for status: ${data.status}`,
        );
      } catch (e) {
        this.logger.error(
          `[changeUserStatus] audit log for status: ${data.status} :: ${e.message}`,
        );
      }

      return ResponseData.success({ id, ...data });
    } catch (err) {
      this.logger.error(
        `updateUserStatus -> error -> ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async userLiveLocAndStatus(userId) {
    try {
      const locKey = `location-${userId}-rider`;
      let userLoc: any = await this.getRedisKey(locKey);
      const lastSeen = await this.getLastSeen(userId);
      if (userLoc) userLoc = JSON.parse(userLoc);
      ResponseData.success({ ...lastSeen.data, userLoc });
    } catch (err) {}
  }
}

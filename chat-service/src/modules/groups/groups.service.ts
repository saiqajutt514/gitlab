import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { errorMessage } from 'src/constants/error-message-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseData } from 'src/helpers/responseHandler';

import { Groups } from './groups.schema';
import { GroupMembers } from './group-members.schema';
import { Conversations } from '../messages/conversations.schema';

import { UsersService } from '../users/users.service';
import appConfig from 'config/appConfig';
import { RedisClient } from 'redis';
import { promisify } from 'util';
import { RedisHandler } from '../../helpers/redis-handler';

import {
  CreateGroupDto, UpdateGroupDto, CreateGroupMemberDto,
  DeleteGroupMemberDto, UpdateGroupAdminDto, UpdateGroupImageDto, StoreGroupMemberToResiDto
} from './dto/groups.dto';
import { SaveConversationDto } from '../messages/dto/messages.dto';
import { MESSAGE_KIND, MESSAGE_TYPE } from '../messages/mesages.enum';
import { GROUP_MEMBER_TYPE, GROUP_ACTION_MESSAGE } from './group.enum';
import { AwsS3Service } from '../../helpers/aws-s3-service';
@Injectable()
export class GroupsService {

  private readonly logger = new LoggerHandler(GroupsService.name).getInstance();
  redisClient: RedisClient;
  getRedisKey: Function;
  constructor(
    @InjectModel(Groups.name) private groupModel: Model<Groups>,
    @InjectModel(GroupMembers.name) private groupMembersModel: Model<GroupMembers>,
    @InjectModel(Conversations.name) private conversationModel: Model<Conversations>,
    private userService: UsersService,
    private awsS3Service: AwsS3Service,
    private redisHandler: RedisHandler
  ) {
    this.redisClient = new RedisClient({
      host: appConfig().RedisHost,
      port: appConfig().RedisPort,
    });
    this.getRedisKey = promisify(this.redisClient.get).bind(this.redisClient);
  }

  async syncGroupMemberToRedis(groupId: string) {
    const groupRedisKey = `group-members-${groupId}`;
    const groupMembersAll = await this.groupMembersModel.find({ groupId: groupId});
    let groupData = await this.getRedisKey(groupRedisKey);
    let syncGroupInfo = { 'lastSyncedAt': new Date(), 'members': []};
    groupMembersAll.map( (member) => {
      syncGroupInfo.members.push({ 'userId': member.memberId, isDeleted: member?.isDeleted ? member?.isDeleted : null });
    });
    this.logger.log(`[syncGroupInfo] redis syncing | ${JSON.stringify(syncGroupInfo)}`);
    const updateData = [];
    updateData.push(groupRedisKey);
    updateData.push(JSON.stringify(syncGroupInfo));
    this.redisHandler.client.mset(updateData);
    this.logger.log("[syncGroupInfo] to redis success");
  }

  async createGroup(data: CreateGroupDto) {
    try {
      const createdGroup = new this.groupModel(data);
      let response = await createdGroup.save();
      if(response?.groupImage) {
        response['groupImage'] = await this.awsS3Service.getChatGroupImageUrl({ name: response?.groupImage});
      }
      //Add default admin member
      const adminMember: CreateGroupMemberDto = {
        groupId: response._id,
        memberId: data.createdBy,
        memberType: GROUP_MEMBER_TYPE.ADMIN,
        createdBy: data.createdBy,
        modifiedBy: data.createdBy
      };
      const memberObject = new this.groupMembersModel(adminMember);
      await memberObject.save();

      //create conversation with receivers
      const initiator = data.createdBy;
      const receivers = [
        { userId: Number(initiator) }
      ];
      const conversations: SaveConversationDto = {
        initiator: initiator,
        receivers: receivers,
        chatType: MESSAGE_KIND.GROUP,
        groupId: response._id
      }

      const conversation = new this.conversationModel(conversations);
      await conversation.save();

      this.logger.log(`addGroupMembers -> syncGroupMemberToRedis -> groupId | ${response._id}`);
      await this.syncGroupMemberToRedis(response._id);
      this.logger.log(`addGroupMembers -> syncGroupMemberToRedis: updated`);

      return ResponseData.success({ response, conversation });
    }
    catch (err) {
      this.logger.error(`createGroup -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateGroup(id: string, data: UpdateGroupDto) {
    try {
      // Get Group
      const isGroupExist = await this.isGroupExist(id);
      if (!isGroupExist) {
        throw new Error(errorMessage.NO_GROUP_FOUND);
      }

      // Update Group
      await this.groupModel.findOneAndUpdate({ _id: id }, data);
      return ResponseData.success(isGroupExist);
  }
    catch (err) {
      this.logger.error(`updateGroup -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async deleteGroup(id: string, userId: number) {
    try {
      // Get Group
      const isGroupExist = await this.isGroupExist(id);
      if (!isGroupExist) {
        throw new Error(errorMessage.NO_GROUP_FOUND);
      }
      if(isGroupExist.createdBy !== userId) {
        throw new Error(errorMessage.DELETE_GROUP_NOT_ALLOW);
      }
      //TODO: Mark conversation as deleted
      let isConversationDeleted = await this.conversationModel.findOneAndUpdate({groupId: id}, { isDeleted: new Date()}, { upsert: true });
      let isDeleted = await this.groupModel.findOneAndUpdate({_id: id}, { isDeleted: new Date()}, { upsert: true });
      return ResponseData.success(isDeleted);
    }
    catch (err) {
      this.logger.error(`deleteGroup -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async isGroupExist(id: string) {
    try {
      return await this.groupModel.findOne({_id: id});
    } catch(err) {
      this.logger.error(`isGroupExist -> error: ${JSON.stringify(err.message)}`);
      return null;
    }
  }

  async getGroupDetail(id: string) {
    try {
      let isGroupExist: any = await this.isGroupExist(id);
      isGroupExist = isGroupExist.toJSON();
      if(!isGroupExist) {
        throw new Error(errorMessage.NO_GROUP_FOUND);
      }
      let adminUser = await this.userService.getGroupAdmin(isGroupExist.createdBy);
      if(adminUser.statusCode === HttpStatus.OK && adminUser?.data) {
        isGroupExist['admin'] = adminUser?.data;
      }

      if(isGroupExist?.groupImage) {
        //TODO: fetch image from s3
        isGroupExist['groupImage'] = await this.awsS3Service.getChatGroupImageUrl({name: isGroupExist?.groupImage})
      }

      return ResponseData.success(isGroupExist);
    }
    catch(err) {
      this.logger.error(`getGroupDetail -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  // Group Members
  async addGroupMembers(data: CreateGroupMemberDto) {
    try {
      let { groupId, memberIds, memberType, createdBy } = data;
      // Get group
      const isGroupExist = await this.isGroupExist(groupId);
      if(!isGroupExist) {
        throw new Error(errorMessage.NO_GROUP_FOUND);
      }

      const bulkUpsert = [];
      memberIds.map((id) => {
        const memberInfo: CreateGroupMemberDto = {
          memberId: id,
          groupId: groupId,
          memberType: memberType,
          createdBy: createdBy,
          modifiedBy: createdBy
        }
        const upsertDoc = {
          updateOne: {
            filter: {
              memberId: id,
              groupId: groupId
            },
            update: memberInfo,
            upsert: true
          }
        };
        bulkUpsert.push(upsertDoc)
      })
      let createMembers = await this.groupMembersModel.bulkWrite(bulkUpsert)
      await this.groupMembersModel.updateMany({
        memberId: { $in: memberIds }}, { $unset: { isDeleted: 1 }
      });

      // Find conversation by group id
      let conversation = await this.conversationModel.findOne({ groupId: groupId});
      if(!conversation) {
        throw new Error(errorMessage.CONVERSATION_NOT_FOUND);
      }

      // Check if user exist or not and upsert by removing additional field
      let memberIdsTemp: number[] = memberIds;
      let receivers = conversation.receivers;

      receivers.map((receiver, index) => {
        let memberId: number = receiver?.userId;
        if( memberIdsTemp.includes(memberId) ) {
          receivers[index] = { userId: Number(memberId) };
          var index = memberIdsTemp.indexOf(memberId);
          if (index >= 0) {
            memberIdsTemp.splice( index, 1 );
          }
        }
      });

      // Add remaining users
      memberIdsTemp.map((id) => {
        receivers.push({'userId': Number(id)});
      })
      await this.conversationModel.updateOne({
        _id: conversation._id}, { $set: { receivers: receivers }
      });

      const allGroupMembers = receivers.map(function(value) {
        return value.userId;
      });

      this.logger.log(`addGroupMembers -> syncGroupMemberToRedis -> groupId | ${groupId}`);
      await this.syncGroupMemberToRedis(groupId);
      this.logger.log(`addGroupMembers -> syncGroupMemberToRedis: updated`);
      return ResponseData.success(memberIds);
    }
    catch(err) {
      this.logger.error(`addGroupMembers -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getGroupMembers(id: string) {
    try {
      let members = await this.groupMembersModel.aggregate([
        {
          $match: {
              $and : [
                 { "groupId": id },
                 { "isDeleted": { $exists: false }}
              ]
          }
        },
        { "$lookup": { from: "users", localField: "memberId", foreignField:"userId" , as: "profile"} },
        { '$sort': {"profile.firstName": 1}}
      ])
      return ResponseData.success(members);
    }
    catch(err) {
      this.logger.error(`getGroupMembers -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async removeGroupMember(userId: number, data: DeleteGroupMemberDto) {
    try {
      let { groupId, memberId } = data;

      // Soft Delete Member
      let isDeleted = await this.groupMembersModel.findOneAndUpdate(
        {
          groupId: groupId,
          memberId: memberId
        },
        {
          isDeleted: new Date()
        },
        {
          upsert: true
        }
      );

      // Find conversation by group id
      let conversation = await this.conversationModel.findOne({ groupId: groupId });
      if(!conversation) {
        throw new Error(errorMessage.CONVERSATION_NOT_FOUND);
      }
      const lastActionContent = (memberId === userId) ? GROUP_ACTION_MESSAGE.LEAVED : GROUP_ACTION_MESSAGE.REMOVED;
      let receivers = conversation.receivers;
      receivers.map((receiver, index) => {
        if(receiver?.userId === memberId) {
          receivers[index] = {
            userId: Number(memberId),
            lastActionAt: new Date(),
            lastActionBy: userId,
            lastActionType: MESSAGE_TYPE.ACTION,
            lastActionContent: lastActionContent
          };
        }
      });
      await this.conversationModel.updateOne(
        {_id: conversation._id}, { $set: { receivers: receivers }
      });

      this.logger.log(`addGroupMembers -> syncGroupMemberToRedis -> groupId | ${groupId}`);
      await this.syncGroupMemberToRedis(groupId);
      this.logger.log(`addGroupMembers -> syncGroupMemberToRedis: updated`);

      return ResponseData.success(isDeleted);
    }
    catch(err) {
      this.logger.error(`removeGroupMember -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateGroupAdmin(data: UpdateGroupAdminDto) {
    try {
      let { groupId, memberId, memberType } = data;
      let admin = await this.groupMembersModel.findOneAndUpdate(
        {
          groupId: groupId,
          memberId: memberId
        },
        {
          memberType: memberType
        }
      );
      return ResponseData.success(admin);
    } catch(err) {
      this.logger.error(`updateGroupAdmin -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateGroupImage(data: UpdateGroupImageDto) {
    try {
      let { groupId, groupImage, modifiedBy } = data;
      await this.groupModel.findOneAndUpdate(
        {
          _id: groupId
        },
        {
          groupImage: groupImage,
          modifiedBy: modifiedBy
        }
      );
      return ResponseData.success(data);
    }
    catch(err) {
      this.logger.error(`updateGroupAdmin -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getGroupMemberUserIds(id: string) {
    try {
      // Get Group Members
      let condition = [
        { $and: [{ groupId: id }] },
        { $and: [{ isDeleted: { $exists: false} }]}
      ];
      let members = await this.groupMembersModel
        .find().and(condition)
        .select(['memberId'])
        .sort({ updatedAt: -1 })
        .lean();
      return ResponseData.success(members);
    } catch(err) {
      this.logger.error(`getGroupMemberUserIds -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findByGroupIds(groupIds: string[]) {
    try {
      const groupDetails = await this.groupModel
        .find({ _id : { $in : groupIds } })
        .select(['groupTitle', 'groupImage'])
        .exec();

      const groupData = await Promise.all( groupDetails.map( async (doc): Promise<any> => {
        if(doc?.groupImage) {
          doc['groupImage'] = await this.awsS3Service.getChatGroupImageUrl({ name: doc?.groupImage });
        }
      }) );

      return ResponseData.success(groupDetails);
    } catch (err) {
      this.logger.error(`findByGroupIds -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getUserGroupCount(userId: number) {
    try {
      const totalGroup = await this.groupMembersModel.countDocuments({
        memberId: userId,
        isDeleted: { $exists: false}
      });
      return ResponseData.success(totalGroup);
    } catch (err) {
      this.logger.error(`getUserGroupCount -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }
}

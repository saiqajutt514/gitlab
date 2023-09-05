import { Controller, HttpStatus, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { LoggerHandler } from 'src/helpers/logger-handler';

import { GroupsService } from './groups.service';
import {
  CreateGroupDto, UpdateGroupDto, CreateGroupMemberDto,
  DeleteGroupMemberDto, UpdateGroupAdminDto, UpdateGroupImageDto
} from './dto/groups.dto';

import {
  CREATE_CHAT_GROUP, UPDATE_CHAT_GROUP, DELETE_CHAT_GROUP, GET_CHAT_GROUP_DETAIL, UPDATE_CHAT_GROUP_IMAGE,
  ADD_CHAT_GROUP_MEMBERS, GET_CHAT_GROUP_MEMBERS, DELETE_CHAT_GROUP_MEMBERS, UPDATE_CHAT_GROUP_ADMIN
} from 'src/constants/kafka-constant';
import { GROUP_MEMBER_TYPE } from './group.enum';

@Controller('groups')
export class GroupsController {

  private readonly logger = new LoggerHandler(GroupsController.name).getInstance();

  constructor(private groupsService: GroupsService) { }

  // Group
  @MessagePattern(CREATE_CHAT_GROUP)
  async createGroup(@Payload() message) {
    this.logger.log(`kafka::trip::${CREATE_CHAT_GROUP}::recv -> ${JSON.stringify(message.value)}`);
    const data: CreateGroupDto = message?.value;
    const response =  await this.groupsService.createGroup(data);
    let memberData: CreateGroupMemberDto = {
      groupId: response?.data?._id,
      memberIds: message?.value?.memberIds,
      createdBy: message?.value?.createdBy,
      modifiedBy: message?.value?.modifiedBy,
      memberType: GROUP_MEMBER_TYPE.MEMBER
    };
    await this.groupsService.addGroupMembers(memberData);
    return response;
  }

  @MessagePattern(UPDATE_CHAT_GROUP)
  async updateGroup(@Payload() message) {
    this.logger.log(`kafka::trip::${UPDATE_CHAT_GROUP}::recv -> ${JSON.stringify(message.value)}`);
    let data: UpdateGroupDto = {
      groupTitle: message?.value?.groupTitle,
      description: message?.value?.description,
      modifiedBy: message?.value?.userId
    };
    let groupId: string = message?.value?.groupId;

    // TODO: emit event to group members
    return await this.groupsService.updateGroup(groupId, data);
  }

  @MessagePattern(DELETE_CHAT_GROUP)
  async deleteGroup(@Payload() message) {
    this.logger.log(`kafka::trip::${DELETE_CHAT_GROUP}::recv -> ${JSON.stringify(message.value)}`);
    let groupId: string = message?.value?.id;
    let userId: number = message?.value?.userId;
    // TODO: emit event to group members
    return await this.groupsService.deleteGroup(groupId, userId);
  }

  @MessagePattern(GET_CHAT_GROUP_DETAIL)
  async getGroupDetail(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_CHAT_GROUP_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    let groupId: string = message?.value?.id;
    return await this.groupsService.getGroupDetail(groupId);
  }

  // Group Members
  @MessagePattern(ADD_CHAT_GROUP_MEMBERS)
  async addGroupMembers(@Payload() message) {
    this.logger.log(`kafka::trip::${ADD_CHAT_GROUP_MEMBERS}::recv -> ${JSON.stringify(message.value)}`);
    const data: CreateGroupMemberDto = message?.value;
    return await this.groupsService.addGroupMembers(data);
  }

  @MessagePattern(GET_CHAT_GROUP_MEMBERS)
  async getGroupMembers(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_CHAT_GROUP_MEMBERS}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message?.value?.id;
    const userId: number = message?.value?.userId;
    return await this.groupsService.getGroupMembers(id);
  }

  @MessagePattern(DELETE_CHAT_GROUP_MEMBERS)
  async removeGroupMembers(@Payload() message) {
    this.logger.log(`kafka::trip::${DELETE_CHAT_GROUP_MEMBERS}::recv -> ${JSON.stringify(message.value)}`);
    const userId: number = message?.value?.userId;
    const data: DeleteGroupMemberDto = message?.value?.param;
    // TODO: Lock last message data and send event to blocked user
    return await this.groupsService.removeGroupMember(userId, data);
  }

  @MessagePattern(UPDATE_CHAT_GROUP_ADMIN)
  async updateGroupAdmin(@Payload() message) {
    this.logger.log(`kafka::trip::${UPDATE_CHAT_GROUP_ADMIN}::recv -> ${JSON.stringify(message.value)}`);
    const userId: number = message?.value?.userId;
    const data: UpdateGroupAdminDto = message?.value?.param;
    return await this.groupsService.updateGroupAdmin(data);
  }

  @MessagePattern(UPDATE_CHAT_GROUP_IMAGE)
  async updeateGroupImage(@Payload() message) {
    this.logger.log(`kafka::trip::${UPDATE_CHAT_GROUP_IMAGE}::recv -> ${JSON.stringify(message.value)}`);
    const userId: number = message?.value?.userId;
    const data: UpdateGroupImageDto = message?.value;
    return await this.groupsService.updateGroupImage(data);
  }

}

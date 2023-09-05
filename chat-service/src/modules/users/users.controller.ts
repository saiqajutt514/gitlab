import { Controller, HttpStatus, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import {
  UPSERT_CHAT_USER,
  CREATE_CHAT_USER,
  UPDATE_CHAT_USER,
  VERIFY_CHAT_USER,
  GET_CHAT_USER_DETAIL,
  GET_ALL_CHAT_USERS,
  GET_CHAT_USER_LAST_SEEN,
  BLOCK_CHAT_USER,
  UNBLOCK_CHAT_USER,
  UPDATE_CHAT_USER_LAST_SEEN,
  GET_BLOCKED_USERS,
  MUTE_UNMUTE_CONVERSATION,
  CHAT_USER_LIST,
  CHAT_USER_DETAIL,
  CHAT_USER_UPDATE_STATUS,
  GET_CHAT_USER_LAST_SEEN_AND_LOC,
} from 'src/constants/kafka-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';

import {
  CreateUserDto,
  UpdateUserDto,
  MuteUnmuteConversationDto,
  ChatUserStatusDto,
} from './dto/users.dto';
import { BlockUnblockDto } from './dto/blocked-users.dto';
import { UsersService } from './users.service';
import { UserListingParams } from './interfaces/users.interface';

@Controller('users')
export class UsersController {
  private readonly logger = new LoggerHandler(
    UsersController.name,
  ).getInstance();

  constructor(private usersService: UsersService) {}

  @EventPattern(UPSERT_CHAT_USER)
  async createChatUser(@Payload() message) {
    this.logger.log(
      `kafka::chat::${UPSERT_CHAT_USER}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    // message = JSON.parse(message);
    // const arabicData = message.value;

    message.value['englishName'] = message?.otherDetails?.EnglishName || '';
    message.value['arabicName'] = message?.otherDetails?.ArabicName || '';
    message.value['dateOfBirth'] = '';
    // if(arabicData?.ArabicFirstName) {
    //   message.value['firstNameArabic'] = arabicData?.ArabicFirstName;
    // }
    // if(arabicData?.ArabicFamilyName) {
    //   message.value['lastNameArabic'] = arabicData?.ArabicFamilyName;
    // }
    const data: CreateUserDto = message.value;
    if (data.userId) {
      this.logger.log(
        `kafka::chat::${UPSERT_CHAT_USER}::recv -> ${data.userId}`,
      );
      const response: any = await this.usersService.findByUserId(data?.userId);
      if (response.statusCode == HttpStatus.OK) {
        return await this.usersService.update(response.data._id, data);
      } else if (response.statusCode == HttpStatus.NOT_FOUND) {
        return await this.usersService.create(data);
      }
    }
  }

  @MessagePattern(CREATE_CHAT_USER)
  async create(@Payload() message) {
    this.logger.log(
      `kafka::chat::${CREATE_CHAT_USER}::recv -> ${message.value}`,
    );
    const data: CreateUserDto = message.value;
    return await this.usersService.create(data);
  }

  @MessagePattern(UPDATE_CHAT_USER)
  async update(@Payload() message) {
    this.logger.log(
      `kafka::chat::${CREATE_CHAT_USER}::recv -> ${message.value}`,
    );
    const id: string = message.value?.id;
    const data: UpdateUserDto = message.value?.data;
    return await this.usersService.update(id, data);
  }

  @MessagePattern(VERIFY_CHAT_USER)
  async findByMobile(@Payload() message) {
    this.logger.log(
      `kafka::chat::${VERIFY_CHAT_USER}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.usersService.findByMobile(
      message.value?.mobileNo,
      message.value?.userId,
    );
  }

  @MessagePattern(GET_CHAT_USER_DETAIL)
  async findByUserId(@Payload() message) {
    this.logger.log(
      `kafka::chat::${GET_CHAT_USER_DETAIL}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const userId: number = message.value?.userId;
    const id: number = message.value?.id;
    let response = await this.usersService.findByUserId(id);
    if (response.statusCode === HttpStatus.OK && id) {
      let data: BlockUnblockDto = {
        userId: userId,
        blockedId: id,
      };
      let userData: any = response.data.toJSON();
      let blockedUser = await this.usersService.checkIsBlocked(data);
      if (blockedUser.statusCode === HttpStatus.OK) {
        if (blockedUser.data) {
          userData['blocked'] = true;
        } else {
          userData['blocked'] = false;
        }
      }
      response.data = userData;
      return response;
    } else {
      return response;
    }
  }

  @MessagePattern(GET_CHAT_USER_LAST_SEEN)
  async getLastSeen(@Payload() message) {
    this.logger.log(
      `kafka::chat::${GET_CHAT_USER_LAST_SEEN}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.usersService.getLastSeen(message.value?.userId);
  }

  @MessagePattern(GET_CHAT_USER_LAST_SEEN_AND_LOC)
  async getuserLiveLocAndStatus(@Payload() message) {
    this.logger.log(
      `kafka::chat::${GET_CHAT_USER_LAST_SEEN}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.usersService.userLiveLocAndStatus(message.value?.userId);
  }

  @MessagePattern(UPDATE_CHAT_USER_LAST_SEEN)
  async updateLastSeen(@Payload() message) {
    this.logger.log(
      `kafka::chat::${UPDATE_CHAT_USER_LAST_SEEN}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.usersService.updateLastSeen(
      message.value?.userId,
      message.value?.onlineStatus,
    );
  }

  @MessagePattern(BLOCK_CHAT_USER)
  async blockUser(@Payload() message) {
    this.logger.log(
      `kafka::chat::${BLOCK_CHAT_USER}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const data: BlockUnblockDto = message.value;
    return await this.usersService.blockUser(data);
  }

  @MessagePattern(UNBLOCK_CHAT_USER)
  async unblockUser(@Payload() message) {
    this.logger.log(
      `kafka::chat::${UNBLOCK_CHAT_USER}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const data: BlockUnblockDto = message.value;
    return await this.usersService.unblockUser(data);
  }

  @MessagePattern(GET_ALL_CHAT_USERS)
  async findAll(@Payload() message) {
    this.logger.log(
      `kafka::chat::${GET_ALL_CHAT_USERS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.usersService.findAll();
  }

  @MessagePattern(GET_BLOCKED_USERS)
  async getBlockedUsers(@Payload() message) {
    this.logger.log(
      `kafka::chat::${GET_BLOCKED_USERS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.usersService.getBlockedUsers(message.value?.userId);
  }

  @MessagePattern(MUTE_UNMUTE_CONVERSATION)
  async muteUnmuteConversation(@Payload() message) {
    this.logger.log(
      `kafka::chat::${MUTE_UNMUTE_CONVERSATION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const data: MuteUnmuteConversationDto = {
      conversationId: message.value?.conversationId,
      userId: message.value?.userId,
      status: message.value?.status,
    };
    return await this.usersService.muteUnmuteConversation(data);
  }

  @MessagePattern(CHAT_USER_LIST)
  async getUsers(@Payload() message) {
    this.logger.log(
      `kafka::chat::${CHAT_USER_LIST}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const params: UserListingParams = message.value;
    return await this.usersService.getUserList(params);
  }

  @MessagePattern(CHAT_USER_UPDATE_STATUS)
  async updateUserStatus(@Payload() message) {
    this.logger.log(
      `kafka::chat::${CHAT_USER_UPDATE_STATUS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const id: string = message.value?.id;
    const data: ChatUserStatusDto = message.value?.data;
    return await this.usersService.updateUserStatus(id, data);
  }
}

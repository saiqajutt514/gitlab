import { Body, Controller, Get, HttpStatus, Param, Post, Patch, Query, Req, UploadedFile, UseInterceptors, UsePipes, ValidationPipe, Delete, Put } from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { errorMessage } from 'src/constants/error-message-constant';

import { VerifyChatUserDto, ConversationDto, DeleteConversationDto, ArchiveUnarchiveDto, ChatPaginationDto, GetMessagesDto, CreateGroupDto, UpdateGroupDto, AddGroupMemberDto, DeleteGroupMemberDto, GroupAdminAddRemoveDto, UpdateGroupImageDto, GroupImageDto, MarkMessagesDto, PresignedUrlDto } from './dto/chat-user.dto';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import { ChatService } from './chat.service';
import { GROUP_MEMBER_TYPE, CHAT_MEDIA_ENUM } from './chat.enum'
import { UploadedFiles } from '@nestjs/common';
@Controller('chat')
export class ChatController {

  constructor(
    private readonly awsS3Service: AwsS3Service,
    private readonly chatService: ChatService
  ) { }

  private readonly logger = new LoggerHandler(ChatController.name).getInstance();

  @Post('start-conversation')
  async verifyChatUser(@Body() body: VerifyChatUserDto, @Req() request) {
    this.logger.log(`[verifyChatUser] -> body -> ${JSON.stringify(body)}`);
    body.userId = request?.user?.id;
    const response = await this.chatService.verifyChatUser(body);
    return ResponseHandler(response);
    // if (response?.statusCode === HttpStatus.OK) {
    //   const params: ConversationDto = {
    //     senderId: request.user?.id,
    //     receiverId: response?.data?.userId
    //   }
    //   const conversationRes = await this.chatService.createConversation(params);
    //   if (conversationRes?.statusCode === HttpStatus.OK) {
    //     response['data']['conversation'] = conversationRes?.data;
    //   }
    //   return ResponseHandler(response);
    // } else {
    //   return ResponseHandler(response);
    // }
  }

  @Get('get-conversations')
  @UsePipes(ValidationPipe)
  async getConversations(@Query() params: ChatPaginationDto, @Req() request) {
    this.logger.log(`[getConversations] -> list -> ${JSON.stringify(params)}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.getConversations(userId, params);
    return ResponseHandler(response);
  }

  @Get('get-archived-conversations')
  @UsePipes(ValidationPipe)
  async getArchivedConversations(@Query() params: ChatPaginationDto, @Req() request) {
    this.logger.log(`[getArchivedConversations] -> list -> ${JSON.stringify(params)}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.getArchivedConversations(userId, params);
    return ResponseHandler(response);
  }

  @Get('get-user-messages/:id')
  @UsePipes(ValidationPipe)
  async getUserMessages(@Param('id') id: number, @Query() params: GetMessagesDto, @Req() request) {
    this.logger.log(`[getUserMessages] -> list -> ${JSON.stringify({ id, params })}`)
    const receiverId: number = id;
    const senderId: number = request.user?.id;
    const response = await this.chatService.getUserMessages({ senderId, receiverId, ...params});
    return ResponseHandler(response);
  }

  @Get('get-user-details/:id')
  @UsePipes(ValidationPipe)
  async getUserDetails(@Param('id') id: number, @Req() request) {
    this.logger.log(`[getUserDetails] -> list -> ${id}`)
    this.logger.log(`[getUserDetails] -> sender -> ${request.user?.id}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.getUserDetails(id, userId);
    return ResponseHandler(response);
  }

  @Get('get-last-seen/:id')
  @UsePipes(ValidationPipe)
  async getUserLastSeen(@Param('id') id: number) {
    this.logger.log(`[getUserLastSeen] -> list -> ${id}`);
    const response = await this.chatService.getUserLastSeen(id);
    return ResponseHandler(response);
  }

  @Post('upload-media-file')
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'mediaFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]))
  // @UseInterceptors(FileInterceptor('mediaFile', {
  //   limits: { fileSize: 1000 * 1024 * 1024 },
  // }))
  async uploadMediaFile(@UploadedFiles() files: { mediaFile?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }, @Body() params : any) {
    this.logger.log(`[uploadMediaFile] -> params -> ${JSON.stringify(params)}`);
    const mediaObject: any = files?.mediaFile;
    const thumbObject: any = files?.thumbnail;

    if (mediaObject[0]?.fieldname === 'mediaFile' || ( thumbObject && thumbObject[0]['fieldname'] === 'thumbnail' )) {

      const mediaName = this.awsS3Service.uploadChatFile({ file: mediaObject[0] });
      const mediaUrl = await this.awsS3Service.getChatMediaUrl({ name: mediaName });

      let previewUrl;
      if( thumbObject && thumbObject[0]['fieldname'] === 'thumbnail' ) {
        const thumbName = this.awsS3Service.uploadChatFile({ file: thumbObject[0] });
        previewUrl = await this.awsS3Service.getChatMediaUrl({ name: thumbName });
      }

      return ResponseHandler({
        statusCode: HttpStatus.OK,
        data: { mediaUrl, previewUrl, ...params }
      });
    } else {
      return ResponseHandler({
        statusCode: HttpStatus.BAD_REQUEST,
        message: errorMessage.SOMETHING_WENT_WRONG
      });
    }
  }

  // Group
  @Post('create-group')
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('groupPhoto', {
    limits: { fileSize: 1000 * 1024 * 1024 },
    // fileFilter: (req, file, cb) => {
    //   if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    //     return cb(new Error('Only image files are allowed!'), false);
    //   }
    //   cb(null, true);
    // }
  }))
  async createGroup(@Body() body: CreateGroupDto, @UploadedFile() file: Express.Multer.File, @Req() request) {
    this.logger.log(`[createGroup] -> param -> ${JSON.stringify(body)}`)
    body.createdBy = request.user?.id;
    body.modifiedBy = request.user?.id;
    body.groupImage = '';

    const mediaObject: any = file;
    if (mediaObject?.fieldname === 'groupPhoto') {
      let mediaName = this.awsS3Service.uploadChatGroupImage({ file: mediaObject });
      body.groupImage = mediaName;
    }

    const data: CreateGroupDto = body;
    const response = await this.chatService.createGroup(data);
    return ResponseHandler(response);
  };

  @Patch('update-group/:id')
  @UsePipes(ValidationPipe)
  async updateGroup(@Param('id') id: string, @Body() body: UpdateGroupDto, @Req() request) {
    this.logger.log(`[updateGroup] -> groupId: ${id} | param: ${JSON.stringify(body)}`)
    const userId: number = request.user?.id;
    const groupId: string = id;
    const data: UpdateGroupDto = body;
    const response = await this.chatService.updateGroup(userId, groupId, data);
    return ResponseHandler(response);
  };

  @Delete('delete-group/:id')
  @UsePipes(ValidationPipe)
  async deleteGroup(@Param('id') id: string, @Req() request) {
    this.logger.log(`[deleteGroup] -> groupId: ${id} | userId: ${request.user?.id}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.deleteGroup(id, userId);
    return ResponseHandler(response);
  };

  @Patch('upload-group-photo/:id')
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('groupPhoto', {
    limits: { fileSize: 1000 * 1024 * 1024 },
    // fileFilter: (req, file, cb) => {
    //   if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    //     return cb(new Error('Only image files are allowed!'), false);
    //   }
    //   cb(null, true);
    // }
  }))
  async uploadGroupPhoto(@Param('id') id: string, @Body() body: UpdateGroupImageDto, @UploadedFile() file: Express.Multer.File, @Req() request) {
    this.logger.log(`[uploadGroupPhoto] -> param: ${JSON.stringify(body)}`)
    const userId: number = request.user?.id;
    body['modifiedBy'] = userId;
    body['groupId'] = id;
    const mediaObject: any = file;
    let groupImageParam: GroupImageDto = { groupImage: '' }
    if (mediaObject?.fieldname === 'groupPhoto') {

      let mediaName = this.awsS3Service.uploadChatGroupImage({ file: mediaObject });
      //let mediaUrl = await this.awsS3Service.getChatGroupImageUrl({ name: mediaName });
      groupImageParam.groupImage = mediaName;
      const response = await this.chatService.updateGroupImage({ ...groupImageParam, ...body });
      return ResponseHandler(response);
    }
    else {
      return ResponseHandler({ statusCode: HttpStatus.BAD_REQUEST, message: errorMessage.SOMETHING_WENT_WRONG });
    }
  }

  @Get('get-group-details/:id')
  @UsePipes(ValidationPipe)
  async getGroupDetail(@Param('id') id: string, @Req() request) {
    this.logger.log(`[getGroupDetail] -> list -> groupId: ${id} | userId: ${request.user?.id}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.getGroupDetail(id, userId);
    return ResponseHandler(response);
  }

  @Patch('add-group-member/:id')
  @UsePipes(ValidationPipe)
  async createGroupMember(@Param('id') id: string, @Body() body: AddGroupMemberDto, @Req() request) {
    this.logger.log(`[createGroupMember] -> param -> ${JSON.stringify(body)}`)
    body.createdBy = request.user?.id;
    body.modifiedBy = request.user?.id;
    body.groupId = id;
    body.memberType = GROUP_MEMBER_TYPE.MEMBER;
    const data: AddGroupMemberDto = body;
    const response = await this.chatService.createGroupMember(data);
    return ResponseHandler(response);
  }

  @Get('get-group-members/:id')
  async getGroupMembers(@Param('id') id: string, @Req() request) {
    this.logger.log(`[getGroupMembers] -> list -> groupId: ${id} | userId: ${request.user?.id}`);
    const userId: number = request.user?.id;
    const response = await this.chatService.getGroupMembers(id, userId);
    return ResponseHandler(response);
  }

  @Patch('delete-group-member/:id')
  @UsePipes(ValidationPipe)
  async deleteGroupMember(@Param('id') id: string, @Body() body: DeleteGroupMemberDto, @Req() request) {
    this.logger.log(`[createGroupMember] -> param -> ${JSON.stringify(body)}`)
    const userId: number = request.user?.id;
    body.groupId = id;
    const response = await this.chatService.deleteGroupMember(userId, body);
    return ResponseHandler(response);
  }

  @Patch('leave-from-group/:id')
  @UsePipes(ValidationPipe)
  async leaveFromGroup(@Param('id') id: string, @Body() body: DeleteGroupMemberDto, @Req() request) {
    this.logger.log(`[leaveFromGroup] -> param -> ${JSON.stringify(body)}`)
    const userId: number = request.user?.id;
    body.groupId = id;
    const response = await this.chatService.deleteGroupMember(userId, body);
    return ResponseHandler(response);
  }

  @Patch('make-group-admin/:id')
  @UsePipes(ValidationPipe)
  async createGroupAdmin(@Param('id') id: string, @Body() body: GroupAdminAddRemoveDto, @Req() request) {
    this.logger.log(`[createGroupAdmin] -> id: ${id} | param : ${JSON.stringify(body)}`)
    const userId: number = request.user?.id;
    body['groupId'] = id;
    body['memberType'] = GROUP_MEMBER_TYPE.ADMIN;
    const response = await this.chatService.updateGroupAdmin(userId, body);
    return ResponseHandler(response);
  }

  @Patch('remove-group-admin/:id')
  @UsePipes(ValidationPipe)
  async removeGroupGroupAdmin(@Param('id') id: string, @Body() body: GroupAdminAddRemoveDto, @Req() request) {
    this.logger.log(`[removeGroupGroupAdmin] id: ${id} -> param -> ${JSON.stringify(body)}`)
    const userId: number = request.user?.id;
    body['groupId'] = id;
    body['memberType'] = GROUP_MEMBER_TYPE.MEMBER;
    const response = await this.chatService.updateGroupAdmin(userId, body);
    return ResponseHandler(response);
  }

  @Get('get-group-messages/:id')
  @UsePipes(ValidationPipe)
  async getGroupMessages(@Param('id') id: string, @Query() params: GetMessagesDto, @Req() request) {
    this.logger.log(`[getGroupMessages] -> list -> ${JSON.stringify({ id, params })}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.getGroupMessages(id, { userId, ...params });
    return ResponseHandler(response);
  }

  @Get('get-blocked-users')
  async getBlockedUsers(@Req() request) {
    this.logger.log(`[getBlockedUsers] -> list -> ${request.user?.id}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.getBlockedUsers(userId);
    return ResponseHandler(response);
  }

  @Patch('delete-all-message/:id')
  async deleteAllMessage(@Param('id') id: string, @Body() params: DeleteConversationDto, @Req() request) {
    this.logger.log(`[deleteAllMessage] -> list -> ${id} | ${JSON.stringify(params)}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.deleteAllMessage(userId, id, params?.conversation);
    return ResponseHandler(response);
  }

  @Post('mark-messages')
  @UsePipes(ValidationPipe)
  async markMessages(@Body() body: MarkMessagesDto, @Req() request) {
    this.logger.log(`[markMessages] -> read/unread -> ${JSON.stringify(body)}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.markMessages(userId, body);
    return ResponseHandler(response);
  }

  @Patch('archive-unarchive-chat/:id')
  async archiveUnarchiveChat(@Param('id') conversationId: string, @Body() params: ArchiveUnarchiveDto, @Req() request) {
    this.logger.log(`[archiveUnarchiveChat] -> list -> ${conversationId} | ${JSON.stringify(params)}`)
    const userId: number = request.user?.id;
    const isArchived: boolean = params?.isArchived;
    const response = await this.chatService.archiveUnarchiveChat(userId, conversationId, isArchived);
    return ResponseHandler(response);
  }

  @Get('get-unread-messages-count')
  @UsePipes(ValidationPipe)
  async getUnreadMessages(@Param('id') id: number, @Query() params: GetMessagesDto, @Req() request) {
    this.logger.log(`[getUnreadMessages] -> list -> ${JSON.stringify({ id, params })}`)
    const userId: number = request.user?.id;
    const response = await this.chatService.getUnreadMessageCount(userId);
    return ResponseHandler(response);
  }

  @Post('get-presigned-url')
  @UsePipes(ValidationPipe)
  async getPresignedUrl(@Body() params: PresignedUrlDto) {
    const { presignedUrl, accessUrl } = await this.awsS3Service.getChatPresignedUrl({ name: params?.filename, type: CHAT_MEDIA_ENUM.CHAT_MEDIA  });
    let responseOjb = {
      presignedUrl,
      accessUrl,
      params
    };
    if(params?.thumbnail) {
      const thumbPresignedRes = await this.awsS3Service.getChatPresignedUrl({ name: params?.thumbnail, type:  CHAT_MEDIA_ENUM.CHAT_THUMB  });
      responseOjb['thumbPresignedUrl'] = thumbPresignedRes.presignedUrl;
      responseOjb['thumbAccessUrl'] = thumbPresignedRes.accessUrl;
    }
    return ResponseHandler({ statusCode: HttpStatus.OK, data: responseOjb });
  }

  @Post('upload-presigned')
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('mediaFile', {
  }))
  async uploadPresigned(@Body() body, @UploadedFile() file: Express.Multer.File, @Req() request) {
    this.logger.log(`[uploadGroupPhoto] -> param: ${JSON.stringify(body)}`)
    const mediaObject: any = file;
    const url = this.awsS3Service.uploadSigned({ file: mediaObject, presignedUrl: body.presignedUrl });
    return ResponseHandler({statusCode: HttpStatus.OK, data: { url: url}});
  }
}

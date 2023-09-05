import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, ArrayMinSize, ArrayMaxSize, IsBoolean, IsEnum } from "class-validator";
import { USER_STATUS } from "../chat.enum";

export class VerifyChatUserDto {
    @IsNotEmpty()
    @IsString()
    mobileNo: string;

    @IsOptional()
    userId?: number
}

export class ConversationDto {
    @IsNotEmpty()
    @IsNumber()
    senderId: number

    @IsNotEmpty()
    @IsNumber()
    receiverId: number
}

export class ChatPaginationDto {
    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number = 50;
}

export class UserIdDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;
}

export class SenderIdDto {
    @IsNotEmpty()
    @IsNumber()
    senderId: number;
}

export class ReceiverIdDto {
    @IsNotEmpty()
    @IsNumber()
    receiverId: number;
}

export class GetMessagesDto {
    @IsOptional()
    @IsString()
    lastMessageId?: string;
}

export class CreateGroupDto {
    @IsNotEmpty()
    @IsString()
    groupTitle: string

    @ArrayMinSize(1)
    @ArrayMaxSize(100) // TODO: Replace with Admin Settings
    memberIds: []

    @IsOptional()
    @IsString()
    groupImage: string

    @IsOptional()
    @IsString()
    description: string

    @IsOptional()
    @IsNumber()
    createdBy: number

    @IsOptional()
    @IsNumber()
    modifiedBy: number
}

export class UpdateGroupDto {
    @IsNotEmpty()
    @IsString()
    groupTitle: string

    @IsOptional()
    @IsString()
    description: string
}

export class AddGroupMemberDto {
    @IsOptional()
    @IsString()
    groupId?: string;

    @ArrayMinSize(1)
    @ArrayMaxSize(100) // TODO: Replace with Admin Settings
    memberIds: []

    @IsOptional()
    @IsNumber()
    memberType?: number;

    @IsOptional()
    @IsNumber()
    createdBy: number;

    @IsOptional()
    @IsNumber()
    modifiedBy: number;
}

export class DeleteGroupMemberDto {
    @IsOptional()
    @IsString()
    groupId?: string;

    @IsNotEmpty()
    @IsNumber()
    memberId: number;
}

export class GroupAdminAddRemoveDto {

    @IsNotEmpty()
    @IsNumber()
    memberId: number;

    @IsOptional()
    @IsNumber()
    memberType?: number;
}

export class UpdateGroupImageDto {
    @IsOptional()
    @IsString()
    groupId?: string;

    @IsString()
    @IsOptional()
    modifiedBy: number;
}

export class GroupImageDto {
    @IsString()
    @IsOptional()
    groupImage: string;
}

export class MarkMessagesDto {
    @IsOptional()
    @IsString()
    groupId?: string;

    @IsOptional()
    @IsString()
    conversationId?: string;
}

export class PresignedUrlDto {

    @IsNotEmpty()
    @IsString()
    filename: string;

    @IsOptional()
    @IsString()
    thumbnail?: string;

    @IsOptional()
    @IsString()
    mediaIdentifier?: string;
}

export class DeleteConversationDto {
    @IsBoolean()
    conversation: boolean;
}

export class ArchiveUnarchiveDto {
    @IsBoolean()
    isArchived: boolean;
}
export class ChatUserStatusDto {
    @IsNotEmpty()
    @IsEnum(USER_STATUS)
    status: USER_STATUS

    @IsNotEmpty()
    @IsString()
    reason: string
}
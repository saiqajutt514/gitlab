import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, ArrayMinSize, ArrayMaxSize, Min, Max } from 'class-validator';
import { GROUP_MEMBER_TYPE } from '../group.enum';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  groupTitle: string

  @IsNotEmpty()
  @IsString()
  groupImage: string

  @IsOptional()
  @IsString()
  description: string

  @IsNotEmpty()
  @IsNumber()
  createdBy: number

}

export class UpdateGroupDto {
  @IsNotEmpty()
  @IsString()
  groupTitle: string

  @IsOptional()
  @IsString()
  description: string

  @IsNotEmpty()
  @IsNumber()
  modifiedBy: number

}

export class CreateGroupMemberDto {

  @IsNotEmpty()
  @IsString()
  groupId: string;

  @IsOptional()
  memberIds?: []

  @IsOptional()
  memberId?: number

  @IsNotEmpty()
  @IsEnum(GROUP_MEMBER_TYPE)
  memberType: GROUP_MEMBER_TYPE = GROUP_MEMBER_TYPE.MEMBER;

  @IsOptional()
  @IsNumber()
  createdBy: number;

  @IsOptional()
  @IsNumber()
  modifiedBy: number;
}

export class DeleteGroupMemberDto {
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @IsNotEmpty()
  @IsNumber()
  memberId: number;
}

export class UpdateGroupAdminDto {
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @IsNotEmpty()
  @IsNumber()
  memberId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(2)
  memberType: number;
}

export class UpdateGroupImageDto {
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @IsNotEmpty()
  @IsNumber()
  modifiedBy: number;

  @IsString()
  groupImage: string;
}

export class StoreGroupMemberToResiDto {
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @IsOptional()
  members?: number[]
}
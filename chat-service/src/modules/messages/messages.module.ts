import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { UsersService } from '../users/users.service';
import { Users, UsersSchema } from '../users/users.schema';
import { Messages, MessagesSchema } from './messages.schema';
import { Conversations, ConversationsSchema } from './conversations.schema';
import { BlockedUsers, BlockedUsersSchema } from '../users/blocked-users.schema';
import { Groups, GroupsSchema } from '../groups/groups.schema';
import { GroupMembers, GroupMembersSchema } from '../groups/group-members.schema';
import { GroupsService } from '../groups/groups.service';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import { RedisHandler } from '../../helpers/redis-handler';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UsersSchema },
      { name: BlockedUsers.name, schema: BlockedUsersSchema },
      { name: Messages.name, schema: MessagesSchema },
      { name: Conversations.name, schema: ConversationsSchema },
      { name: Groups.name, schema: GroupsSchema },
      { name: GroupMembers.name, schema: GroupMembersSchema }
    ])
  ],
  controllers: [MessagesController],
  providers: [MessagesService, UsersService, GroupsService, AwsS3Service, RedisHandler],
  exports: [MessagesService, GroupsService]
})
export class MessagesModule {}

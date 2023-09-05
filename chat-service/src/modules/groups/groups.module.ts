import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GroupsService } from './groups.service';
import { UsersService } from '../users/users.service';
import { Users, UsersSchema } from '../users/users.schema';
import { BlockedUsers, BlockedUsersSchema } from '../users/blocked-users.schema';
import { GroupsController } from './groups.controller';
import { Groups, GroupsSchema } from './groups.schema';
import { GroupMembers, GroupMembersSchema } from './group-members.schema';
import { Conversations, ConversationsSchema } from '../messages/conversations.schema';
import { Messages, MessagesSchema } from '../messages/messages.schema';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import { RedisHandler } from '../../helpers/redis-handler';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Groups.name, schema: GroupsSchema },
      { name: GroupMembers.name, schema: GroupMembersSchema },
      { name: Users.name, schema: UsersSchema },
      { name: BlockedUsers.name, schema: BlockedUsersSchema },
      { name: Conversations.name, schema: ConversationsSchema },
      { name: Messages.name, schema: MessagesSchema }
    ])
  ],
  providers: [GroupsService, UsersService, AwsS3Service, RedisHandler],
  controllers: [GroupsController],
  exports: [GroupsService, UsersService]
})
export class GroupsModule {}

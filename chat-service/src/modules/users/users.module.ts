import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users, UsersSchema } from './users.schema';
import { BlockedUsers, BlockedUsersSchema } from './blocked-users.schema';
import { RedisHandler } from '../../helpers/redis-handler';

import { Conversations, ConversationsSchema } from '../messages/conversations.schema';
import { Groups, GroupsSchema } from '../groups/groups.schema';
import { AwsS3Service } from 'src/helpers/aws-s3-service';
import { Messages, MessagesSchema } from '../messages/messages.schema';
@Module({
  imports: [MongooseModule.forFeature([
    { name: Users.name, schema: UsersSchema },
    { name: BlockedUsers.name, schema: BlockedUsersSchema },
    { name: Conversations.name, schema: ConversationsSchema },
    { name: Groups.name, schema: GroupsSchema },
    { name: Messages.name, schema: MessagesSchema }
  ])],
  controllers: [UsersController],
  providers: [UsersService, RedisHandler, AwsS3Service],
  exports: [UsersService]
})
export class UsersModule {}

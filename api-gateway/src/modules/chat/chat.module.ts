import { Module } from '@nestjs/common';

import { AwsS3Service } from '../../helpers/aws-s3-service';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, AwsS3Service],
  exports: [ChatService, AwsS3Service]
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppsocketHandler } from './appsocket.handler';
import { AppSocketClient } from './appsocket.client';
import { MessagesModule } from 'src/modules/messages/messages.module';
@Module({
  imports: [MessagesModule],
  controllers: [AppController],
  providers: [AppService, AppsocketHandler, AppSocketClient],
})
export class AppModule {}

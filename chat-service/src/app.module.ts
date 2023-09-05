import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from "nestjs-pino";

require('dotenv').config();

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './modules/users/users.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MessagesModule } from './modules/messages/messages.module';

// console.log("in app module", `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?authSource=admin`);
console.log("in app module", `mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}?authSource=admin`);

@Module({
  imports: [
    // MongooseModule.forRoot(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?authSource=admin`, {
    MongooseModule.forRoot(`mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}?authSource=admin`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    }),
    LoggerModule.forRoot({
      pinoHttp:{
        name:'chat-service',
        level:'debug',
        formatters: {
          level: label => {
            return { level: label };
          }
        }
      }
    }),
    UsersModule,
    MessagesModule,
    GroupsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { typeOrmConfig } from 'config/typeOrmConfig';
import { ConfigModule } from '@nestjs/config'
import appConfiguration from 'config/appConfig';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReviewModule } from './review/review.module';
import { QuestionModule } from './question/question.module';
import { LoggerModule } from 'nestjs-pino';

console.log("in app module", typeOrmConfig)
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ConfigModule.forRoot({
      load: [appConfiguration],
    }),
    ReviewModule,
    QuestionModule,
    LoggerModule.forRoot({
      pinoHttp:{
        name:'reviews',
        level:'debug',
        formatters: {
          level: label => {
            return { level: label };
          }
        }
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

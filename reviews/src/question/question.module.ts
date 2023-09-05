import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { QuestionRepository } from './question.repository';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionRepository])],
  controllers: [QuestionController],
  providers: [QuestionService]
})
export class QuestionModule { }

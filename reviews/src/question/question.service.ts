import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionEntity } from './entities/question.entity';
import { QuestionRepository } from './question.repository';

@Injectable()
export class QuestionService {

  constructor(
    @InjectRepository(QuestionRepository)
    private questionRepository: QuestionRepository,
  ) {
  }

  create(createQuestionDto: CreateQuestionDto): Promise<QuestionEntity> {
    const question = this.questionRepository.create(createQuestionDto);
    return this.questionRepository.save(question);
  }

  findAll() {
    return this.questionRepository.createQueryBuilder().getManyAndCount();
  }

  findOne(id: number) {
    return this.questionRepository.findOne(id)
  }

  update(id: number, updateQuestionDto: UpdateQuestionDto) {
    return this.questionRepository.update(id, updateQuestionDto);
  }

  remove(id: number) {
    return this.questionRepository.delete(id)
  }
}

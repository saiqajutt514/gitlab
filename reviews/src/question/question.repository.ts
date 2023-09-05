import { EntityRepository, QueryRunner, SelectQueryBuilder } from 'typeorm';

import { BaseAbstractRepository } from 'transportation-common'
import { QuestionEntity } from './entities/question.entity';


@EntityRepository(QuestionEntity)
export class QuestionRepository extends BaseAbstractRepository<QuestionEntity> {

}
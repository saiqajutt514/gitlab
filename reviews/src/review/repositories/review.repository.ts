import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'
import { ReviewEntity } from '../entities/review.entity';

@EntityRepository(ReviewEntity)
export class ReviewRepository extends BaseAbstractRepository<ReviewEntity> {

}
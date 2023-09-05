import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { UserRatingMetaEntity } from '../entities/ratingMeta.entity';

@EntityRepository(UserRatingMetaEntity)
export class UserRatingMetaRepository extends BaseAbstractRepository<UserRatingMetaEntity> {

}
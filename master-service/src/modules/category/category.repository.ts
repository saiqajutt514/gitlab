import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { CategoryEntity } from './category.entity';

@EntityRepository(CategoryEntity)
export class CategoryRepository extends BaseAbstractRepository<CategoryEntity> {

}

import { PagesEntity } from './../entities/pages.entity';
import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

@EntityRepository(PagesEntity)
export class PagesRepository extends BaseAbstractRepository<PagesEntity> {

}
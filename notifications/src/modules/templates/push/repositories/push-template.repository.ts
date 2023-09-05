import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { PushTemplateEntity } from '../entities/push-template.entity';

@EntityRepository(PushTemplateEntity)
export class PushTemplateRepository extends BaseAbstractRepository<PushTemplateEntity> {

}
import { EntityRepository, Repository } from 'typeorm';

import { BaseAbstractRepository } from 'transportation-common'

import { RejectedReasonEntity } from '../entities/rejected-reason.entity';

@EntityRepository(RejectedReasonEntity)
export class RejectedReasonRepository extends BaseAbstractRepository<RejectedReasonEntity> {

}
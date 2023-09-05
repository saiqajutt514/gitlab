import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { AuditLogEntity } from './audit-log.entity';

@EntityRepository(AuditLogEntity)
export class AuditLogRepository extends BaseAbstractRepository<AuditLogEntity> {

}
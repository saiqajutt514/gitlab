import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { PermissionEntity } from './permission.entity';

@EntityRepository(PermissionEntity)
export class PermissionRepository extends BaseAbstractRepository<PermissionEntity> {

}

import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { RoleEntity } from './role.entity';

@EntityRepository(RoleEntity)
export class RoleRepository extends BaseAbstractRepository<RoleEntity> {

}

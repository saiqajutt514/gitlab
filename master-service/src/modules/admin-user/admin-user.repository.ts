import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { AdminUserEntity } from './admin-user.entity';

@EntityRepository(AdminUserEntity)
export class AdminUserRepository extends BaseAbstractRepository<AdminUserEntity> {

}
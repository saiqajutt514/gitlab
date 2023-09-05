import { NotifyUserEntity } from './../entities/notify-user.entity';
import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

@EntityRepository(NotifyUserEntity)
export class NotifyUserRepository extends BaseAbstractRepository<NotifyUserEntity> {

}
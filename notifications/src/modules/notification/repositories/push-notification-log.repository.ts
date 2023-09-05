import { EntityRepository } from 'typeorm';

import { BaseAbstractRepository } from 'transportation-common'

import { PushNotificationLogEntity } from '../entities/push-notification-log.entity';

@EntityRepository(PushNotificationLogEntity)
export class PushNotificationLogRepository extends BaseAbstractRepository<PushNotificationLogEntity> {

}
import { EntityRepository } from 'typeorm';

import { BaseAbstractRepository } from 'transportation-common'

import { SmsNotificationLogEntity } from '../entities/sms-notification-log.entity';

@EntityRepository(SmsNotificationLogEntity)
export class SmsNotificationLogRepository extends BaseAbstractRepository<SmsNotificationLogEntity> {

}
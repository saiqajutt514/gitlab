import { EntityRepository } from 'typeorm';

import { BaseAbstractRepository } from 'transportation-common'

import { EmailNotificationLogEntity } from '../entities/email-notification-log.entity';

@EntityRepository(EmailNotificationLogEntity)
export class EmailNotificationLogRepository extends BaseAbstractRepository<EmailNotificationLogEntity> {

}
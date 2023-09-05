import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { SmsTemplateEntity } from '../entities/sms-template.entity';

@EntityRepository(SmsTemplateEntity)
export class SmsTemplateRepository extends BaseAbstractRepository<SmsTemplateEntity> {

}
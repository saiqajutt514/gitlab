import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { EmailTemplateEntity } from '../entities/email-template.entity';

@EntityRepository(EmailTemplateEntity)
export class EmailTemplateRepository extends BaseAbstractRepository<EmailTemplateEntity> {

}
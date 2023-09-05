import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { SettingEntity } from '../entities/setting.entity';

@EntityRepository(SettingEntity)
export class SettingRepository extends BaseAbstractRepository<SettingEntity> {

}
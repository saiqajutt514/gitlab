import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common';
import { VIEntity } from '../entities/rar.entity';

//repository for ride a ride vehicle inventory

@EntityRepository(VIEntity)
export class VIRepo extends BaseAbstractRepository<VIEntity> {}

import { EntityRepository } from 'typeorm';

import { BaseAbstractRepository } from 'transportation-common'

import { PromoCodesEntity } from '../entities/coupon.entity';

@EntityRepository(PromoCodesEntity)
export class PromoCodesRepository extends BaseAbstractRepository<PromoCodesEntity> {

}
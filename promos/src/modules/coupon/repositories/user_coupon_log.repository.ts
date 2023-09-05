import { EntityRepository } from 'typeorm';

import { BaseAbstractRepository } from 'transportation-common'

import { UserCouponLog } from '../entities/user_coupon_log.entity';

@EntityRepository(UserCouponLog)
export class UserCouponLogRepository extends BaseAbstractRepository<UserCouponLog> {

}
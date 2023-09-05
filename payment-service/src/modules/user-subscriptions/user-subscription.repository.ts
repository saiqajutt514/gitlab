import { BaseAbstractRepository } from "transportation-common";
import { EntityRepository } from 'typeorm';

import { UserSubscriptionsEntity } from "./entities/user-subscription.entity";

@EntityRepository(UserSubscriptionsEntity)
export class UserSubscriptionRepository extends BaseAbstractRepository<UserSubscriptionsEntity> {

}
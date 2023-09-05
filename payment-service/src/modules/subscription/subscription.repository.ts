import { BaseAbstractRepository } from "transportation-common";
import { EntityRepository } from 'typeorm';

import { SubscriptionEntity } from "./entities/subscription.entity";

@EntityRepository(SubscriptionEntity)
export class SubscriptionRepository extends BaseAbstractRepository<SubscriptionEntity> {

}
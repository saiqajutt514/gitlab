import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common';
import { CustomerAppUsage } from '../entities/customer_app_usage.entity';

@EntityRepository(CustomerAppUsage)
export class CustomerAPPUsageRepository extends BaseAbstractRepository<CustomerAppUsage> {}

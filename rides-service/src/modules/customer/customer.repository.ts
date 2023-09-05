import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

import { CustomerEntity } from './entities/customer.entity';

@EntityRepository(CustomerEntity)
export class CustomerRepository extends BaseAbstractRepository<CustomerEntity> {

}
import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common';

import { CustomerLocations } from './entities/customer_locations.entity';

@EntityRepository(CustomerLocations)
export class CustomerLocationsRepository extends BaseAbstractRepository<CustomerLocations> {}

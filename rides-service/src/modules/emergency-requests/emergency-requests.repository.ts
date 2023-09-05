import { BaseAbstractRepository } from "transportation-common";
import { EntityRepository } from 'typeorm';

import { EmergencyRequestsEntity } from './entities/emergency-requests.entity'

@EntityRepository(EmergencyRequestsEntity)
export class EmergencyRequestsRepository extends BaseAbstractRepository<EmergencyRequestsEntity> {

}

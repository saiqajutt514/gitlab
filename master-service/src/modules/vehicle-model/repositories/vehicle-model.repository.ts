import { VehicleModelEntity } from './../entities/vehicle-model.entity';
import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

@EntityRepository(VehicleModelEntity)
export class VehicleModelRepository extends BaseAbstractRepository<VehicleModelEntity> {

}
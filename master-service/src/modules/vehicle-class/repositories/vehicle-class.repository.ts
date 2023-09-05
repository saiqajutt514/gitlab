import { VehicleClassEntity } from './../entities/vehicle-class.entity';
import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

@EntityRepository(VehicleClassEntity)
export class VehicleClassRepository extends BaseAbstractRepository<VehicleClassEntity> {

}
import { VehicleMakerEntity } from './../entities/vehicle-maker.entity';
import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common'

@EntityRepository(VehicleMakerEntity)
export class VehicleMakerRepository extends BaseAbstractRepository<VehicleMakerEntity> {

}
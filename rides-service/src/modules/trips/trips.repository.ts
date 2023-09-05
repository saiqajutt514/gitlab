import { BaseAbstractRepository } from "transportation-common";
import { EntityRepository } from 'typeorm';

import { TripsEntity } from "./entities/trips.entity";

@EntityRepository(TripsEntity)
export class TripsRepository extends BaseAbstractRepository<TripsEntity> {
    
}
import { EntityRepository } from "typeorm";
import { BaseAbstractRepository } from "transportation-common";

import { VehicleEntity } from "./entities/vehicle.entity";

@EntityRepository(VehicleEntity)
export class VehicleRepository extends BaseAbstractRepository<VehicleEntity> {}

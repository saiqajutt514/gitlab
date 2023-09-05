import { EntityRepository } from "typeorm";
import { BaseAbstractRepository } from "transportation-common";

import { CarInfoEntity } from "./entities/car-info.entity";

@EntityRepository(CarInfoEntity)
export class CarInfoRepository extends BaseAbstractRepository<CarInfoEntity> {}

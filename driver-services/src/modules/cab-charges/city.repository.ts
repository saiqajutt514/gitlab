import { EntityRepository } from "typeorm";
import { BaseAbstractRepository } from "transportation-common";

import { CityEntity } from "./entities/city.entity";

@EntityRepository(CityEntity)
export class CityRepository extends BaseAbstractRepository<CityEntity> {}

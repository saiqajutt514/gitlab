import { EntityRepository } from "typeorm";
import { BaseAbstractRepository } from "transportation-common";

import { CabTypeEntity } from "./entities/cab-type.entity";

@EntityRepository(CabTypeEntity)
export class CabTypeRepository extends BaseAbstractRepository<CabTypeEntity> {}

import { EntityRepository } from "typeorm";
import { BaseAbstractRepository } from "transportation-common";

import { CabChargesEntity } from "./entities/cab-charges.entity";

@EntityRepository(CabChargesEntity)
export class CabChargesRepository extends BaseAbstractRepository<CabChargesEntity> {}

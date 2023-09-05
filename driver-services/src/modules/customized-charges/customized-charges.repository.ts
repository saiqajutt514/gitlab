import { BaseAbstractRepository } from "transportation-common";
import { EntityRepository } from "typeorm";
import { CustomizedChargesEntity } from "./customized-charges.entity";

@EntityRepository(CustomizedChargesEntity)
export class CustomizedChargesRepository extends BaseAbstractRepository<CustomizedChargesEntity> {}

import { BaseAbstractRepository } from "transportation-common";
import { EntityRepository } from 'typeorm';
import { RemainingChargesEntity } from "./entities/remaining-charges.entity";

@EntityRepository(RemainingChargesEntity)
export class RemainingChargesRepository extends BaseAbstractRepository<RemainingChargesEntity> {

}
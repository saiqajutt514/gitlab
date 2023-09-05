import { BaseAbstractRepository } from "transportation-common";
import { EntityRepository } from 'typeorm';

import { TransactionEntity } from "./entities/transaction.entity";

@EntityRepository(TransactionEntity)
export class TransactionRepository extends BaseAbstractRepository<TransactionEntity> {

}
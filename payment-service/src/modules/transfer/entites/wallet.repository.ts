import { BaseAbstractRepository } from 'transportation-common';
import { EntityRepository } from 'typeorm';

// import { TransactionEntity } from "./entities/transaction.entity";
import { WalletEntity } from './wallet.entity';

@EntityRepository(WalletEntity)
export class WalletRepository extends BaseAbstractRepository<WalletEntity> {}

import { Module } from '@nestjs/common';
import { AlinmaB2BService } from './alinma-b2-b.service';
import { AlinmaB2BController } from './alinma-b2-b.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { alinmaHistoryEntity } from './entities/alinma-history.entity';
import { alinmaTransactionsEntity } from './entities/alinma-trasactions.entity';
import { IbanService } from '../iban/iban.service';
import { IbanModule } from '../iban/iban.module';
import { IbanEntity } from '../iban/entities/iban.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      alinmaHistoryEntity,
      alinmaTransactionsEntity,
      IbanEntity,
    ]),
  ],
  controllers: [AlinmaB2BController],
  providers: [AlinmaB2BService, IbanService],
  exports: [AlinmaB2BService],
})
export class AlinmaB2BModule {}

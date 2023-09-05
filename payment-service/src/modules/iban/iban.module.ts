import { Module } from '@nestjs/common';
import { IbanService } from './iban.service';
import { IbanController } from './iban.controller';
import { IbanEntity } from './entities/iban.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([IbanEntity])],
  controllers: [IbanController],
  providers: [IbanService],
  exports: [IbanService],
})
export class IbanModule {}

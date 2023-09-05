import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RejectedReasonService } from './rejected-reason.service';
import { RejectedReasonController } from './rejected-reason.controller';
import { RejectedReasonRepository } from './repositories/rejected-reason.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RejectedReasonRepository])],
  controllers: [RejectedReasonController],
  providers: [RejectedReasonService],
  exports: [RejectedReasonService],
})
export class RejectedReasonModule { }

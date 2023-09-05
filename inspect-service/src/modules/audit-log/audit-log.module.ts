import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuditLogRepository } from './audit-log.repository';


@Module({
  imports: [TypeOrmModule.forFeature([AuditLogRepository])],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService]
})
export class AuditLogModule {}

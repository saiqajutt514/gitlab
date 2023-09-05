import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { CREATE_AUDIT_LOG, GET_AUDIT_LOG } from 'src/constants/kafka-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';

import { ListSearchSortDto } from './interfaces/audit-log.interface';
import { CreateAuditLogDto } from './dto/audit-log.dto';
import { AuditLogService } from './audit-log.service';

@Controller('audit-log')
export class AuditLogController {
  private readonly logger = new LoggerHandler(AuditLogController.name).getInstance();
  constructor(private auditLogService: AuditLogService) { }

  @EventPattern(CREATE_AUDIT_LOG)
  async createAuditLog(@Payload() message) {
    this.logger.log(`kafka::captain::${CREATE_AUDIT_LOG}::recv -> ${JSON.stringify(message.value)}`);
    const data: CreateAuditLogDto = message.value
    return await this.auditLogService.create(data);
  }

  @MessagePattern(GET_AUDIT_LOG)
  async getAuditLog(@Payload() message) {
    this.logger.log(`kafka::captain::${GET_AUDIT_LOG}::recv -> ${JSON.stringify(message.value)}`);
    const criteria: ListSearchSortDto = message?.value;
    return await this.auditLogService.findAll(criteria);
  }

}

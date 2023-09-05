import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { errorMessage } from 'src/constants/error-message-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseData } from 'src/helpers/responseHandler';
import { getIsoDateTime } from 'src/utils/get-timestamp';
import { AuditLogListSort, SettingsSort, CaptainStatusSort, ChatUserStatusSort } from './audit-log.enum';
import { AuditLogRepository } from './audit-log.repository';
import { CreateAuditLogDto } from './dto/audit-log.dto';
import { ListSearchSortDto } from './interfaces/audit-log.interface';

@Injectable()
export class AuditLogService {

  private readonly logger = new LoggerHandler(AuditLogService.name).getInstance();

  constructor(
    @InjectRepository(AuditLogRepository)
    private auditLogRepository: AuditLogRepository
  ) { }

  protected auditQryInstance;

  async create(params: CreateAuditLogDto) {
    try {
      // if(params?.oldValues) {
      //   params.oldValues = JSON.stringify(params?.oldValues);
      // }
      // if(params?.newValues) {
      //   params.newValues = JSON.stringify(params?.newValues);
      // }
      params.oldValues = params?.oldValues || {};
      params.newValues = params?.newValues || {};
      const data = this.auditLogRepository.create(params);
      this.logger.log(`create -> ${JSON.stringify(data)}`);
      await this.auditLogRepository.save(data);
      return ResponseData.success(data);
    } catch (err) {
      this.logger.log(`create -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findAll(params: ListSearchSortDto) {
    try {
      this.auditQryInstance = this.auditLogRepository.createQueryBuilder("audit_log");
      //Admin Filters
      if (params?.filters?.moduleName) {
        this.auditQryInstance.andWhere("audit_log.moduleName = :moduleName", { moduleName: params?.filters?.moduleName });
      }
      if (params?.filters?.entityName) {
        this.auditQryInstance.andWhere("audit_log.entityName = :entityName", { entityName: params?.filters?.entityName })
      }
      if (params?.filters?.entityId) {
        this.auditQryInstance.andWhere("audit_log.entityId = :entityId", { entityId: params?.filters?.entityId })
      }
      if (params?.filters?.actionType) {
        this.auditQryInstance.andWhere("audit_log.actionType = :actionType", { actionType: params?.filters?.actionType })
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        this.auditQryInstance.andWhere("audit_log.createdAt >= :fromDate", { fromDate })
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(new Date(new Date(params?.filters?.createdAt[1]).setUTCHours(23, 59, 59, 999)));
        this.auditQryInstance.andWhere("audit_log.createdAt <= :toDate", { toDate })
      }

      if (params?.filters?.entityName === 'chat-user-status') {
        return await this.getChatUserStatusLog(params);
      } else if (params?.filters?.entityName === 'captain-status') {
        return await this.getCaptainStatusLog(params);
      } else {
        return await this.getSettingsLog(params);
      }
    } catch (err) {
      this.logger.error("[findAll] error " + JSON.stringify(err.message));
      return ResponseData.error(HttpStatus.BAD_REQUEST, err.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getSettingsLog(params: ListSearchSortDto) {
    try {
      // Settings Filters
      if (typeof params?.filters?.setting === "number") {
        this.auditQryInstance.andWhere("JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.category')) = :setting", { setting: params?.filters?.setting })
      } else {
        this.auditQryInstance.andWhere("JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.category')) != :setting", { setting: 5 }) //value refers to setting.enum of admin service
      }
      if (params?.filters?.subSetting) {
        this.auditQryInstance.andWhere("JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.name')) LIKE :subSetting", { subSetting: `${params?.filters?.subSetting}%` })
      }
      if (params?.filters?.subCategory) {
        this.auditQryInstance.andWhere("JSON_UNQUOTE(JSON_EXTRACT(audit_log.oldValues, '$.subCategory')) LIKE :subCategory", { subCategory: `${params?.filters?.subCategory}%` })
      }
      if (params?.filters?.oldValue) {
        this.auditQryInstance.andWhere("JSON_UNQUOTE(JSON_EXTRACT(audit_log.oldValues, '$.value')) = :oldValue", { oldValue: params?.filters?.oldValue })
      }
      if (params?.filters?.newValue) {
        this.auditQryInstance.andWhere("JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.value')) = :newValue", { newValue: params?.filters?.newValue })
      }
      const settingSort = { ...AuditLogListSort, ...SettingsSort };
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = settingSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          this.auditQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        this.auditQryInstance.orderBy('audit_log.createdAt', 'DESC');
      }
      this.auditQryInstance.skip(params.skip);
      this.auditQryInstance.take(params.take);
      const [result, total] = await this.auditQryInstance.getManyAndCount();

      const totalCount: number = total;
      const results: any = result;

      this.logger.debug("[findSettingsLog] results: " + results.length);

      return ResponseData.success({ results, totalCount });
    } catch (err) {
      this.logger.error("[findSettingsLog] error " + JSON.stringify(err.message))
      return ResponseData.error(HttpStatus.BAD_REQUEST, err.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getCaptainStatusLog(params: ListSearchSortDto) {
    try {
      // Driver Status Filters
      if ('oldStatus' in params?.filters) {
        this.auditQryInstance.andWhere("JSON_UNQUOTE(JSON_EXTRACT(audit_log.oldValues, '$.approved')) = :oldStatus", { oldStatus: params?.filters?.oldStatus })
      }
      if ('newStatus' in params?.filters) {
        this.auditQryInstance.andWhere("JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.approved')) = :newStatus", { newStatus: params?.filters?.newStatus })
      }
      if (params?.filters?.blockedReason) {
        this.auditQryInstance.andWhere("JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.blockedReason')) LIKE :blockedReason", { blockedReason: `${params?.filters?.blockedReason}%` })
      }
      // Admin Sort
      const captainStatusSort = { ...AuditLogListSort, ...CaptainStatusSort };
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = captainStatusSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          this.auditQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        this.auditQryInstance.orderBy('audit_log.createdAt', 'DESC');
      }
      this.auditQryInstance.skip(params.skip);
      this.auditQryInstance.take(params.take);
      const [result, total] = await this.auditQryInstance.getManyAndCount();

      const totalCount: number = total;
      const results: any = result;

      this.logger.debug("[findCaptainStatusLog] results: " + results.length);

      return ResponseData.success({ results, totalCount });
    } catch (err) {
      this.logger.error("[findCaptainStatusLog] error " + JSON.stringify(err.message))
      return ResponseData.error(HttpStatus.BAD_REQUEST, err.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getChatUserStatusLog(params: ListSearchSortDto) {
    try {
      // Driver Status Filters
      if ('oldStatus' in params?.filters) {
        this.auditQryInstance.andWhere("audit_log.oldValues->'$.status' = :oldStatus", { oldStatus: params?.filters?.oldStatus })
      }
      if ('newStatus' in params?.filters) {
        this.auditQryInstance.andWhere("audit_log.newValues->'$.status' = :newStatus", { newStatus: params?.filters?.newStatus })
      }
      if (params?.filters?.reason) {
        this.auditQryInstance.andWhere("audit_log.newValues->>'$.reason' LIKE :reason", { reason: `${params?.filters?.reason}%` })
      }
      // Admin Sort
      const chatUserStatusSort = { ...AuditLogListSort, ...ChatUserStatusSort };
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = chatUserStatusSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          this.auditQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        this.auditQryInstance.orderBy('audit_log.createdAt', 'DESC');
      }
      this.auditQryInstance.skip(params.skip);
      this.auditQryInstance.take(params.take);
      const [result, total] = await this.auditQryInstance.getManyAndCount();

      const totalCount: number = total;
      const results: any = result;

      this.logger.debug("[getChatUserStatusLog] results: " + results.length);

      return ResponseData.success({ results, totalCount });
    } catch (err) {
      this.logger.error("[getChatUserStatusLog] error " + JSON.stringify(err.message))
      return ResponseData.error(HttpStatus.BAD_REQUEST, err.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

}

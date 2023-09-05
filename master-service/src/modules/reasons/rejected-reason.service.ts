import { Injectable, Logger, HttpStatus, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseHandler } from 'src/helpers/responseHandler';

import { RejectedReasonRepository } from './repositories/rejected-reason.repository';
import { RejectedReasonDto, UpdateRejectedReasonDto } from './dto/rejected-reason.dto';
import { REASON_TYPE } from './enum/rejected-reason.enum';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { errorMessage } from 'src/constants/error-message-constant';

@Injectable()
export class RejectedReasonService {
  private readonly logger = new LoggerHandler(RejectedReasonService.name).getInstance();
  constructor(
    @InjectRepository(RejectedReasonRepository)
    private rejectedReasonRepository: RejectedReasonRepository,
  ) { }

  async create(params: RejectedReasonDto) {
    try {
      const rejectedReason = this.rejectedReasonRepository.create(params);
      await this.rejectedReasonRepository.save(rejectedReason);
      this.logger.log("[create reason] created of type:" + rejectedReason.reasonType)
      return ResponseHandler.success(rejectedReason);
    } catch (err) {
      this.logger.error("[create reason] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  getResponseFields() {
    return [
      'id',
      'reason',
      'reasonArabic',
      'reasonType',
      'status',
      'createdAt'
    ];
  }

  async findRecord(id: string, extraSelect?: string[]) {
    try {
      const selectFields: any = this.getResponseFields();
      if (extraSelect?.length) {
        extraSelect.map(selField => selectFields.push(selField))
      }
      const whereCond = {id};
      // const whereCond = {id, isDeleted:IsNull()};
      const reasonDetail = await this.rejectedReasonRepository.findOne(id, {
        select: selectFields,
        where: whereCond
      });
      if (!reasonDetail) {
        this.logger.error(`reason not found | id : ${id}`)
        throw new Error(errorMessage.DETAILS_NOT_FOUND);
      }
      return ResponseHandler.success(reasonDetail);
    } catch (err) {
      this.logger.error("[findRecord] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST)
    }
  }

  async findAll(reasonType: REASON_TYPE) {
    try {
      const selectFields: any = this.getResponseFields();
      const results = await this.rejectedReasonRepository.find({
        select: selectFields,
        where: {reasonType},
        order: {
          updatedAt: 'DESC',
          createdAt: 'DESC'
        }
      });
      this.logger.log("[findAll] get list of type: " + reasonType+' with count:'+results.length)
      return ResponseHandler.success(results);
    } catch (err) {
      this.logger.error("[findAll] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(id: string) {
    try {
      const recordDetail = await this.findRecord(id)
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[findOne] reason detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Reason details not found.");
      }
      return ResponseHandler.success(recordDetail.data);
    } catch (err) {
      this.logger.error("[findOne] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async update(id: string, params: UpdateRejectedReasonDto) {
    try {
      const recordDetail = await this.findRecord(id)
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[update] reason detail not found id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.DETAILS_NOT_FOUND);
      }
      await this.rejectedReasonRepository.update(id, params);
      const finalRow = { ...recordDetail.data, ...params };
      this.logger.log("[update] reason detail updated : "+finalRow.reasonType)
      return ResponseHandler.success(finalRow);
    } catch (err) {
      this.logger.error("[update] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: string) {
    try {
      const recordDetail = await this.findRecord(id)
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[remove] reason detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.DETAILS_NOT_FOUND);
      }
      await this.rejectedReasonRepository.delete(id);
      this.logger.log("[remove] reason detail removed of type: " + recordDetail.data.reasonType + " with id:"+id)
      return ResponseHandler.success(recordDetail.data);
    } catch (err) {
      this.logger.error("[remove] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

}

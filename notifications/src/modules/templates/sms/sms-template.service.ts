import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'src/helpers/responseHandler';

import { SmsTemplateRepository } from './repositories/sms-template.repository';
import { CreateSmsTemplateDto } from './dto/create-sms-template.dto';
import { UpdateSmsTemplateDto } from './dto/update-sms-template.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class SmsTemplateService {

  constructor(
    @InjectRepository(SmsTemplateRepository)
    private SmsTemplateRepository: SmsTemplateRepository,
  ) {
  }

  private readonly logger = new LoggerHandler(SmsTemplateService.name).getInstance();

  async create(params: CreateSmsTemplateDto) {
    try {
      if(params?.dataKeys) {
        params.dataKeys = JSON.stringify(params?.dataKeys);
      }
      const SmsTemplate = this.SmsTemplateRepository.create(params);
      await this.SmsTemplateRepository.save(SmsTemplate);
      return ResponseData.success(HttpStatus.CREATED, SmsTemplate);
    } catch (err) {
      this.logger.error(`create -> sms template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findAll() {
    try {
      const SmsTemplates = await this.SmsTemplateRepository.find();
      SmsTemplates.map(item => {
        item.dataKeys = (item.dataKeys) ? JSON.parse(item.dataKeys) : []
      });
      return ResponseData.success(HttpStatus.OK, SmsTemplates);
    } catch (err) {
      this.logger.error(`findAll -> sms templates -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findOne(id: string) {
    try {
      const SmsTemplate = await this.SmsTemplateRepository.findOne(id);
      if (!SmsTemplate) {
        this.logger.warn(`findOne -> sms template not found -> id: ${id}`);
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.NO_DETAILS_FOUND);
      }
      if(SmsTemplate?.dataKeys) {
        SmsTemplate.dataKeys = JSON.parse(SmsTemplate.dataKeys);
      }
      return ResponseData.success(HttpStatus.OK, SmsTemplate);
    } catch (err) {
      this.logger.error(`findOne -> sms template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async update(id: string, params: UpdateSmsTemplateDto) {
    try {
      if(params?.dataKeys) {
        params.dataKeys = JSON.stringify(params?.dataKeys);
      }
      await this.SmsTemplateRepository.update(id, params);
      const SmsTemplate = await this.findOne(id);
      return SmsTemplate;
    } catch (err) {
      this.logger.error(`update -> sms template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateStatus(id: string, status: boolean) {
    try {
      await this.SmsTemplateRepository.update(id, { status : status });
      const SmsTemplate = await this.findOne(id);
      return SmsTemplate;
    } catch (err) {
      this.logger.error(`updateStatus -> sms template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async remove(id: string) {
    try {
      const SmsTemplate = await this.findOne(id);
      await this.SmsTemplateRepository.delete(id);
      return SmsTemplate;
    } catch (err) {
      this.logger.error(`remove -> sms template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findByCode(code: string) {
    try {
      const SmsTemplate = await this.SmsTemplateRepository.findOne({
        templateCode: code,
        status: true
      })
      if (!SmsTemplate) {
        this.logger.warn(`findByCode -> sms template not found -> code: ${code}`);
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.NO_DETAILS_FOUND)
      }
      return ResponseData.success(HttpStatus.OK, SmsTemplate);
    } catch (err) {
      this.logger.error(`findByCode -> sms template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }
}

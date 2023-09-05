import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'src/helpers/responseHandler';

import { PushTemplateRepository } from './repositories/push-template.repository';
import { CreatePushTemplateDto } from './dto/create-push-template.dto';
import { UpdatePushTemplateDto } from './dto/update-push-template.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class PushTemplateService {

  constructor(
    @InjectRepository(PushTemplateRepository)
    private pushTemplateRepository: PushTemplateRepository,
  ) {
  }

  private readonly logger = new LoggerHandler(PushTemplateService.name).getInstance();

  async create(params: CreatePushTemplateDto) {
    try {
      if(params?.dataKeys) {
        params.dataKeys = JSON.stringify(params?.dataKeys);
      }
      const pushTemplate = this.pushTemplateRepository.create(params);
      await this.pushTemplateRepository.save(pushTemplate);
      return ResponseData.success(HttpStatus.CREATED, pushTemplate);
    } catch (err) {
      this.logger.error(`create -> push template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findAll() {
    try {
      const pushTemplates = await this.pushTemplateRepository.find();
      pushTemplates.map(item => {
        item.dataKeys = (item.dataKeys) ? JSON.parse(item.dataKeys) : []
      });
      return ResponseData.success(HttpStatus.OK, pushTemplates);
    } catch (err) {
      this.logger.error(`findAll -> push templates -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findOne(id: string) {
    try {
      const pushTemplate = await this.pushTemplateRepository.findOne(id);
      if (!pushTemplate) {
        this.logger.warn(`findOne -> push template not found -> id: ${id}`);
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.NO_DETAILS_FOUND);
      }
      if(pushTemplate?.dataKeys) {
        pushTemplate.dataKeys = JSON.parse(pushTemplate.dataKeys);
      }
      return ResponseData.success(HttpStatus.OK, pushTemplate);
    } catch (err) {
      this.logger.error(`findOne -> push template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async update(id: string, params: UpdatePushTemplateDto) {
    try {
      if(params?.dataKeys) {
        params.dataKeys = JSON.stringify(params?.dataKeys);
      }
      await this.pushTemplateRepository.update(id, params);
      const pushTemplate = await this.findOne(id);
      return pushTemplate;
    } catch (err) {
      this.logger.error(`update -> push template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async remove(id: string) {
    try {
      const pushTemplate = await this.findOne(id);
      await this.pushTemplateRepository.delete(id);
      return pushTemplate;
    } catch (err) {
      this.logger.error(`remove -> push template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findByCode(code: string) {
    try {
      const pushTemplate = await this.pushTemplateRepository.findOne({
        templateCode: code,
        status: true
      })
      if (!pushTemplate) {
        this.logger.warn(`findByCode -> push template not found -> code: ${code}`);
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.NO_DETAILS_FOUND)
      }
      return ResponseData.success(HttpStatus.OK, pushTemplate);
    } catch (err) {
      this.logger.error(`findByCode -> push template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateStatus(id: string, status: boolean) {
    try {
      await this.pushTemplateRepository.update(id, { status : status });
      const pushTemplate = await this.findOne(id);
      return pushTemplate;
    } catch (err) {
      this.logger.error(`updateStatus -> email template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }
}

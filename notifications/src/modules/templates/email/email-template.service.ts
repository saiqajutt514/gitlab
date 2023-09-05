import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'src/helpers/responseHandler';

import { EmailTemplateRepository } from './repositories/email-template.repository';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class EmailTemplateService {

  constructor(
    @InjectRepository(EmailTemplateRepository)
    private emailTemplateRepository: EmailTemplateRepository,
  ) {
  }

  private readonly logger = new LoggerHandler(EmailTemplateService.name).getInstance();

  async create(params: CreateEmailTemplateDto) {
    try {
      if(params?.address) {
        params.address = JSON.stringify(params?.address);
      }
      if(params?.dataKeys) {
        params.dataKeys = JSON.stringify(params?.dataKeys);
      }
      const emailTemplate = this.emailTemplateRepository.create(params);
      await this.emailTemplateRepository.save(emailTemplate);
      return ResponseData.success(HttpStatus.CREATED, emailTemplate);
    } catch (err) {
      this.logger.error(`create -> email template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findAll() {
    try {
      const emailTemplates = await this.emailTemplateRepository.find();
      emailTemplates.map(item => {
        item.dataKeys = (item.dataKeys) ? JSON.parse(item.dataKeys) : []
      });
      return ResponseData.success(HttpStatus.OK, emailTemplates);
    } catch (err) {
      this.logger.error(`findAll -> email templates -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findOne(id: string) {
    try {
      const emailTemplate = await this.emailTemplateRepository.findOne(id);
      if (!emailTemplate) {
        this.logger.warn(`findOne -> email template not found -> id: ${id}`);
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.NO_DETAILS_FOUND);
      }
      if(emailTemplate?.dataKeys) {
        emailTemplate.dataKeys = JSON.parse(emailTemplate.dataKeys);
      }
      return ResponseData.success(HttpStatus.OK, emailTemplate);
    } catch (err) {
      this.logger.error(`findOne -> email template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async update(id: string, params: UpdateEmailTemplateDto) {
    try {
      if(params?.address) {
        params.address = JSON.stringify(params?.address);
      }
      if(params?.dataKeys) {
        params.dataKeys = JSON.stringify(params?.dataKeys);
      }
      await this.emailTemplateRepository.update(id, params);
      const emailTemplate = await this.findOne(id);
      return emailTemplate;
    } catch (err) {
      this.logger.error(`update -> email template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async remove(id: string) {
    try {
      const emailTemplate = await this.findOne(id);
      await this.emailTemplateRepository.delete(id);
      return emailTemplate;
    } catch (err) {
      this.logger.error(`remove -> email template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async findByCode(code: string) {
    try {
      const emailTemplate = await this.emailTemplateRepository.findOne({
        templateCode: code,
        status: true
      })
      if (!emailTemplate) {
        this.logger.warn(`findByCode -> email template not found -> code: ${code}`);
        return ResponseData.error(HttpStatus.NOT_FOUND, errorMessage.NO_DETAILS_FOUND)
      }
      return ResponseData.success(HttpStatus.OK, emailTemplate);
    } catch (err) {
      this.logger.error(`findByCode -> email template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async updateStatus(id: string, status: boolean) {
    try {
      await this.emailTemplateRepository.update(id, { status : status });
      const emailTemplate = await this.findOne(id);
      return emailTemplate;
    } catch (err) {
      this.logger.error(`updateStatus -> email template -> error ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }
}

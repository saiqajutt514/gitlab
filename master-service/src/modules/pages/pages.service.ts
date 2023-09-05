import { Injectable, HttpStatus, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { PagesRepository } from './repositories/pages.repository';
import { errorMessage } from 'src/constants/error-message-constant';
import { successMessage } from 'src/constants/success-message-constant';
import { AddSlaDto, ListSortDto, UpdateSlaDto } from './dto/pages.dto';
import { PagesEntity } from './entities/pages.entity';

@Injectable()
export class PagesService {
  private readonly logger = new LoggerHandler(PagesService.name).getInstance();
  constructor(
    @InjectRepository(PagesRepository)
    private pagesRepository: PagesRepository,
  ) {}
  async findAll(params) {
    try {
      const fields = [
        'pages.id',
        'pages.title',
        'pages.language',
        'pages.order',
        'pages.description',
        'pages.parentId',
        'pages.code',
      ];
      const pagesInstance = this.pagesRepository.createQueryBuilder('pages');
      pagesInstance.select(fields);
      pagesInstance.where('pages.language = :isLanguage', {
        isLanguage: params.lang,
      });
      pagesInstance.andWhere('pages.code = :pageCode', {
        pageCode: params.pageCode,
      });
      pagesInstance.orWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('pages.id')
          .from(PagesEntity, 'pages')
          .where('pages.code = :pageCode AND pages.language = :lang', {
            pageCode: params.pageCode,
            lang: params.lang,
          })
          .getQuery();
        return 'pages.parentId = ' + subQuery;
      });
      pagesInstance.orderBy('pages.language', 'ASC');
      pagesInstance.addOrderBy('pages.order', 'ASC');
      const [result, total] = await pagesInstance.getManyAndCount();
      const totalCount: number = total;
      const data: any = result;
      this.logger.debug('[findAll] get list with count: ' + totalCount);
      return ResponseHandler.success({ data, totalCount });
    } catch (err) {
      this.logger.error('[findAll] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }
  async addSLAContent(body) {
    try {
      let insertArr = [];
      let updateArr = [];
      body.forEach((section) => {
        if (section.id) {
          updateArr.push(section);
        } else {
          let tempSection = { ...section };
          delete tempSection.id;
          insertArr.push(tempSection);
        }
      });
      if (insertArr.length) {
        const response = this.pagesRepository.create([...insertArr]);
        this.logger.log(`addSLAContent -> ${JSON.stringify(response)}`);
        await this.pagesRepository.save(response);
      }
      if (updateArr.length) {
        this.logger.log(`updateSLAContent -> ${JSON.stringify(body)}`);
        const ids = updateArr.filter((section) => section.id);
        updateArr.forEach(async (section) => {
          await this.pagesRepository.update(section.id, { ...section });
        });
      }
      return ResponseHandler.success([]);
    } catch (err) {
      this.logger.error(`addSLAContent -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }
  async updateSLAContent(body: UpdateSlaDto) {
    try {
      this.logger.log(`updateSLAContent -> ${JSON.stringify(body)}`);
      const { id } = body;
      await this.pagesRepository.update(id, body);
      const response = await this.pagesRepository.findOne({ id });
      return ResponseHandler.success(response);
    } catch (err) {
      this.logger.error(`updateSLAContent -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }
}

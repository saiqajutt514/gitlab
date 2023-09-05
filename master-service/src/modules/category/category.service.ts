import { Injectable, Logger, HttpStatus, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseHandler } from 'src/helpers/responseHandler';

import { CategoryRepository } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class CategoryService {

  private readonly logger = new LoggerHandler(CategoryService.name).getInstance();

  constructor(
    @InjectRepository(CategoryRepository)
    private categoryRepository: CategoryRepository,
  ) { }

  async create(params: CreateCategoryDto) {
    try {
      const category = this.categoryRepository.create(params);
      await this.categoryRepository.save(category);
      this.logger.log("[create] created: " + category.categoryName)
      return ResponseHandler.success(category);
    } catch (err) {
      this.logger.error("[create] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    try {
      const results = await this.categoryRepository.find({
        order: {
          updatedAt: 'DESC',
          createdAt: 'DESC'
        }
      });
      this.logger.debug("[findAll] get list with count: "+results.length)
      return ResponseHandler.success(results);
    } catch (err) {
      this.logger.error("[findAll] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(id: string) {
    try {
      const categoryDetail = await this.categoryRepository.findOne(id)
      if (!categoryDetail) {
        this.logger.error("[findOne] category detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Category details not found.");
      }
      return ResponseHandler.success(categoryDetail);
    } catch (err) {
      this.logger.error("[findOne] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async update(id: string, params: UpdateCategoryDto) {
    try {
      const category = await this.findOne(id);
      if (!category) {
        this.logger.error("[update] category detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Category details not found.");
      }
      await this.categoryRepository.update(id, params);

      const recordDetail = await this.findOne(id)
      this.logger.log("[update] category detail updated of category: "+recordDetail.data.categoryName)
      return ResponseHandler.success(recordDetail.data);
    } catch (err) {
      this.logger.error("[update] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: string) {
    try {
      const recordDetail = await this.findOne(id)
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[remove] category detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Category details not found.");
      }
      await this.categoryRepository.delete(id);
      this.logger.log("[remove] category detail removed of category: " + recordDetail.data.categoryName + " with id: "+id)
      return ResponseHandler.success(recordDetail.data);
    } catch (err) {
      this.logger.error("[remove] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async getAllCapabilties() {
    try {
      const fields = [
        "category.id", "category.categoryName", "category.moduleType", "permissions.accessName", "permissions.accessCode",
      ];
      const codeQryInstance = this.categoryRepository.createQueryBuilder("category")
      codeQryInstance.select(fields)
      codeQryInstance.leftJoin("category.permissions", "permissions");
      codeQryInstance.orderBy({
        'category.moduleType': 'ASC',
        'category.categoryName': 'ASC',
        'permissions.sequence': 'ASC'
      });
      const results = await codeQryInstance.getMany();

      this.logger.debug("[getAllCapabilties] get list with count: " + results.length)
      return ResponseHandler.success(results);
    } catch (err) {
      this.logger.error("[getAllCapabilties] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

}

import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_CATEGORY,
  GET_ALL_CATEGORY,
  GET_CATEGORY_DETAIL,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  GET_ALL_CAPABILITIES
} from 'src/constants/kafka-constant';

import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('category')
export class CategoryController {

  private readonly logger = new LoggerHandler(CategoryController.name).getInstance();

  constructor(private categoryService: CategoryService) {}

  @MessagePattern(CREATE_CATEGORY, Transport.TCP)
  async createCategoryHandler(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::category::${CREATE_CATEGORY}::recv -> ${JSON.stringify(message.value)}`);
    const params: CreateCategoryDto = message.value;
    return await this.categoryService.create(params);
  }

  @MessagePattern(GET_ALL_CATEGORY, Transport.TCP)
  async findAllCategorys(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::category::${GET_ALL_CATEGORY}::recv -> ${JSON.stringify(message.value)}`);
    return await this.categoryService.findAll();
  }

  @MessagePattern(GET_CATEGORY_DETAIL, Transport.TCP)
  async findOneCategory(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::category::${GET_CATEGORY_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.categoryService.findOne(id);
  }

  @MessagePattern(UPDATE_CATEGORY, Transport.TCP)
  async updateCategory(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::category::${UPDATE_CATEGORY}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    const params: UpdateCategoryDto = message.value?.data;
    return await this.categoryService.update(id, params);
  }

  @MessagePattern(DELETE_CATEGORY, Transport.TCP)
  async removeCategory(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::category::${DELETE_CATEGORY}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.categoryService.remove(id);
  }

  @MessagePattern(GET_ALL_CAPABILITIES, Transport.TCP)
  async getAllCapabilties(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::category::${GET_ALL_CAPABILITIES}::recv -> ${JSON.stringify(message.value)}`);
    return await this.categoryService.getAllCapabilties();
  }

}

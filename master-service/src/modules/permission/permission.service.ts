import { Injectable, Logger, HttpStatus, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseHandler } from 'src/helpers/responseHandler';

import { PermissionRepository } from './permission.repository';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class PermissionService {

  private readonly logger = new LoggerHandler(PermissionService.name).getInstance();

  constructor(
    @InjectRepository(PermissionRepository)
    private permissionRepository: PermissionRepository,
  ) { }

  async create(params: CreatePermissionDto) {
    try {
      const permission = this.permissionRepository.create(params);
      await this.permissionRepository.save(permission);
      this.logger.log("[create] created: " + permission.accessName)
      return ResponseHandler.success(permission);
    } catch (err) {
      this.logger.error("[create] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    try {
      const results = await this.permissionRepository.find({
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
      const recordDetail = await this.permissionRepository.findOne(id)
      if (!recordDetail) {
        this.logger.error("[findOne] permission detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Permission details not found.");
      }
      return ResponseHandler.success(recordDetail);
    } catch (err) {
      this.logger.error("[findOne] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async update(id: string, params: UpdatePermissionDto) {
    try {
      const permission = await this.permissionRepository.findOne(id);
      if (!permission) {
        this.logger.error("[update] permission detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Permission details not found.");
      }
      await this.permissionRepository.update(id, params);

      const recordDetail = await this.findOne(id)
      this.logger.log("[update] permission detail updated of title: "+recordDetail.data.title)
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
        this.logger.error("[remove] permission detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Permission details not found.");
      }
      await this.permissionRepository.delete(id);
      this.logger.log("[remove] permission detail removed of title: " + recordDetail.data.title + " with id: "+id)
      return ResponseHandler.success(recordDetail.data);
    } catch (err) {
      this.logger.error("[remove] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

}

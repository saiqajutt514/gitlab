import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_PERMISSION,
  GET_ALL_PERMISSIONS,
  GET_PERMISSION_DETAIL,
  UPDATE_PERMISSION,
  DELETE_PERMISSION
} from 'src/constants/kafka-constant';

import { PermissionService } from './permission.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('permission')
export class PermissionController {

  private readonly logger = new LoggerHandler(PermissionController.name).getInstance();

  constructor(private permissionService: PermissionService) {}

  @MessagePattern(CREATE_PERMISSION, Transport.TCP)
  async createPermissionHandler(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::permission::${CREATE_PERMISSION}::recv -> ${JSON.stringify(message.value)}`);
    const params: CreatePermissionDto = message.value;
    return await this.permissionService.create(params);
  }

  @MessagePattern(GET_ALL_PERMISSIONS, Transport.TCP)
  async findAllPermissions(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::permission::${GET_ALL_PERMISSIONS}::recv -> ${JSON.stringify(message.value)}`);
    return await this.permissionService.findAll();
  }

  @MessagePattern(GET_PERMISSION_DETAIL, Transport.TCP)
  async findOnePermission(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::permission::${GET_PERMISSION_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.permissionService.findOne(id);
  }

  @MessagePattern(UPDATE_PERMISSION, Transport.TCP)
  async updatePermission(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::permission::${UPDATE_PERMISSION}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    const params: UpdatePermissionDto = message.value?.data;
    return await this.permissionService.update(id, params);
  }

  @MessagePattern(DELETE_PERMISSION, Transport.TCP)
  async removePermission(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::permission::${DELETE_PERMISSION}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.permissionService.remove(id);
  }

}

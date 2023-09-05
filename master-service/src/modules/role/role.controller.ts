import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";

import {
  CREATE_ROLE,
  GET_ALL_ROLES,
  GET_ROLE_DETAIL,
  UPDATE_ROLE,
  DELETE_ROLE,
  SYNC_ROLE
} from 'src/constants/kafka-constant';

import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { RoleStatus } from './role.enum';

@Controller('role')
export class RoleController {

  private readonly logger = new LoggerHandler(RoleController.name).getInstance();

  constructor(private roleService: RoleService) {}

  @MessagePattern(CREATE_ROLE, Transport.TCP)
  async createRoleHandler(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::role::${CREATE_ROLE}::recv -> ${JSON.stringify(message.value)}`);
    const params: CreateRoleDto = message.value;
    return await this.roleService.create(params);
  }

  @MessagePattern(GET_ALL_ROLES, Transport.TCP)
  async findAllRoles(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::role::${GET_ALL_ROLES}::recv -> ${JSON.stringify(message.value)}`);
    const status: number = message.value?.status || null;
    if(status && status === RoleStatus.ACTIVE) {
      this.logger.debug('[getActiveRoles] :: list');
      return await this.roleService.getActiveRoles();
    }
    else {
      return await this.roleService.findAll();
    }
  }

  @MessagePattern(GET_ROLE_DETAIL, Transport.TCP)
  async findOneRole(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::role::${GET_ROLE_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.roleService.findOne(id);
  }

  @MessagePattern(UPDATE_ROLE, Transport.TCP)
  async updateRole(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::role::${UPDATE_ROLE}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    const params: UpdateRoleDto = message.value?.data;
    return await this.roleService.update(id, params);
  }

  @MessagePattern(DELETE_ROLE, Transport.TCP)
  async removeRole(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`input::role::${DELETE_ROLE}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.roleService.remove(id);
  }

  @MessagePattern(SYNC_ROLE, Transport.TCP)
  async syncRole(@Payload() payload) {
    this.logger.debug(`input::role::${SYNC_ROLE}::recv`);
    return await this.roleService.syncRole();
  }

}

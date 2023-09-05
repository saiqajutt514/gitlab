import { Injectable, Logger, HttpStatus, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseHandler } from 'src/helpers/responseHandler';

import { RoleRepository } from './role.repository';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { RoleCodes, RoleStatus } from './role.enum';
import { RedisHandler } from 'src/helpers/redis-handler';

@Injectable()
export class RoleService {

  private readonly logger = new LoggerHandler(RoleService.name).getInstance();

  constructor(
    @InjectRepository(RoleRepository)
    private roleRepository: RoleRepository,
    private redisHandler: RedisHandler
  ) { }

  async create(params: CreateRoleDto) {
    try {
      const role = this.roleRepository.create(params);
      await this.roleRepository.save(role);
      this.logger.log("[create] created: " + role.title)
      return ResponseHandler.success(role);
    } catch (err) {
      this.logger.error("[create] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  getRoleFields() {
    return [
      'id',
      'code',
      'title',
      'status',
      'createdAt'
    ];
  }

  async findRecord(id: string, extraSelect?: string[]) {
    try {
      const fields: any = this.getRoleFields();
      if (extraSelect?.length) {
        extraSelect.map(selField => fields.push(selField))
      }
      const condition = { id };
      // const whereCond = { id, isDeleted: IsNull() };
      const roleDetail = await this.roleRepository.findOne(id, {
        select: fields,
        where: condition
      });
      if (!roleDetail) {
        throw new Error();
      }
      return ResponseHandler.success(roleDetail);
    } catch (err) {
      this.logger.error("[findRecord] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST)
    }
  }

  async findAll() {
    try {
      const selectFields: any = this.getRoleFields();
      const results = await this.roleRepository.find({
        select: selectFields,
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

  async getActiveRoles() {
    try {
      const selectFields: any = this.getRoleFields();
      const results = await this.roleRepository.find({
        select: selectFields,
        where: { status: RoleStatus.ACTIVE },
        order: {
          updatedAt: 'DESC',
          createdAt: 'DESC'
        }
      });
      this.logger.debug("[getActiveRoles] get list with count: "+results.length)
      return ResponseHandler.success(results);
    } catch (err) {
      this.logger.error("[findAll] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(id: string) {
    try {
      const recordDetail = await this.roleRepository.findOne(id)
      if (!recordDetail) {
        this.logger.error("[findOne] role detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Role details not found.");
      }
      return ResponseHandler.success(recordDetail);
    } catch (err) {
      this.logger.error("[findOne] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async update(id: string, params: UpdateRoleDto) {
    try {
      const role = await this.roleRepository.findOne(id);
      if (!role) {
        this.logger.error("[update] role detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Role details not found.");
      }
      await this.roleRepository.update(id, params);

      const recordDetail = await this.findRecord(id, ['capabilites']);
      this.logger.log("[update] role detail updated of title: "+recordDetail.data.title)

      this.logger.log("Sync role capabilities started");
      let name;
      name = `role-${recordDetail?.data?.code}`.toUpperCase();
      const updateData = [];
      updateData.push(name);
      updateData.push(JSON.stringify(recordDetail?.data?.capabilites));
      this.redisHandler.client.mset(updateData);
      this.logger.log("Sync role capabilities ended")

      return ResponseHandler.success(recordDetail.data);
    } catch (err) {
      this.logger.error("[update] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: string) {
    try {
      const recordDetail = await this.findRecord(id)
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[remove] role detail not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Role details not found.");
      }
      if (Object.values(RoleCodes).includes(recordDetail?.data?.code)) {
        this.logger.error("[remove] role deletion restricted: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Role deletion restricted.");
      }
      await this.roleRepository.delete(id);
      this.logger.log("[remove] role detail removed of title: " + recordDetail.data.title + " with id: "+id)

      let name = `role-${recordDetail?.data?.code}`.toUpperCase();
      this.logger.log("[remove] redis key: " + name)
      this.redisHandler.client.del(name);
      this.logger.log("[remove] redis key: " + name + ' success')
      return ResponseHandler.success(recordDetail.data);
    } catch (err) {
      this.logger.error("[remove] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async syncRole() {
    try {
      this.logger.log("Sync role capabilities started");
      const roles = await this.roleRepository.find({ where : { status: true } });
      const updateData = [];
      roles.forEach((val) => {
        let name = `role-${val.code}`.toUpperCase()
        updateData.push(name);
        updateData.push(JSON.stringify(val.capabilites));
      });
      this.redisHandler.client.mset(updateData);
      this.logger.log("[syncRole] total synced in redis : " + roles.length)
      return ResponseHandler.success(roles);
    } catch (err) {
      this.logger.error("[syncRole] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

}

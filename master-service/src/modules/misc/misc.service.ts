import {
  Injectable,
  Logger,
  HttpStatus,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { Client, ClientKafka } from '@nestjs/microservices';

import { CREATE_AUDIT_LOG } from 'src/constants/kafka-constant';
import { auditLogMicroServiceConfig } from 'src/microServicesConfigs/audit.microservice.config';

import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { SettingRepository } from './repositories/setting.repository';
import { SaveSettingDto } from './dto/setting.dto';
import { RedisHandler } from 'src/helpers/redis-handler';
import { errorMessage } from 'src/constants/error-message-constant';
import { In, IsNull, Not } from 'typeorm';
import { SettingCategory } from './enum/setting.enum';
import { SettingListParams } from './interfaces/setting.interface';

@Injectable()
export class MiscService implements OnModuleInit {
  // @Client(auditLogMicroServiceConfig)
  // clientAudit: ClientKafka;

  private readonly logger = new LoggerHandler(MiscService.name).getInstance();

  constructor(
    private settingRepository: SettingRepository,
    private redisHandler: RedisHandler,
    @Inject('CLIENT_AUDIT_SERVICE_KAFKA') private clientAudit: ClientKafka,
  ) {}

  onModuleInit() {}

  async syncSettings() {
    try {
      const results = await this.settingRepository.find({
        select: ['id', 'name', 'value'],
      });
      if (!results || results.length == 0) {
        this.logger.error('No setting found');
        throw new Error('No setting found');
      }
      let name;
      const updateData = [];
      results.forEach((val) => {
        name = `setting_${val.name}`.toUpperCase();
        updateData.push(name);
        updateData.push(val.value);
      });
      this.redisHandler.client.mset(updateData);
      this.logger.log(
        '[syncSettings] total synced in redis : ' + results.length,
      );
      return ResponseHandler.success({});
    } catch (err) {
      this.logger.error('[syncSettings] error > ' + err.message);
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAllSettings(params: SettingListParams) {
    try {
      let results = [];
      if (params?.master === true) {
        const masterKeys = [
          'DRIVER_PICKUP_REACH_RANGE',
          'DRIVER_END_TRIP_RANGE',
        ];
        let lastSynced = await this.redisHandler.getRedisKey(
          'settings-last-synced',
        );
        if (!lastSynced) {
          // fetch from db
          results = await this.settingRepository.find({
            select: ['name', 'value'],
            where: {
              name: In(masterKeys),
            },
          });
        } else {
          // fetch from redis
          const masterRedis = await this.redisHandler.mget(
            masterKeys.map((setting) => `SETTING_${setting}`),
          );
          masterKeys.forEach((settingKey, index) => {
            results.push({
              name: settingKey,
              value: masterRedis[index],
            });
          });
        }
        const resultList = {};
        results.forEach((setting) => {
          resultList[setting.name.replace(/_/g, '')] = setting.value;
        });
        return ResponseHandler.success(resultList);
      } else {
        let condition;
        if (params?.category) {
          condition = { category: params.category };
        } else {
          condition = { category: Not(In([SettingCategory.CHAT])) };
        }
        results = await this.settingRepository.find({
          select: ['id', 'name', 'value', 'description', 'subCategory'],
          where: condition,
        });
        if (!results || results.length == 0) {
          if (params?.category) {
          } else {
            this.logger.error('No setting found');
            throw new Error('No setting found');
          }
        }
      }
      this.logger.debug('[getAllSettings] total results : ' + results.length);
      return ResponseHandler.success(results);
    } catch (err) {
      this.logger.error('[getAllSettings] error > ' + err.message);
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getSetting(name: string) {
    try {
      const settingRow = await this.settingRepository.findOne({
        select: ['id', 'name', 'value', 'description', 'subCategory'],
        where: { name },
      });
      if (!settingRow) {
        this.logger.error('Setting not found for:' + name);
        throw new Error(errorMessage.DETAILS_NOT_FOUND);
      }
      return ResponseHandler.success(settingRow);
    } catch (err) {
      this.logger.error('[getSetting] error > ' + err.message);
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateSetting(name: string, params: SaveSettingDto) {
    try {
      const settingRow = await this.settingRepository.findOne({
        select: [
          'id',
          'name',
          'value',
          'category',
          'description',
          'subCategory',
        ],
        where: { name },
      });
      if (!settingRow) {
        throw new Error(`[updateSetting] setting not found for: ${name}`);
      }
      await this.settingRepository.update(settingRow.id, params);

      // Audit log entry
      try {
        const auditParams = {
          moduleName: 'settings',
          entityName: 'setting',
          entityId: settingRow.id,
          actionType: 'update',
          oldValues: {
            name: settingRow.name,
            value: settingRow.value,
            category: settingRow.category,
            description: settingRow.description,
            subCategory: settingRow.subCategory,
          },
          newValues: {
            name: settingRow.name,
            value: params.value,
            category: settingRow.category,
            description: settingRow.description,
            subCategory: settingRow.subCategory,
          },
        };
        this.clientAudit.emit(CREATE_AUDIT_LOG, JSON.stringify(auditParams));
        this.logger.log(`[updateSetting] audit log for setting: ${name}`);
      } catch (e) {
        this.logger.error(
          `[updateSetting] audit log error for setting ${name} :: ${e.message}`,
        );
      }

      // Save to Redis
      let upname = `setting_${settingRow.name}`.toUpperCase();
      this.redisHandler.client.mset([upname, params.value]);
      settingRow.value = params.value;
      this.logger.log(
        `[updateSetting] Redis value updated for setting: ${name}`,
      );

      return ResponseHandler.success(settingRow);
    } catch (err) {
      this.logger.error(
        `[updateSetting] error update setting value: ${err.message}`,
      );
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // for new design of master control by mujtaba
  async newUpdateSetting(name: string, params: any) {
    try {
      const settingRow = await this.settingRepository.findOne({
        select: [
          'id',
          'name',
          'value',
          'category',
          'description',
          'subCategory',
        ],
        where: { name },
      });
      if (!settingRow) {
        throw new Error(`[updateSetting] setting not found for: ${name}`);
      }
      await this.settingRepository.update(settingRow.id, params);

      // Audit log entry
      try {
        const auditParams = {
          moduleName: 'settings',
          entityName: 'setting',
          entityId: settingRow.id,
          actionType: 'update',
          oldValues: {
            name: settingRow.name,
            value: settingRow.value,
            category: settingRow.category,
            description: settingRow.description,
            subCategory: settingRow.subCategory,
          },
          newValues: {
            name: settingRow.name,
            value: params.value,
            category: settingRow.category,
            description: settingRow.description,
            subCategory: settingRow.subCategory,
          },
        };
        this.clientAudit.emit(CREATE_AUDIT_LOG, JSON.stringify(auditParams));
        this.logger.log(`[updateSetting] audit log for setting: ${name}`);
      } catch (e) {
        this.logger.error(
          `[updateSetting] audit log error for setting ${name} :: ${e.message}`,
        );
      }

      // Save to Redis
      let upname = `setting_${settingRow.name}`.toUpperCase();
      this.redisHandler.client.mset([upname, params.value]);
      settingRow.value = params.value;
      this.logger.log(
        `[updateSetting] Redis value updated for setting: ${name}`,
      );

      return ResponseHandler.success(settingRow);
    } catch (err) {
      this.logger.error(
        `[updateSetting] error update setting value: ${err.message}`,
      );
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
}

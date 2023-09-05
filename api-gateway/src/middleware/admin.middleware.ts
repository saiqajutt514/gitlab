import {
  Scope,
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { REQUEST } from '@nestjs/core';
import {
  GET_METHODS,
  POST_METHODS,
  PATCH_METHODS,
  PUT_METHODS,
  DELETE_METHODS,
} from '../helpers/admin-capabilities';
declare global {
  namespace Express {
    interface Request {
      admin: {};
    }
  }
}
import * as jwt from 'jsonwebtoken';
import appConfig from 'config/appConfig';
import { RedisClient } from 'redis';
import { promisify } from 'util';
import { AdminService } from '../modules/admin/admin.service';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable({ scope: Scope.REQUEST })
export class AdminMiddleware implements NestMiddleware {
  redisClient: RedisClient;
  getRedisKey: Function;
  constructor(
    @Inject(REQUEST) private request: Request,
    private readonly adminService: AdminService,
  ) {
    try {
      this.redisClient = new RedisClient({
        host: appConfig().RedisHost,
        port: appConfig().RedisPort,
      });
      this.getRedisKey = promisify(this.redisClient.get).bind(this.redisClient);
    } catch (err) {}
  }

  private readonly logger = new LoggerHandler(
    AdminMiddleware.name,
  ).getInstance();
  async use(req: Request, res: Response, next: NextFunction) {
    // Sync admin settings to redis
    try {
      let lastSynced = await this.getRedisKey('settings-last-synced');
      if (!lastSynced) {
        let syncResult = await this.adminService.syncSettings();
        if (syncResult.statusCode == HttpStatus.OK) {
          this.redisClient.set(['settings-last-synced', Date.now()]);
          this.logger.log('admin settings sync completed with redis');
        }
      }
    } catch (err) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: err,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const authHeader = req?.headers?.authorization;
    let sCode = HttpStatus.OK;
    let sMessage = 'Unauthorized';
    try {
      if (authHeader && (authHeader as string).split(' ')[1]) {
        const token = (authHeader as string).split(' ')[1];
        if (!token) {
          this.logger.error('invalid token found');
          throw new Error(sMessage);
        }
        const decoded: any = jwt.verify(token, appConfig().JwtSecret);
        // TODO: need to check agaist database on specific interval of time
        req.admin = decoded;
        this.logger.debug('Admin token authorization success');

        await this.checkCapability(req, next);
      } else {
        this.logger.error('No auth token found');
        throw new Error(sMessage);
      }
    } catch (err) {
      this.logger.error(
        `exception -> ${JSON.stringify({
          name: err.name,
          message: err.message,
        })}`,
      );
      sCode = HttpStatus.UNAUTHORIZED;

      if (err.name == jwt.JsonWebTokenError.name) {
        sMessage = 'Invalid token';
      } else if (err.name == jwt.TokenExpiredError.name) {
        sMessage = 'Token expired. Please login again';
      } else if (jwt.NotBeforeError.name == err.name) {
        sMessage = err.message;
      }
      //Admin module capabilities checked
      if (err?.status === HttpStatus.FORBIDDEN) {
        sCode = HttpStatus.FORBIDDEN;
        sMessage = err.message;
      }
    }
    if (sCode !== HttpStatus.OK) {
      throw new HttpException(
        {
          statusCode: sCode,
          message: sMessage,
        },
        sCode,
      );
    }
    next();
  }

  async checkCapability(req: Request, next: NextFunction) {
    try {
      let moduleUrl: string = req.baseUrl.replace('/admin/', '');
      let requestMethod = req.method;
      let capability;

      const moduleArr = moduleUrl.split('/');
      if (moduleArr.length === 2) {
        const isUUID = await this.isUUID(moduleArr[1]);
        if (isUUID) {
          moduleUrl = moduleArr[0] + '/*';
        }
      }
      if (moduleArr.length === 3) {
        const isUUID = await this.isUUID(moduleArr[2]);
        if (isUUID) {
          moduleUrl = moduleArr[0] + '/' + moduleArr[1] + '/*';
        }
      }

      if (requestMethod === 'GET') {
        capability = GET_METHODS[moduleUrl];
      } else if (requestMethod === 'POST') {
        capability = POST_METHODS[moduleUrl];
      } else if (requestMethod === 'PUT') {
        capability = PUT_METHODS[moduleUrl];
      } else if (requestMethod === 'PATCH') {
        capability = PATCH_METHODS[moduleUrl];
      } else if (requestMethod === 'DELETE') {
        capability = DELETE_METHODS[moduleUrl];
      }

      if (!capability) {
        this.logger.debug(
          `No capability found for route | moduleUrl : ${moduleUrl} | requestMethod : ${requestMethod}`,
        );
        return next;
      }

      this.logger.debug(
        `capability found for route | moduleUrl : ${moduleUrl} | requestMethod : ${requestMethod} | capability : ${capability}`,
      );
      const role = req.admin['role'];

      this.logger.debug(`Checking role data synced with redis`);
      let roleLastSynced = await this.getRedisKey('role-last-synced');
      if (!roleLastSynced) {
        let syncResult = await this.adminService.syncRole();
        if (syncResult.statusCode === HttpStatus.OK) {
          this.redisClient.set(['role-last-synced', Date.now()]);
          this.logger.log('admin settings sync completed with redis');
        } else {
          this.logger.debug(`Role sync error | ${JSON.stringify(syncResult)}`);
          return next;
        }
      }

      const roleKey = `role-${role}`.toUpperCase();
      this.logger.debug(`Getting Capabilities of role: ${roleKey}`);
      let roleCapabilities = await this.getRedisKey(roleKey);
      if (!roleCapabilities) {
        this.logger.debug(`Role data not found | ${roleCapabilities}`);
        return next;
      }
      roleCapabilities = JSON.parse(roleCapabilities);
      if (!roleCapabilities.includes(capability)) {
        this.logger.debug(`Access denied`);
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
    } catch (err) {
      this.logger.debug(`Access denied`);
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  async isUUID(uuid) {
    let value: any = '' + uuid;
    value = value.match(
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    );
    if (value === null) {
      return false;
    }
    return true;
  }
}

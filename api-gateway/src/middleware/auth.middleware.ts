import {
  Injectable,
  Scope,
  Inject,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { REQUEST } from '@nestjs/core';
import jwt_decode from 'jwt-decode';

declare global {
  namespace Express {
    interface Request {
      user: {};
    }
  }
}

import { createHash } from 'crypto';
import { RedisClient } from 'redis';
import { promisify } from 'util';

import appConfig from 'config/appConfig';
import { UserService } from '../modules/user/user.service';
import { AdminService } from '../modules/admin/admin.service';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { RequestUserDto } from 'src/helpers/dto/requestUserDto';
import { errorMessage } from 'src/constants/error-message-constant';

@Injectable({ scope: Scope.REQUEST })
export class AuthMiddleware implements NestMiddleware {
  redisClient: RedisClient;
  getRedisKey: Function;

  constructor(
    @Inject(REQUEST) private request: Request,
    private readonly userService: UserService,
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
    AuthMiddleware.name,
  ).getInstance();

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // temp added by mujtaba
      this.logger.log(`[------Request------] -> `, req);
      console.log(req);

      this.logger.log('[AuthMiddleware] -> in auth-middleware');

      // Sync admin settings to redis
      let lastSynced = await this.getRedisKey('settings-last-synced');
      if (!lastSynced) {
        let syncResult = await this.adminService.syncSettings();
        if (syncResult.statusCode == HttpStatus.OK) {
          this.redisClient.set(['settings-last-synced', Date.now()]);
          this.logger.log('[AuthMiddleware] -> admin settings synced');
        }
      }

      // Session id check
      const sessionHeader = req.headers.sessionid;
      const sessionId = sessionHeader as string;
      this.logger.log(`[AuthMiddleware] -> sessionId: found`);

      if (!sessionId) {
        this.logger.error('[AuthMiddleware] -> No session header found.');
        throw new HttpException(
          errorMessage.UNAUTHORIZED,
          HttpStatus.UNAUTHORIZED,
        );
      }

      ///new changes

      const jwtDecoded: any = jwt_decode(sessionId);
      // console.log(jwtDecoded);
      const hashKeyNo = createHash('md5')
        .update(jwtDecoded?.data?.mobileNo)
        .digest('hex');

      const hashToken = createHash('md5').update(sessionId).digest('hex');

      const latestToken = await this.getRedisKey(`user-token-${hashKeyNo}`);

      if (latestToken !== hashToken) {
        throw new HttpException(errorMessage.INVALID_TOKEN_OR_EXPIRED, 440);
      }

      //end
      // Append user details from redis through sessionId
      const hashKey = createHash('md5').update(sessionId).digest('hex');
      const userDetails = await this.getRedisKey(`user-${hashKey}`);
      this.logger.log(
        `[AuthMiddleware] -> User details from Redis: ${userDetails}`,
      );

      if (userDetails) {
        const userObject: RequestUserDto = JSON.parse(userDetails);
        if (userObject) {
          if ('_timestamp' in userObject && userObject._timestamp) {
            const prevTime: number = userObject._timestamp;
            const currTime: number = Date.now();
            const diffTime: number = (currTime - prevTime) / 1000 / 60;
            const expireTime: number = parseInt(appConfig().sessExpires);
            if (diffTime < expireTime) {
              req.user = userObject;
            }
          }
        }
      }

      // Fetch user details from e-wallet API through sessionId
      if (!req.user) {
        const sessResponse = await this.userService.fetchUserDetails(sessionId);

        if (sessResponse && sessResponse.statusCode !== HttpStatus.OK) {
          this.logger.error(
            `[AuthMiddleware] -> Error from E-wallet: ${JSON.stringify(
              sessResponse,
            )}`,
          );
          throw new HttpException(errorMessage.INVALID_TOKEN_OR_EXPIRED, 440);
          // throw new HttpException(sessResponse.message, sessResponse.statusCode)
        }

        const userObject: RequestUserDto = sessResponse.data;
        this.logger.log(
          `[AuthMiddleware] -> Success ✔ from E-wallet: ${JSON.stringify(
            userObject,
          )}`,
        );
        req.user = userObject;
      }

      next();
    } catch (err) {
      throw new HttpException(err?.message || '', 440);
    }
  }
}

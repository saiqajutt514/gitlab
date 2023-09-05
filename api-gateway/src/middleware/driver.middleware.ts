import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { errorMessage } from 'src/constants/error-message-constant';
import { RequestUserDto } from 'src/helpers/dto/requestUserDto';

import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class DriverAuthMiddleware implements NestMiddleware {

    private readonly logger = new LoggerHandler(DriverAuthMiddleware.name).getInstance();

    use(request: { user: RequestUserDto }, response: Response, next: NextFunction): void {

        const { user } = request;

        this.logger.log(`DriverId => ${user.driverId}`);

        if (user && user.id && !user.driverId) {
            this.logger.error(`DriverId => ${user.driverId} | ${errorMessage.UNAUTHORIZED_ACCESS_DENIED}`);

            throw new HttpException(errorMessage.UNAUTHORIZED_ACCESS_DENIED, HttpStatus.UNAUTHORIZED)
        }

        next();
    }
}
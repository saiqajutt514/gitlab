import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private readonly logger = new LoggerHandler('HTTP').getInstance();

  use(request: Request, response: Response, next: NextFunction): void {

    const { ip, method, baseUrl } = request;
    const userAgent = request.get('user-agent') || '';

    this.logger.log('START <<<---------------------------------------------------------------------------------------->>> START')
    this.logger.log(
      `REQUEST  => ${method} ${baseUrl} - ${userAgent} ${ip}`
    );

    response.on('finish', () => {
      const { statusCode, statusMessage = '' } = response;
      // const contentLength = response.get('content-length');

      this.logger.log(
        `RESPONSE => ${method} ${baseUrl} ${statusCode} ${statusMessage} - ${userAgent} ${ip}`
      );
      this.logger.log('END <<<---------------------------------------------------------------------------------------->>> END')
    });

    next();
  }
}
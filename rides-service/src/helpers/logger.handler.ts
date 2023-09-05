import { Injectable } from '@nestjs/common';
import appConfig from "config/appConfig";
import { PinoLogger } from "nestjs-pino";
import { CustomLogger } from 'src/logger/customLogger';
import { CustomLoggerProd } from 'src/logger/customLoggerProd';

@Injectable()
export class LoggerHandler {
  private loggerInstance;
  constructor(name?: string) {
    let contextName = name ?? 'LogHandler';
    if (appConfig().logMode == 'production') {
      let pinoLogger = new PinoLogger({})
      pinoLogger.setContext(contextName)
      this.loggerInstance = new CustomLoggerProd(pinoLogger, {})
    } else {
      this.loggerInstance = new CustomLogger(contextName);
    }
  }
  getInstance() {
    return this.loggerInstance
  }
}
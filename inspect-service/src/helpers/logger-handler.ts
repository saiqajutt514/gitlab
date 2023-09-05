import { Injectable, Logger } from '@nestjs/common';
import appConfig from "config/appConfig";
import { Logger as LoggerProd, PinoLogger } from "nestjs-pino";

@Injectable()
export class LoggerHandler {
  private loggerInstance;
  constructor(name?: string) {
    let contextName = name ?? 'LogHandler';
    if (appConfig().logMode == 'production') {
      let pinoLogger = new PinoLogger({})
      pinoLogger.setContext(contextName)
      this.loggerInstance = new LoggerProd(pinoLogger, {})
    } else {
      this.loggerInstance = new Logger(contextName);
    }
  }
  getInstance() {
    return this.loggerInstance
  }
}
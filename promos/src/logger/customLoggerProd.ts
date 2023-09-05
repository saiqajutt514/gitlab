import { Logger as LoggerProd } from "nestjs-pino";

export class CustomLoggerProd extends LoggerProd {

  notFoundLog(name: string) {
    this.error(`${name} not found`);
  }

  catchError(name: string, errMsg: string) {
    this.error(`[${name}] has some error: ` + errMsg);
  }

  msgPattern(name: string) {
    this.log(`----- @MessagePattern ${name} -----`)
  }

  eventPattern(name: string) {
    this.log(`----- @EventPattern ${name} -----`)
  }

  start(name: string) {
    this.log(`----- START ${name} -----`)
  }

  end(name: string) {
    this.log(`----- END ${name} -----`)
  }
}
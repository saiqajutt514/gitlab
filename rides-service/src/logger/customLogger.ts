import { Injectable, Scope, Logger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends Logger {

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
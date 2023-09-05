import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from "nestjs-pino";

import { typeOrmConfig } from 'config/typeOrmConfig';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogModule } from './modules/audit-log/audit-log.module';

console.log("in app module", typeOrmConfig)

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuditLogModule,
    LoggerModule.forRoot({
      pinoHttp:{
        name:'audit-service',
        level:'debug',
        formatters: {
          level: label => {
            return { level: label };
          }
        }
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

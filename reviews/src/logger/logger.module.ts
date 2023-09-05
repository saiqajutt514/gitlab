import { Module } from '@nestjs/common';
import { CustomLogger } from './customLogger';

@Module({
  providers: [CustomLogger],
  exports: [CustomLogger],
})

export class LoggerModule { }
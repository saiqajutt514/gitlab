import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

import { microServiceConfig } from 'config/microServiceConfig';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, microServiceConfig);
  app.listen(() => Logger.log("Audit Micro-service is listening"));
}
bootstrap();

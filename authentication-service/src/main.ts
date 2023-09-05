import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions } from '@nestjs/microservices';

import { AppModule } from './app.module';
import { authTCPMicroServiceConfig } from 'config/microServiceConfig';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>(authTCPMicroServiceConfig);

  await app.startAllMicroservicesAsync();

  logger.log("Auth Micro-service is listening");
}
bootstrap();

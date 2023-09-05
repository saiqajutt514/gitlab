import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { MicroserviceOptions } from '@nestjs/microservices';

import { promoCodesKafkaMicroServiceConfig, promoCodesTCPMicroServiceConfig } from './microServiceConfig';
import { CustomLogger } from './logger/customLogger';

const logger = new CustomLogger();

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>(promoCodesKafkaMicroServiceConfig);

  app.connectMicroservice<MicroserviceOptions>(promoCodesTCPMicroServiceConfig);

  app.useLogger(logger);

  await app.startAllMicroservicesAsync();

  logger.log("Promo codes micro-service is listening");
}

bootstrap();
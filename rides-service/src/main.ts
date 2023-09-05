require("dotenv").config();

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import appConfig from 'config/appConfig';

import { AppModule } from './app.module';
import { CustomLogger } from './logger/customLogger';
import { tripKafkaMicroServiceConfig, tripTCPMicroServiceConfig } from './microServicesConfigs';

const logger = new CustomLogger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>(tripKafkaMicroServiceConfig);

  app.connectMicroservice<MicroserviceOptions>(tripTCPMicroServiceConfig);

  app.useLogger(logger);

  await app.startAllMicroservicesAsync();

  app.listen(appConfig().apiPort, () => logger.log("Trip micro-service is listening"))
}

bootstrap();

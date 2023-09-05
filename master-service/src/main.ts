import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';
import { adminKafkaConfig, adminTCPConfig } from 'config/microServiceConfig';

//TODO: Remove after debug done
import appConfig from 'config/appConfig';
require("dotenv").config();

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kafka service
  app.connectMicroservice(adminKafkaConfig);

  // TCP service
  app.connectMicroservice(adminTCPConfig);

  app.startAllMicroservicesAsync();

  logger.log("Admin Micro-service is listening");
}
bootstrap();

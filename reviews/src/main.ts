require("dotenv").config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { reviewsKafkaConfig, reviewsTCPConfig } from './microService.config';
import { CustomLogger } from './logger/customLogger';

const logger = new CustomLogger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(logger);
  
  // Kafka service
  app.connectMicroservice(reviewsKafkaConfig);

  // TCP service
  app.connectMicroservice(reviewsTCPConfig);

  app.startAllMicroservicesAsync();
  logger.log("Reviews Micro-service is listening");
}

bootstrap();

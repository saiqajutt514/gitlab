require("dotenv").config();

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';
import { notificationKafkaConfig, notificationTCPConfig } from 'config/microServiceConfig';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kafka service
  app.connectMicroservice(notificationKafkaConfig)
  
  // TCP service
  app.connectMicroservice(notificationTCPConfig)

  app.startAllMicroservicesAsync();

  logger.log('Notification Micro-service is listening');
}
bootstrap();

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import appConfig from 'config/appConfig';

import { AppModule } from './app.module';
import { paymentKafkaConfig, paymentTCPConfig } from './microServicesConfigs';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Kafka service
  app.connectMicroservice(paymentKafkaConfig)
  
  // TCP service
  app.connectMicroservice(paymentTCPConfig)

  app.startAllMicroservicesAsync();
  
  app.listen(appConfig().apiPort, () => logger.log('Payment Micro-service is listening'));
}

bootstrap();

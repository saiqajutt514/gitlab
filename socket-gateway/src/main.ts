require('dotenv').config();

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { socketMicroServiceConfig } from 'src/microServicesConfigs';
import { SocketIoAdapter } from 'src/custom/socket-io.adapter';
import { socketTCPConfig } from './microServicesConfigs/socket.microservice.config';
import { MicroserviceOptions } from '@nestjs/microservices';

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.createMicroservice(
    AppModule,
    socketMicroServiceConfig,
  );
  // const app = await NestFactory.createMicroservice(AppModule, socketTCPConfig);
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  app.listen(() => logger.log('Socket Micro-service is listening'));

  // const app2 = await NestFactory.create(AppModule);
  // app2.connectMicroservice<MicroserviceOptions>(socketTCPConfig);
  // await app2.startAllMicroservicesAsync();
}
bootstrap();

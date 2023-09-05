import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

import { microServiceConfig } from 'config/microServiceConfig';
import { SocketIoAdapter } from 'src/custom/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, microServiceConfig);
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  app.listen(() => Logger.log("Chat Micro-service is listening"));
}
bootstrap();

import appConfig from 'config/appConfig';
import { ValidationPipe } from '@nestjs/common';
require("dotenv").config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))

  await app.listen(appConfig().apiPort);
}
bootstrap();

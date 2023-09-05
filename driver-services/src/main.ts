import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";

import { AppModule } from "./app.module";
import { captainTCPConfig, microServiceConfig } from "./microServiceConfig";
import appConfig from "config/appConfig";

const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kafka service
  app.connectMicroservice(microServiceConfig);

  // TCP service
  app.connectMicroservice(captainTCPConfig);

  await app.startAllMicroservicesAsync();

  app.listen(appConfig().apiPort, () =>
    logger.log("Captain micro-service is listening")
  );
}
bootstrap();

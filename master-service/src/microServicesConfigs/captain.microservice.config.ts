import { ClientOptions, KafkaOptions, Transport } from '@nestjs/microservices';
import appConfig from 'config/appConfig';

export const captainTCPConfig: ClientOptions = {
  transport: Transport.TCP,
  options: {
    host: appConfig().CaptainTCPHost,
    port: Number(appConfig().CaptainTCPPort),
  },
};

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  TCPHost: process.env.TCP_HOST,
  TcpPort: process.env.TCP_PORT,
  KafkaHost: process.env.KAFKA_HOST,
  googleKey: process.env.GOOGLE_KEY,
  mapsUrl: process.env.MAPS_URL,
  logMode: process.env.LOG_MODE,
  TripTCPHost: process.env.TRIP_TCP_HOST,
  TripTcpPort: process.env.TRIP_TCP_PORT,
}));

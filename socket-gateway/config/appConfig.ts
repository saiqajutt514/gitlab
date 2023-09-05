import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  TCPHost: process.env.TCP_HOST,
  TCPPort: process.env.TCP_PORT,
  KafkaHost: process.env.KAFKA_HOST,
  socketPort: process.env.SOCKET_PORT,
  socketUrl: process.env.SOCKET_URL,
  RedisHost: process.env.REDIS_HOST,
  RedisPort: process.env.REDIS_PORT,
  CaptainTCPHost: process.env.CAPTAIN_TCP_HOST,
  CaptainPortTCP: process.env.CAPTAIN_TCP_PORT,
  TripTCPHost: process.env.TRIP_TCP_HOST,
  TripTcpPort: process.env.TRIP_TCP_PORT,
  AdminTCPHost: process.env.ADMIN_TCP_HOST,
  AdminTcpPort: process.env.ADMIN_TCP_PORT,
  transportType: parseInt(process.env.TRANSPORT_TYPE),
}));

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  KafkaHost: process.env.KAFKA_HOST,
  RedisHost: process.env.REDIS_HOST,
  RedisPort: process.env.REDIS_PORT,
  logMode: process.env.LOG_MODE
}));

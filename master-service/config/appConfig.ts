import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  JwtSecret: process.env.JWT_SECRET,
  KafkaHost: process.env.KAFKA_HOST,
  RedisHost: process.env.REDIS_HOST,
  RedisPort: process.env.REDIS_PORT,
  TCPHost: process.env.TCP_HOST,
  TCPPort: process.env.TCP_PORT,
  CaptainTCPHost: process.env.CAPTAIN_TCP_HOST,
  CaptainTCPPort: process.env.CAPTAIN_TCP_PORT,
  s3Bucket: process.env.S3_BUCKET,
  s3Region: process.env.S3_REGION,
  s3AccessKey: process.env.S3_ACCESS_KEY,
  s3SecretKey: process.env.S3_SECRET_KEY,
  s3AccessURL: process.env.S3_ACCESS_URL,

  adminBaseUrl: process.env.ADMIN_BASE_URL,
  resetLinkExpiry: process.env.ADMIN_RESETLINK_EXPIRY_TIME,
  logMode: process.env.LOG_MODE,
}));

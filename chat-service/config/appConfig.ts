import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  KafkaHost: process.env.KAFKA_HOST,
  RedisHost: process.env.REDIS_HOST,
  RedisPort: process.env.REDIS_PORT,
  socketPort: process.env.SOCKET_PORT,
	socketUrl: process.env.SOCKET_URL,
  logMode: process.env.LOG_MODE,
  
  ReviewTCPHost: process.env.REVIEW_TCP_HOST,
  ReviewTCPPort: process.env.REVIEW_TCP_PORT,

  s3Region: process.env.S3_REGION,
  s3AccessKey: process.env.S3_ACCESS_KEY,
  s3SecretKey: process.env.S3_SECRET_KEY,

  s3Bucket: process.env.S3_BUCKET,
  s3ChatBucket: process.env.S3_CHAT_BUCKET,
  s3PublicBucket: process.env.S3_PUBLIC_BUCKET,

  s3AccessURL: process.env.S3_ACCESS_URL,
  s3ChatAccessURL: process.env.S3_CHAT_ACCESS_URL,
  s3PublicAccessURL: process.env.S3_PUBLIC_ACCESS_URL
}));

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  apiPort: process.env.API_PORT,

  JwtSecret: process.env.JWT_SECRET,
  JwtExpires: process.env.JWT_EXPIRES,
  sessExpires: process.env.SESSION_EXPIRE_TIME,

  KafkaHost: process.env.KAFKA_HOST,
  RedisHost: process.env.REDIS_HOST,
  RedisPort: process.env.REDIS_PORT,
  CaptainTCPHost: process.env.CAPTAIN_TCP_HOST,
  CaptainPortTCP: process.env.CAPTAIN_TCP_PORT,
  TripTCPHost: process.env.TRIP_TCP_HOST,
  TripTcpPort: process.env.TRIP_TCP_PORT,
  PaymentTCPHost: process.env.PAYMENT_TCP_HOST,
  PaymentTCPPort: process.env.PAYMENT_TCP_PORT,
  PromocodesTCPHost: process.env.PROMO_CODES_TCP_HOST,
  PromoCodesTcpPort: process.env.PROMO_CODES_TCP_PORT,
  AdminTCPHost: process.env.ADMIN_TCP_HOST,
  AdminTCPPort: process.env.ADMIN_TCP_PORT,
  ReviewTCPHost: process.env.REVIEW_TCP_HOST,
  ReviewTCPPort: process.env.REVIEW_TCP_PORT,
  AuthTCPHost: process.env.AUTH_TCP_HOST,
  AuthTcpPort: process.env.AUTH_TCP_PORT,
  NotificationTCPHost: process.env.NOTIFICATION_TCP_HOST,
  NotificationTCPPort: process.env.NOTIFICATION_TCP_PORT,

  ociConfigFile: process.env.OCI_CONFIG_FILE,
  ociNameSpace: process.env.OCI_NAMESPACE,
  ociBucket: process.env.OCI_BUCKET,
  ociAccessUrl: process.env.OCI_ACCESS_URL,

  s3Region: process.env.S3_REGION,
  s3AccessKey: process.env.S3_ACCESS_KEY,
  s3SecretKey: process.env.S3_SECRET_KEY,

  s3Bucket: process.env.S3_BUCKET,
  s3ChatBucket: process.env.S3_CHAT_BUCKET,

  s3PublicBucket: process.env.S3_PUBLIC_BUCKET,

  s3AccessURL: process.env.S3_ACCESS_URL,
  s3ChatAccessURL: process.env.S3_CHAT_ACCESS_URL,
  s3PublicAccessURL: process.env.S3_PUBLIC_ACCESS_URL,
  logMode: process.env.LOG_MODE,

  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT),
  smtpSecure: JSON.parse(process.env.SMTP_SECURE),
  smtpUsername: process.env.SMTP_USERNAME,
  smtpPassword: process.env.SMTP_PASSWORD,
}));

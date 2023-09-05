import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  TcpHost: process.env.TCP_HOST,
  TcpPort: process.env.TCP_PORT,
  apiPort: process.env.API_PORT,
  KafkaHost: process.env.KAFKA_HOST,
  RedisHost: process.env.REDIS_HOST,
  RedisPort: process.env.REDIS_PORT,
  CaptainTCPHost: process.env.CAPTAIN_TCP_HOST,
  CaptainPortTCP: process.env.CAPTAIN_TCP_PORT,
  PaymentTCPHost: process.env.PAYMENT_TCP_HOST,
  PaymentTCPPort: process.env.PAYMENT_TCP_PORT,
  PromocodesTCPHost: process.env.PROMO_CODES_TCP_HOST,
  PromoCodesTcpPort: process.env.PROMO_CODES_TCP_PORT,
  ReviewTCPHost: process.env.REVIEW_TCP_HOST,
  ReviewTCPPort: process.env.REVIEW_TCP_PORT,

  dakhliGosiApi: process.env.DAKHKLI_GOSI_API,
  dakhliGosiAppId: process.env.DAKHKLI_GOSI_APP_ID,
  dakhliGosiAppKey: process.env.DAKHKLI_GOSI_APP_KEY,

  dakhliGovtApi: process.env.DAKHKLI_GOVT_API,
  dakhliGovtAppId: process.env.DAKHKLI_GOVT_APP_ID,
  dakhliGovtAppKey: process.env.DAKHKLI_GOVT_APP_KEY,

  dakhliPlatformKey: process.env.DAKHKLI_PLATFORM_KEY,
  dakhliOrganizationNumber: process.env.DAKHKLI_ORGANIZATION_NUMBER,
  dakhliRequestReason: process.env.DAKHKLI_REQUEST_REASON,

  SocketTCPHost: process.env.SOCKET_TCP_HOST,
  SocketTCPPort: process.env.SOCKET_TCP_PORT,

  googleKey: process.env.GOOGLE_KEY,

  s3Bucket: process.env.S3_BUCKET,
  s3Region: process.env.S3_REGION,
  s3AccessKey: process.env.S3_ACCESS_KEY,
  s3SecretKey: process.env.S3_SECRET_KEY,
  s3AccessURL: process.env.S3_ACCESS_URL,

  logMode: process.env.LOG_MODE,
}));

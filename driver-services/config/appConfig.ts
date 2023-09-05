import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  apiPort: process.env.API_PORT,
  TCPHost: process.env.TCP_HOST,
  TCPPort: process.env.TCP_PORT,
  KafkaHost: process.env.KAFKA_HOST,
  RedisHost: process.env.REDIS_HOST,
  RedisPort: process.env.REDIS_PORT,

  PaymentTCPHost: process.env.PAYMENT_TCP_HOST,
  PaymentTCPPort: process.env.PAYMENT_TCP_PORT,
  ReviewTCPHost: process.env.REVIEW_TCP_HOST,
  ReviewTCPPort: process.env.REVIEW_TCP_PORT,
  TripTCPHost: process.env.TRIP_TCP_HOST,
  TripTcpPort: process.env.TRIP_TCP_PORT,
  AuthTCPHost: process.env.AUTH_TCP_HOST,
  AuthTcpPort: process.env.AUTH_TCP_PORT,
  AdminTCPHost: process.env.ADMIN_TCP_HOST,
  AdminTCPPort: process.env.ADMIN_TCP_PORT,

  PromocodesTCPHost: process.env.PROMO_CODES_TCP_HOST,
  PromoCodesTcpPort: process.env.PROMO_CODES_TCP_PORT,
  googleKey: process.env.GOOGLE_KEY,
  waslEndPoint: process.env.WASL_END_POINT,
  isWASL: process.env.IS_WASL_LIVE,
  waslAppId: process.env.WASL_APP_ID,
  waslAppKey: process.env.WASL_APP_KEY,
  waslClientId: process.env.WASL_CLIENT_ID,
  logMode: process.env.LOG_MODE,

  s3AccessURL: process.env.S3_ACCESS_URL,
}));

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  TCPHost: process.env.TCP_HOST,
  TcpPort: process.env.TCP_PORT,

  KafkaHost: process.env.KAFKA_HOST,

  unifonicApiUrl: process.env.UNIFONIC_API_URL,
  unifonicSendSmsEndpoint: process.env.UNIFONIC_SEND_SMS_ENDPOINT,
  unifonicUsername: process.env.UNIFONIC_USERNAME,
  unifonicPassword: process.env.UNIFONIC_PASSWORD,
  unifonicAppSid: process.env.UNIFONIC_APP_SID,
  unifonicSenderId: process.env.UNIFONIC_SENDER_ID,

  yakeenApiUrl: process.env.YAKEEN_API_URL,
  yakeenChargecode: process.env.YAKEEN_CHARGE_CODE,
  yakeenUsername: process.env.YAKEEN_USERNAME,
  yakeenPassword: process.env.YAKEEN_PASSWORD,

  dakhliApi: process.env.DAKHKLI_INCOME_API,
  dakhliAppId: process.env.DAKHKLI_APP_ID,
  dakhliAppKey: process.env.DAKHKLI_APP_KEY,
  dakhliPlatformKey: process.env.DAKHKLI_PLATFORM_KEY,
  dakhliOrganizationNumber: process.env.DAKHKLI_ORGANIZATION_NUMBER,
  dakhliRequestReason: process.env.DAKHKLI_REQUEST_REASON,

  proxyHost: process.env.PROXY_HOST,
  proxyPort: parseInt(process.env.PROXY_PORT),

  otpExpiryTime: parseInt(process.env.OTP_EXPIRY_TIME),
  otpResendTime: parseInt(process.env.OTP_RESEND_TIME),

  // pleas use these in env instead of upper one.
  otpExpiryTimeInMin: parseInt(process.env.OTP_EXPIRY_TIME_IN_MIN),
  otpResendTimeInSec: parseInt(process.env.OTP_RESEND_TIME_IN_SEC),
  otpVerifyLimitCount: parseInt(process.env.OTP_VERIFY_LIMIT_COUNT),
  OtpSendHourlyLimit: parseInt(process.env.OTP_SEND_HOURLY_LIMIT),

  mode: process.env.MODE,

  jwtSecretKey: process.env.JWT_SECRET,
  tokenExpiryTime: process.env.TOKEN_EXPIRY_TIME,

  TripTCPHost: process.env.TRIP_TCP_HOST,
  TripTcpPort: process.env.TRIP_TCP_PORT,
  CaptainTCPHost: process.env.CAPTAIN_TCP_HOST,
  CaptainPortTCP: process.env.CAPTAIN_TCP_PORT,

  eWalletApiUrl: process.env.EWALLET_API_URL,
  eWalletChannel: process.env.EWALLET_CHANNEL,
  eWalletUsername: process.env.EWALLET_USERNAME,
  eWalletPassword: process.env.EWALLET_PASSWORD,

  RedisHost: process.env.REDIS_HOST,
  RedisPort: process.env.REDIS_PORT,

  logMode: process.env.LOG_MODE,
}));

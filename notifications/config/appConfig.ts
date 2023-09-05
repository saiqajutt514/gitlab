import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    KafkaHost: process.env.KAFKA_HOST,
    RedisHost: process.env.REDIS_HOST,
    RedisPort: process.env.REDIS_PORT,
    TCPHost: process.env.TCP_HOST,
    TCPPort: process.env.TCP_PORT,

    eWalletApiUrl: process.env.EWALLET_API_URL,
    eWalletChannel: process.env.EWALLET_CHANNEL,
    eWalletUsername: process.env.EWALLET_USERNAME,
    eWalletPassword: process.env.EWALLET_PASSWORD,
    eWalletSpId: process.env.EWALLET_SP_ID,

    smtpHost: process.env.SMTP_HOST,
    smtpPort: Number(process.env.SMTP_PORT),
    smtpSecure: JSON.parse(process.env.SMTP_SECURE),
    smtpUsername: process.env.SMTP_USERNAME,
    smtpPassword: process.env.SMTP_PASSWORD,

    fcmServerKey: process.env.FCM_SERVER_KEY,
    logMode: process.env.LOG_MODE,
    s3PublicBucket: process.env.S3_TRANSPORT_ACCESS_URL
}));

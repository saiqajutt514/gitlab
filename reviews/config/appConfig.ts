
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    KafkaHost: process.env.KAFKA_HOST,
    TCPPort: process.env.TCP_PORT,
    logMode: process.env.LOG_MODE,
    TCPHost: process.env.TCP_HOST
}));
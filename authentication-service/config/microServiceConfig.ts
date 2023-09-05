import { KafkaOptions, Transport, TcpOptions } from "@nestjs/microservices";
import appConfig from "config/appConfig";

export const authKafkaMicroServiceConfig: KafkaOptions = {
    transport: Transport.KAFKA,

    options: {
        client: {
            clientId: 'auth-service',
            brokers: [...`${appConfig().KafkaHost}`.split(",")],
            connectionTimeout: 3000, // Time in milliseconds to wait for a successful connection. The default value is: 1000.

            // reference: https://kafka.js.org/docs/1.10.0/configuration#a-name-retry-a-default-retry
            // retry logic for KafkaJSNumberOfRetriesExceeded = Random(previousRetryTime * (1 - factor), previousRetryTime * (1 + factor)) * multiplier
            retry: {
              initialRetryTime: 300, // Initial value used to calculate the retry in milliseconds
              maxRetryTime: 30000, //Maximum wait time for a retry in milliseconds
              retries: 15,
              factor: 0.2,
              multiplier: 2
            }
        },
        consumer: {
            groupId: 'auth-consumer',
      
            retry: { retries: 30 },
        },
        subscribe: {
            fromBeginning: false,
        }
    }
};

export const authTCPMicroServiceConfig: TcpOptions = {
    transport: Transport.TCP,
    options: {
        host: appConfig().TCPHost,
        port: Number(appConfig().TcpPort)
    }
}
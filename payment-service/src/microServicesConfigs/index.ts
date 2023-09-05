import { paymentKafkaConfig, paymentTCPConfig } from 'src/microServicesConfigs/payment.microservice.config';
import { captainKafkaConfig, captainTCPConfig } from 'src/microServicesConfigs/captain.microservice.config';
import { tripKafkaMicroServiceConfig, tripTCPMicroServiceConfig } from 'src/microServicesConfigs/trip.microservice.config';
import { notificationKafkaConfig } from 'src/microServicesConfigs/notification.microservice.config';
import { socketMicroServiceConfig } from 'src/microServicesConfigs/socket.microservice.config';

export {
    paymentKafkaConfig,
    paymentTCPConfig,
    captainKafkaConfig,
    captainTCPConfig,
    tripKafkaMicroServiceConfig,
    tripTCPMicroServiceConfig,
    notificationKafkaConfig,
    socketMicroServiceConfig
}
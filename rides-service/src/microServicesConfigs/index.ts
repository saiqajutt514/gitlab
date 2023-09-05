import { reviewsKafkaConfig, reviewsTCPConfig } from './reviews.microservices.config';
import { captainKafkaConfig, captainTCPConfig } from 'src/microServicesConfigs/captain.microservice.config';
import { promoCodesKafkaMicroServiceConfig, promoCodesTCPMicroServiceConfig } from 'src/microServicesConfigs/promocode.microservice.config';
import { tripKafkaMicroServiceConfig, tripTCPMicroServiceConfig } from 'src/microServicesConfigs/trip.microservice.config';
import { socketMicroServiceConfig } from 'src/microServicesConfigs/socket.microservice.config';
import { notificationKafkaConfig } from 'src/microServicesConfigs/notification.microservice.config';
import { paymentKafkaConfig, paymentTCPConfig } from 'src/microServicesConfigs/payment.microservice.config';
export {
    tripKafkaMicroServiceConfig,
    tripTCPMicroServiceConfig,
    promoCodesKafkaMicroServiceConfig,
    promoCodesTCPMicroServiceConfig,
    captainKafkaConfig,
    captainTCPConfig,
    reviewsKafkaConfig,
    reviewsTCPConfig,
    socketMicroServiceConfig,
    notificationKafkaConfig,
    paymentKafkaConfig,
    paymentTCPConfig
}
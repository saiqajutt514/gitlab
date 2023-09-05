import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';

import { paymentKafkaConfig, paymentTCPConfig } from 'src/microServiceConfigs';
import {
  GET_ALL_SUBSCRIPTIONS,
  GET_SUBSCRIPTION_DETAIL,
  subscriptionRequestPattern
} from './kafka-constants';

@Injectable()
export class SubscriptionService {

  // @Client(paymentKafkaConfig)
  // clientPaymentKafka: ClientKafka;

  @Client(paymentTCPConfig)
  clientPaymentTCP: ClientProxy;

  onModuleInit() {
    // subscriptionRequestPattern.forEach(pattern => {
    //   this.clientPaymentKafka.subscribeToResponseOf(pattern);
    // });
  }

  async findAll() {
    try {
      return await this.clientPaymentTCP.send(GET_ALL_SUBSCRIPTIONS, JSON.stringify({})).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }

  }

  async findOne(id: string) {
    try {
      return await this.clientPaymentTCP.send(GET_SUBSCRIPTION_DETAIL, JSON.stringify({ id })).pipe().toPromise()
    } catch (error) {
      throw new BadGatewayException(error)
    }
  }

}

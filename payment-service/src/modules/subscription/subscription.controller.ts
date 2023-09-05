import { Controller, Post } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';

import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

import {
  CREATE_SUBSCRIPTION,
  UPDATE_SUBSCRIPTION,
  DELETE_SUBSCRIPTION,
  GET_ALL_SUBSCRIPTIONS,
  GET_SUBSCRIPTION_DETAIL,
  DASHBOARD_SUBSCRIPTION_STATS,
} from '../../constants/kafka-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller()
export class SubscriptionController {
  private readonly logger = new LoggerHandler(
    SubscriptionController.name,
  ).getInstance();
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @MessagePattern(CREATE_SUBSCRIPTION, Transport.TCP)
  async create(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::subscription::${CREATE_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const data: CreateSubscriptionDto = message.value;
    return await this.subscriptionService.create(data);
  }

  @MessagePattern(GET_ALL_SUBSCRIPTIONS, Transport.TCP)
  async findAll() {
    return await this.subscriptionService.findAll();
  }
  @Post()
  async findAllPost() {
    return await this.subscriptionService.findAll();
  }
  @MessagePattern(GET_SUBSCRIPTION_DETAIL, Transport.TCP)
  async findOne(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::subscription::${GET_SUBSCRIPTION_DETAIL}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const id: string = message.value?.id;
    return await this.subscriptionService.findOne(id);
  }

  @MessagePattern(UPDATE_SUBSCRIPTION, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::subscription::${UPDATE_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const id: string = message.value?.id;
    const data: UpdateSubscriptionDto = message.value?.data;
    return await this.subscriptionService.update(id, data);
  }

  @MessagePattern(DELETE_SUBSCRIPTION, Transport.TCP)
  async remove(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::subscription::${DELETE_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const id: string = message.value?.id;
    return await this.subscriptionService.remove(id);
  }

  // dashboard subscription stats
  @MessagePattern(DASHBOARD_SUBSCRIPTION_STATS, Transport.TCP)
  async suscriptionDetailsDashboard(@Payload() payload) {
    const message = JSON.parse(payload);
    this.logger.log(
      `payment::subscription::${DASHBOARD_SUBSCRIPTION_STATS}::recv -> ${JSON.stringify(
        message,
      )}`,
    );
    return await this.subscriptionService.suscriptionDetailsDashboard(message);
  }
}

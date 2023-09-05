import { Controller, Logger } from '@nestjs/common';
import {
  EventPattern,
  MessagePattern,
  Payload,
  Transport,
} from '@nestjs/microservices';

import {
  CREATE_USER_SUBSCRIPTION,
  UPDATE_USER_SUBSCRIPTION,
  GET_ALL_USER_SUBSCRIPTIONS,
  GET_USER_SUBSCRIPTION_DETAIL,
  CANCEL_USER_SUBSCRIPTION,
  ACTIVATE_USER_SUBSCRIPTION,
  GET_USER_SUBSCRIPTION_COUNT,
  CHANGE_AUTO_RENEWAL_STATUS,
  SUBSCRIBERS_FROM_SUSCRIPTION_ID,
  SUBSCRIPTION_DETAILS_FROM_USERID,
} from '../../constants/kafka-constant';

import { UserSubscriptionService } from './user-subscription.service';
import {
  CreateUserSubscriptionDto,
  UpdateUserSubscriptionDto,
} from './dto/user-subscription.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller()
export class UserSubscriptionController {
  private readonly logger = new LoggerHandler(
    UserSubscriptionController.name,
  ).getInstance();
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  @EventPattern(CREATE_USER_SUBSCRIPTION, Transport.KAFKA)
  async create(@Payload() message) {
    this.logger.log(
      `payment::user-subscription::${CREATE_USER_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const data: CreateUserSubscriptionDto = message.value?.params;
    const transactionId: string = message.value?.transactionId;
    return await this.userSubscriptionService.create(data, transactionId);
  }

  @MessagePattern(GET_ALL_USER_SUBSCRIPTIONS, Transport.TCP)
  async findAll(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::user-subscription::${GET_ALL_USER_SUBSCRIPTIONS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.userSubscriptionService.findAll(message.value);
  }

  @MessagePattern(GET_USER_SUBSCRIPTION_DETAIL, Transport.TCP)
  async findOne(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::user-subscription::${GET_USER_SUBSCRIPTION_DETAIL}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.userSubscriptionService.findOne(message.value);
  }

  @MessagePattern(UPDATE_USER_SUBSCRIPTION, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::user-subscription::${UPDATE_USER_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const id: string = message.value?.id;
    const data: UpdateUserSubscriptionDto = message.value?.data;
    return await this.userSubscriptionService.update(id, data);
  }

  @MessagePattern(CANCEL_USER_SUBSCRIPTION, Transport.TCP)
  async cancel(@Payload() payload) {
    const message = { value: payload };
    this.logger.log(
      `payment::user-subscription::${CANCEL_USER_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const userId: string = message.value;
    return await this.userSubscriptionService.cancel(userId);
  }

  @MessagePattern(ACTIVATE_USER_SUBSCRIPTION, Transport.TCP)
  async activate(@Payload() payload) {
    const message = { value: payload };
    this.logger.log(
      `payment::user-subscription::${ACTIVATE_USER_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const userId: string = message.value;
    return await this.userSubscriptionService.activate(userId);
  }

  @MessagePattern(GET_USER_SUBSCRIPTION_COUNT, Transport.TCP)
  async getCount(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::user-subscription::${GET_USER_SUBSCRIPTION_COUNT}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.userSubscriptionService.getCount(message.value);
  }

  @MessagePattern(CHANGE_AUTO_RENEWAL_STATUS, Transport.TCP)
  async changeAutoRenewalStatus(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::user-subscription::${CHANGE_AUTO_RENEWAL_STATUS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.userSubscriptionService.changeAutoRenewalStatus(
      message.value,
    );
  }
  // subscription id ki base pa subscibers lata
  @MessagePattern(SUBSCRIBERS_FROM_SUSCRIPTION_ID, Transport.TCP)
  async subscibersFromSubscriptionId(@Payload() payload) {
    const subId = JSON.parse(payload);
    this.logger.log(
      `payment::subscibersFromSubscriptionId::${'SUBSCRIBERS_FROM_SUSCRIPTION_ID'}::recv -> ${JSON.stringify(
        subId,
      )}`,
    );
    return await this.userSubscriptionService.subscibersFromSubscriptionId(
      subId.subId,
    );
  }

  // userId ki base pa subscription ka data lata
  @MessagePattern(SUBSCRIPTION_DETAILS_FROM_USERID, Transport.TCP)
  async getSusscriptionDetailsbyUserId(@Payload() payload) {
    const userId = JSON.parse(payload);
    this.logger.log(
      `payment::subscibersFromSubscriptionId::${'SUBSCRIPTION_DETAILS_FROM_USERID'}::recv -> ${JSON.stringify(
        userId,
      )}`,
    );
    return await this.userSubscriptionService.getSusscriptionDetailsbyUserId(
      userId.userIds,
    );
  }
}

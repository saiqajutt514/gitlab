import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';

import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  ListSearchSortDto,
  EarningListParams,
  StatsParams,
} from './interface/transaction.interface';

import {
  CREATE_TRANSACTION,
  UPDATE_TRANSACTION,
  GET_ALL_TRANSACTIONS,
  GET_TRANSACTION_DETAIL,
  GET_ALL_USER_TRANSACTIONS,
  GET_DRIVER_SUBSCRIPTIONS,
  GET_ACTIVE_SUBSCRIPTIONS,
  GET_EXPIRED_SUBSCRIPTIONS,
  DASHBOARD_GET_EARNINGS,
  GET_USER_EARNINGS,
  DASHBOARD_GET_SINGLE_DAY_EARNING,
  DASHBOARD_CASH_FLOW,
  DASHBOARD_EARNING_TOPUP_GRAPH,
  DASHBOARD_SPENT_TOPUP_GRAPH,
  DASHBOARD_EARNING_AVERAGE_GRAPH,
} from '../../constants/kafka-constant';
import { SubscriptionEarningDto } from './dto/subscription-earning.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller()
export class TransactionController {
  private readonly logger = new LoggerHandler(
    TransactionController.name,
  ).getInstance();
  constructor(private readonly transactionService: TransactionService) {}

  @MessagePattern(CREATE_TRANSACTION, Transport.TCP)
  async create(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transaction::${CREATE_TRANSACTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const data: CreateTransactionDto = message.value;
    return await this.transactionService.create(data);
  }

  @MessagePattern(GET_ALL_TRANSACTIONS, Transport.TCP)
  async findAll() {
    return await this.transactionService.findAll();
  }

  @MessagePattern(GET_TRANSACTION_DETAIL, Transport.TCP)
  async findOne(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transaction::${GET_TRANSACTION_DETAIL}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const id: string = message.value?.id;
    return await this.transactionService.findOne(id);
  }

  @MessagePattern(UPDATE_TRANSACTION, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transaction::${UPDATE_TRANSACTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const id: string = message.value?.id;
    const data: UpdateTransactionDto = message.value?.data;
    return await this.transactionService.update(id, data);
  }

  @MessagePattern(GET_ALL_USER_TRANSACTIONS, Transport.TCP)
  async findAllTransactions(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    const params: ListSearchSortDto = message.value;
    this.logger.log(
      `payment::transaction::${GET_ALL_USER_TRANSACTIONS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.transactionService.findAllTransactions(message.value);
  }

  @MessagePattern(GET_DRIVER_SUBSCRIPTIONS, Transport.TCP)
  async findDriverSubscriptions(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transaction::${GET_DRIVER_SUBSCRIPTIONS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const data: ListSearchSortDto = message.value?.criteria;
    data.filters.userId = message.value?.id;
    return await this.transactionService.findDriverTransactions(data);
  }

  @MessagePattern(GET_ACTIVE_SUBSCRIPTIONS, Transport.TCP)
  async findActiveSubscriptions(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transaction::${GET_ACTIVE_SUBSCRIPTIONS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const data: ListSearchSortDto = message.value;
    const type: string = 'active';
    return await this.transactionService.findAllSubscriptions(data, type);
  }

  @MessagePattern(GET_EXPIRED_SUBSCRIPTIONS, Transport.TCP)
  async findExpiredSubscriptions(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transaction::${GET_EXPIRED_SUBSCRIPTIONS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const data: ListSearchSortDto = message.value;
    const type: string = 'expired';
    return await this.transactionService.findAllSubscriptions(data, type);
  }

  @MessagePattern(DASHBOARD_GET_EARNINGS, Transport.TCP)
  async getEarnings(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    const params: EarningListParams = message.value;
    this.logger.log(
      `payment::transaction::${DASHBOARD_GET_EARNINGS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.transactionService.getDashboardEarnings(message.value);
  }

  @MessagePattern(GET_USER_EARNINGS, Transport.TCP)
  async findAllEarningsByUser(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transaction::${GET_USER_EARNINGS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const userId: string = message.value?.userId;
    const body: SubscriptionEarningDto = message.value?.body;
    return await this.transactionService.findAllEarningsByUser(userId, body);
  }
  @MessagePattern(DASHBOARD_CASH_FLOW, Transport.TCP)
  async cashflows(@Payload() payload) {
    const date = JSON.parse(payload);
    return await this.transactionService.cashflows(date);
  }

  // mujtaba graph implementation
  @MessagePattern(DASHBOARD_EARNING_TOPUP_GRAPH, Transport.TCP)
  async earningAndTopupGraph(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    const body: StatsParams = message.value?.body;
    const userId: string = message.value?.userId;
    const entityType: any = message.value?.entityType;
    return await this.transactionService.earningAndTopupGraph(
      userId,
      entityType,
      body,
    );
  }
  // mujtaba graph implementation
  @MessagePattern(DASHBOARD_SPENT_TOPUP_GRAPH, Transport.TCP)
  async topupAndSpentGraph(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    const body: StatsParams = message.value?.body;
    const userId: string = message.value?.userId;
    return await this.transactionService.topupAndSpentGraph(userId, body);
  }
  // mujtaba graph implementation
  @MessagePattern(DASHBOARD_GET_SINGLE_DAY_EARNING, Transport.TCP)
  async getSingleDayEarning(@Payload() payload) {
    const date = JSON.parse(payload);
    return await this.transactionService.getSingleDayEarning(date);
  }

  // mujtaba graph implementation
  @MessagePattern(DASHBOARD_EARNING_AVERAGE_GRAPH, Transport.TCP)
  async captainAverageEarningGraph(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    const body: StatsParams = message.value?.body;
    const userId: string = message.value?.userId;
    const entityType: any = message.value?.entityType;
    return await this.transactionService.captainAverageEarningGraph(
      userId,
      entityType,
      body,
    );
  }
}

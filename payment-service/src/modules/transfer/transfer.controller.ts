import { Body, Controller, Logger, Post } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { TransferService } from './transfer.service';
import {
  BLOCK_AMOUNT,
  UPDATE_AMOUNT,
  RELEASE_AMOUNT,
  CONFIRM_AMOUNT,
  GET_SUBSCRIPTION_TRANSACTIONS,
  ADD_SUBSCRIPTION_TRANSACTION,
  GET_BALANCE,
  ADD_BALANCE,
  GET_INVOICE_QR,
} from 'src/constants/kafka-constant';
import {
  HoldDto,
  HoldConfirmDto,
  HoldUpdateDto,
} from './dto/transfer-amounts.dto';
import { SubscriptionRequestDTO } from './dto/subscription-transaction.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller()
export class TransferController {
  private readonly logger = new LoggerHandler(
    TransferController.name,
  ).getInstance();
  constructor(private transferService: TransferService) {}

  @MessagePattern(GET_BALANCE, Transport.TCP)
  async getBalance(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log('[GET_BALANCE]');
    const id = message.value?.externalId;
    return await this.transferService.getBalance(id);
  }

  @MessagePattern(BLOCK_AMOUNT, Transport.TCP)
  async blockAmount(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log('[BLOCK_AMOUNT]');
    const data: HoldDto = message.value?.data;
    return await this.transferService.blockAmount(data);
  }

  @MessagePattern(UPDATE_AMOUNT, Transport.TCP)
  async updateBlockedAmount(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log('[UPDATE_AMOUNT]');
    const data: HoldUpdateDto = message.value?.data;
    return await this.transferService.updateBlockedAmount(data);
  }

  @MessagePattern(CONFIRM_AMOUNT, Transport.TCP)
  async confirmBlockedAmount(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log('[CONFIRM_AMOUNT]');
    const data: HoldConfirmDto = message.value?.data;
    return await this.transferService.confirmBlockedAmount(data);
  }

  @MessagePattern(RELEASE_AMOUNT, Transport.TCP)
  async releaseBlockedAmount(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log('[RELEASE_AMOUNT]');
    const data: HoldConfirmDto = message.value?.data;
    return await this.transferService.releaseBlockedAmount(data);
  }

  @MessagePattern(GET_INVOICE_QR, Transport.TCP)
  async generateBase64QRcode(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      '[generateBase64QRcode] payload:' + JSON.stringify(message.value?.data),
    );
    const data = message.value?.data;
    return await this.transferService.generateBase64QRcode(data);
  }

  @MessagePattern(GET_SUBSCRIPTION_TRANSACTIONS, Transport.TCP)
  async getSubscriptionTransactions(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transfer::${GET_SUBSCRIPTION_TRANSACTIONS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );

    const customerId: string = message.value;
    return await this.transferService.getSubscriptionTransactions(customerId);
  }

  @MessagePattern(ADD_SUBSCRIPTION_TRANSACTION, Transport.TCP)
  async addSubscriptionTransaction(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transfer::${ADD_SUBSCRIPTION_TRANSACTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );

    const params: SubscriptionRequestDTO = message.value;
    return await this.transferService.addSubscriptionTransaction(params);
  }
}

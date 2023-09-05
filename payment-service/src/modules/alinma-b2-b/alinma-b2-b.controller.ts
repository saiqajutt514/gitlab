import { Body, Controller, Get, Post } from '@nestjs/common';
import { Param } from '@nestjs/common/decorators';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import appConfig from 'config/appConfig';
import {
  GET_ALINMA_BALACE,
  GET_ALINMA_TRANSACTIONS,
  RETRY_ALINMA_TRANSACTIONS,
} from 'src/constants/kafka-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ListSearchSortDto } from '../transactions/interface/transaction.interface';
import { AlinmaB2BService } from './alinma-b2-b.service';
import {
  accountInquiryDto,
  xferBtwCustAccDto,
} from './dto/create-alinma-b2-b.dto';

@Controller('b2b')
export class AlinmaB2BController {
  private readonly logger = new LoggerHandler(
    AlinmaB2BController.name,
  ).getInstance();
  constructor(private readonly alinmaB2BService: AlinmaB2BService) {}

  @MessagePattern(GET_ALINMA_TRANSACTIONS, Transport.TCP)
  async alinmaTransactions(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    const params: ListSearchSortDto = message.value;
    this.logger.log(
      `payment::transaction::${GET_ALINMA_TRANSACTIONS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.alinmaB2BService.alinmaTransactions(params);
  }
  @MessagePattern(GET_ALINMA_BALACE, Transport.TCP)
  async allAcountBalance() {
    this.logger.log(`payment::transaction::${GET_ALINMA_BALACE}::recv -> `);
    return await this.alinmaB2BService.getAllAccBal();
  }
  @MessagePattern(RETRY_ALINMA_TRANSACTIONS, Transport.TCP)
  async retry(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `payment::transaction::${RETRY_ALINMA_TRANSACTIONS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.alinmaB2BService.retryTransaction(message.value.id);
  }
}

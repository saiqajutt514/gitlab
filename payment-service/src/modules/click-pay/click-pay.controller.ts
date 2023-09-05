import { Body, Controller, Get, Post } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ClickPayService } from './click-pay.service';
import {
  ClickPayCallBackResponseDto,
  CreateClickPayDto,
} from './dto/click-pay.dto';
import { UpdateClickPayDto } from './dto/update-click-pay.dto';

@Controller()
export class ClickPayController {
  private readonly logger = new LoggerHandler(
    ClickPayController.name,
  ).getInstance();
  constructor(private readonly clickPayService: ClickPayService) {}

  @MessagePattern('click-hosted-top-up')
  async createHostedPaymentRequest(@Payload() params) {
    const message = JSON.parse(params);
    this.logger.log(
      `payment::transaction::click-hosted-top-up::recv -> ${JSON.stringify(
        message,
      )}`,
    );

    return await this.clickPayService.createHostedPaymentRequest(message);
  }

  @MessagePattern('clickpay-callback', Transport.TCP)
  async handlCallBack(@Payload() params) {
    const message = JSON.parse(params);
    this.logger.log(
      `payment::transaction::clickpay-callback::recv -> ${JSON.stringify(
        message,
      )}`,
    );

    return await this.clickPayService.handleCallBack(message);
  }

  @MessagePattern('top-up-history')
  async findAllByUserId(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log('[GET_BALANCE]');
    const id = message.value?.externalId;
    return await this.clickPayService.findAllByUserId(id);
  }

  @MessagePattern('get-all-top-up-history')
  async findAll(@Payload() payload) {
    // const message = { value: JSON.parse(payload) };
    // this.logger.log('[GET_BALANCE]');
    // const id = message.value?.externalId;
    return await this.clickPayService.findAll();
  }

  @MessagePattern('findOneClickPay')
  findOne(@Payload() id: string) {
    return this.clickPayService.findOne(id);
  }

  @MessagePattern('updateClickPay')
  update(@Payload() updateClickPayDto: UpdateClickPayDto) {
    return this.clickPayService.update(updateClickPayDto.id, updateClickPayDto);
  }

  @MessagePattern('removeClickPay')
  remove(@Payload() id: number) {
    return this.clickPayService.remove(id);
  }
}

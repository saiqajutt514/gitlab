import { Controller, Req } from '@nestjs/common';
import { MessagePattern, Transport, Payload } from '@nestjs/microservices';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { OtpService } from './otp.service';
import {
  CUSTOMER_KYC,
  GET_ALL_OTP,
  SEND_OTP,
  VERIFY_OTP,
} from 'src/constants/kafka-constant';

@Controller('otp')
export class OtpController {
  constructor(private OtpService: OtpService) {}

  private readonly logger = new LoggerHandler(OtpController.name).getInstance();

  @MessagePattern(SEND_OTP, Transport.TCP)
  async sendOtp(@Payload() message) {
    this.logger.log(`[sendOtp] -> ${SEND_OTP} | ${message}`);
    message = JSON.parse(message).body;
    return await this.OtpService.sendOtp(message);
  }

  @MessagePattern(VERIFY_OTP, Transport.TCP)
  async verifyOtp(@Payload() message) {
    this.logger.log(`[verifyOtp] -> ${SEND_OTP} | ${message}`);
    message = JSON.parse(message).body;
    return await this.OtpService.verifyOtp(message);
  }

  @MessagePattern(CUSTOMER_KYC, Transport.TCP)
  async customerKyc(@Payload() message) {
    this.logger.log(`[CUSTOMER_KYC] -> ${CUSTOMER_KYC} | ${message}`);
    message = JSON.parse(message).param;
    return await this.OtpService.customerUpdateOrCraeteWithKyc(message);
  }

  @MessagePattern(GET_ALL_OTP, Transport.TCP)
  async findAll(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_ALL_OTP}::recv -> ${message}`);
    message = JSON.parse(message);
    return await this.OtpService.findAll(message?.criteria);
  }
}

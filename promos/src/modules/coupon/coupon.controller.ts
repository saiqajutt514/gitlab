import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';

import { CouponService } from './services/coupon.service';

import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';
import { RevertCouponDto } from './dto/revertCoupon.dto';
import {
  CREATE_PROMO_CODE,
  DASHBOARD_PROMO_STATS,
  DELETE_PROMO_CODE,
  GET_ALL_PROMO_CODES,
  UPDATE_PROMO_CODE,
  VALIDATE_PROMO_CODE,
} from 'src/constants';
import { APPLY_PROMO_CODE } from 'src/constants';
import { REVERT_CODE } from 'src/constants';
import { CustomLogger } from 'src/logger/customLogger';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('coupon')
export class CouponController {
  private customLogger = new LoggerHandler(CouponController.name).getInstance();
  constructor(
    private readonly couponService: CouponService, // private customLogger: CustomLogger,
  ) {
    // this.customLogger.setContext(CouponController.name);
  }

  @MessagePattern(CREATE_PROMO_CODE, Transport.TCP)
  async create(@Payload() message) {
    this.customLogger.msgPattern(CREATE_PROMO_CODE);
    message = JSON.parse(message);
    return await this.couponService.createPromoCode(message);
  }

  @MessagePattern(GET_ALL_PROMO_CODES, Transport.TCP)
  async findAll() {
    this.customLogger.msgPattern(GET_ALL_PROMO_CODES);
    return await this.couponService.findAll();
  }

  @MessagePattern(UPDATE_PROMO_CODE, Transport.TCP)
  async update(@Payload() message) {
    this.customLogger.msgPattern(UPDATE_PROMO_CODE);
    message = JSON.parse(message);
    const id: string = message?.id;
    const data: UpdateCouponDto = message?.data;
    return await this.couponService.updatePromoCode(id, data);
  }

  @MessagePattern(DELETE_PROMO_CODE, Transport.TCP)
  async remove(@Payload() message) {
    this.customLogger.msgPattern(DELETE_PROMO_CODE);
    message = JSON.parse(message);
    const id: string = message?.id;
    return await this.couponService.removePromoCode(id);
  }

  @MessagePattern(VALIDATE_PROMO_CODE, Transport.TCP)
  async validateCode(@Payload() payload) {
    this.customLogger.msgPattern(VALIDATE_PROMO_CODE);
    const message: ValidateCodeDto = JSON.parse(payload);
    return await this.couponService.validatePromoCode(message);
  }

  @MessagePattern(APPLY_PROMO_CODE, Transport.TCP)
  async applyCode(@Payload() payload) {
    this.customLogger.msgPattern(APPLY_PROMO_CODE);
    const message: ValidateCodeDto = JSON.parse(payload);
    return await this.couponService.applyCode(message);
  }

  @MessagePattern(REVERT_CODE, Transport.TCP)
  async revertCode(@Payload() payload) {
    this.customLogger.msgPattern(REVERT_CODE);
    const message: RevertCouponDto = JSON.parse(payload);
    return await this.couponService.revertCode(message);
  }
  @MessagePattern(DASHBOARD_PROMO_STATS, Transport.TCP)
  async dashboardPromoData(@Payload() payload) {
    this.customLogger.msgPattern(DASHBOARD_PROMO_STATS);
    const message = JSON.parse(payload);
    return await this.couponService.dashboardPromoData(message);
  }
}

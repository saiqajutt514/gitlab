import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { CustomLogger } from 'src/logger/customLogger';
import { CreateLogDto } from '../dto/addLog.dto';
import { RevertCouponDto } from '../dto/revertCoupon.dto';

import { UserCouponLogRepository } from '../repositories/user_coupon_log.repository';
import { PromoCodesRepository } from './../repositories/coupon.repolsitory';

@Injectable()
export class UserCouponLogService {
  private customLogger = new LoggerHandler(
    UserCouponLogService.name,
  ).getInstance();

  constructor(
    @InjectRepository(UserCouponLogRepository)
    private logRepository: UserCouponLogRepository,
    @InjectRepository(PromoCodesRepository)
    private promoCodeRepository: PromoCodesRepository, // private customLogger: CustomLogger
  ) {
    // this.customLogger.setContext(UserCouponLogService.name);
  }

  async findOneLog(userId: string, couponId: string) {
    try {
      return await this.logRepository.findOne({ where: { userId, couponId } });
    } catch (e) {
      this.customLogger.catchError('findOneLog', e.message);
    }
  }

  async createLog(dto: CreateLogDto) {
    try {
      this.customLogger.start(
        `[createLog] | userId: ${dto.userId} | couponId: ${dto.couponId}`,
      );
      const userLog = await this.logRepository.findOne({
        where: { userId: dto.userId, couponId: dto.couponId },
      });
      if (userLog) {
        await this.logRepository.update(userLog.id, {
          ...dto,
          useCount: userLog.useCount + 1,
        });
        this.customLogger.log(
          `[createLog] | log updated | useId: ${dto.userId}`,
        );
      } else {
        const log = this.logRepository.create(dto);
        this.logRepository.insert(log);
        this.customLogger.log(
          `[createLog] | log created | userId: ${dto.userId}`,
        );
      }
    } catch (e) {
      this.customLogger.catchError('createLog', e.message);
    }
  }

  async revertLog(dto: RevertCouponDto): Promise<boolean> {
    try {
      this.customLogger.log(
        `[revertLog] | userId: ${dto.userId} | code: ${dto.promoCode}`,
      );
      const log = await this.logRepository.findOne({
        where: {
          couponId: dto.promoCode,
          userId: dto.userId,
        },
      });

      if (!log) {
        return false;
      }
      let result;
      if (log.useCount > 1) {
        result = await this.logRepository.update(log.id, {
          useCount: log.useCount - 1,
        });
      } else {
        result = await this.logRepository.delete(log.id);
      }
      const code = await this.promoCodeRepository.findOne({
        where: { id: dto.promoCode },
      });
      await this.promoCodeRepository.update(code.id, {
        userUsage: code.userUsage - 1,
        totalUtilised: code.totalUtilised - log.amount,
      });
      this.customLogger.log(`[revertLog] | userId: ${dto.userId}`);
      return result.affected > 0 ? true : false;
    } catch (e) {
      this.customLogger.catchError('revertLog', e.message);
    }
  }
}

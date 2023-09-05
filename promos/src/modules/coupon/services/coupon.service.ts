import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { getRepositoryToken, InjectRepository } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';

import { PromoCodesRepository } from '../repositories/coupon.repolsitory';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { ValidateCodeDto } from '../dto/validate-code.dto';
import { PromoCodesEntity } from '../entities/coupon.entity';
import {
  applicableFor,
  areaType,
  gender,
  IPromoCodeMethod,
  IPromoCodeType,
} from '../interfaces/promoCode.interface';
import { EXCEPTION } from 'src/constants/exceptionMessages';
import { errorMessage } from 'src/constants/errorMessages';
import { UserCouponLogService } from './log.service';
import { RevertCouponDto } from '../dto/revertCoupon.dto';
import { ResponseData } from 'src/helpers/responseHandler';
import { CustomLogger } from 'src/logger/customLogger';
import { LoggerHandler } from 'src/helpers/logger-handler';
import appConfig from 'config/appConfig';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';
import { StatsParams } from '../dto/dashPromoStats.dto';
import { calculatePercentage } from 'utils/mathFunction';
import { getDateBounds } from 'src/helpers/date-functions';

const polyline = require('google-polyline');
const pointInPolygon = require('point-in-polygon');

@Injectable()
export class CouponService {
  private customLogger = new LoggerHandler(CouponService.name).getInstance();

  constructor(
    @InjectRepository(PromoCodesRepository)
    private promoCodesRepository: PromoCodesRepository,
    private readonly logService: UserCouponLogService, // private customLogger: CustomLogger
    @Inject('CLIENT_TRIP_SERVICE_TCP') private tripTcpClient: ClientProxy,
  ) {
    // this.customLogger.setContext(CouponService.name);
  }

  encodePolygone(param: any) {
    try {
      //validation
      if (typeof param === 'undefined' || param.length < 3)
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          'Atleast 3 coordinates are required for polygon',
        );

      //arrange area in multi dimentional array called polygon
      let polygon: number[][] = [];
      param.map((item) => {
        polygon.push([item.lat, item.long]);
      });

      // encode that polygon
      let response = polyline.encode(polygon);

      //send back response
      return ResponseData.success(response);
    } catch (err) {
      return ResponseData.error(HttpStatus.BAD_REQUEST, err.message);
    }
  }

  async createPromoCode(createCouponDto: CreateCouponDto) {
    try {
      this.customLogger.end(
        `[createCouponDto] | pramas: ${JSON.stringify(createCouponDto)}`,
      );
      if (
        createCouponDto.areaType != areaType.any &&
        (createCouponDto.area == null || !createCouponDto.area)
      )
        throw new HttpException(
          'please enter area value',
          HttpStatus.NOT_ACCEPTABLE,
        );
      else if (
        createCouponDto.areaType != areaType.polygone &&
        Array.isArray(createCouponDto.area)
      ) {
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.ENTER_STRING_IN_AREA,
        );
      }

      if (createCouponDto.areaType === areaType.polygone) {
        const areaBuffer = this.encodePolygone(createCouponDto.area);
        if (areaBuffer.statusCode != HttpStatus.OK) return areaBuffer;
        createCouponDto.area = areaBuffer.data;
      }

      this.customLogger.start(
        `[createPromoCode] | code: ${createCouponDto.code}`,
      );
      const codeCheck = await this.promoCodesRepository.findOne({
        where: {
          code: createCouponDto.code,
          deletedAt: IsNull(),
          status: true,
        },
      });
      if (codeCheck) {
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.CODE_EXIST,
        );
      }
      const promoCode = this.promoCodesRepository.create(createCouponDto);
      await this.promoCodesRepository.insert(promoCode);
      this.customLogger.end(
        `[createPromoCode] | code: ${createCouponDto.code}`,
      );
      return ResponseData.success(promoCode);
    } catch (err) {
      this.customLogger.catchError('createPromoCode', err.message);
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    try {
      this.customLogger.start(`[findAll]`);
      const promoCodes = await this.promoCodesRepository.find();
      this.customLogger.end(`[findAll]`);
      return ResponseData.success(promoCodes);
    } catch (err) {
      this.customLogger.catchError('findAll', err.message);
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(id: string) {
    try {
      this.customLogger.start(`[findOne] | id: ${id}`);
      const promocode = await this.promoCodesRepository.find({ id });
      if (!promocode) {
        throw new HttpException(
          errorMessage.CODE.NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      this.customLogger.end(`[findOne] | id: ${id}`);
      return ResponseData.success(promocode);
    } catch (err) {
      this.customLogger.catchError('findOne', err.message);
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findByCode(code: string): Promise<PromoCodesEntity> {
    return await this.promoCodesRepository.findOne({
      where: { code: code?.trim()?.toUpperCase() },
    });
  }

  async updatePromoCode(id: string, updateCouponDto: UpdateCouponDto) {
    try {
      this.customLogger.start(
        `[updatePromoCode] | code: ${updateCouponDto.code}`,
      );
      const promoCode = await this.promoCodesRepository.findOne({ id });
      this.promoCodesRepository.update({ id }, updateCouponDto);
      this.customLogger.end(
        `[updatePromoCode] | code: ${updateCouponDto.code}`,
      );
      return ResponseData.success(promoCode);
    } catch (err) {
      this.customLogger.catchError('updatePromoCode', err.message);
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }

  async removePromoCode(id: string) {
    try {
      this.customLogger.start(`[removePromoCode] | id: ${id}`);
      const promoCode = await this.promoCodesRepository.findOne({ id });
      await this.promoCodesRepository.delete(id);
      this.customLogger.end(`[removePromoCode] | id: ${id}`);
      return ResponseData.success(promoCode);
    } catch (err) {
      this.customLogger.catchError('removePromoCode', err.message);
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Validate if promocode can be applied or not
   * @param {any} validateCodeDto:ValidateCodeDto
   * @param {any} promoCode:PromoCodesEntity
   * @returns {any}, only return when promocode can be applied otherwise throws error
   */
  async validatePromoCode(validateCodeDto: ValidateCodeDto) {
    const { promoCode: code } = validateCodeDto;
    try {
      this.customLogger.start(`[validatePromoCode] | code: ${code}`);

      const promoCode = await this.findByCode(code);
      if (!promoCode) {
        this.customLogger.notFoundLog('[validatePromoCode] | code: ' + code);
        throw new HttpException(
          { status: HttpStatus.NOT_FOUND, message: EXCEPTION.INVALID_CODE },
          HttpStatus.NOT_FOUND,
        );
      }

      const now: Date = new Date();
      let amount: number = 0;

      if (
        validateCodeDto.applyingTo != promoCode.applicableFor &&
        promoCode.applicableFor != applicableFor.both
      ) {
        this.customLogger.error(
          `[validatePromoCode] => promoCode not valid applicable for this userType | requiredUserType: ${promoCode.applicableFor} | requestUserType: ${validateCodeDto.applyingTo}`,
        );
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: `${EXCEPTION.NOT_MEETING_USER_TYPE_REQUIREMENTS} ${promoCode.applicableFor}`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (validateCodeDto.amount < promoCode.minimumAmountInCart) {
        this.customLogger.error(
          `[validatePromoCode] => request not meeting min requirements | requiredAmount: ${promoCode.minimumAmountInCart} | requestAmount: ${validateCodeDto.amount}`,
        );
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: `${EXCEPTION.NOT_MEETING_REQUIREMENTS} ${promoCode.minimumAmountInCart}`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (new Date(promoCode.startAt) > now) {
        this.customLogger.error(
          '[validatePromoCode] => promo-code has not started yet | code: ' +
            code,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.INVALID,
        );
      }

      if (new Date(promoCode.endAt) < now) {
        this.customLogger.error(
          '[validatePromoCode] => promo-code expired | code: ' + code,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.EXPIRED,
        );
      }

      if (
        promoCode.userUsage >= promoCode.maximumTotalUsage &&
        promoCode.maximumTotalUsage
      ) {
        this.customLogger.error(
          '[validatePromoCode] => promo-code limit reached | code: ' + code,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.LIMIT_REACHED,
        );
      }

      if (promoCode.maximumUsagePerUser) {
        const useLog = await this.logService.findOneLog(
          validateCodeDto.userId,
          promoCode.id,
        );

        if (useLog?.useCount >= promoCode.maximumUsagePerUser) {
          this.customLogger.error(
            `[validatePromoCode] => userUsage limit reached | userId: ${validateCodeDto.userId} | code: ${validateCodeDto.promoCode}`,
          );
          return ResponseData.error(
            HttpStatus.BAD_REQUEST,
            errorMessage.CODE.USER_LIMIT_REACHED,
          );
        }
      }

      /**
       * Checks if user is eligible in case of method is voucher
       */
      if (
        promoCode.method === IPromoCodeMethod.voucher &&
        promoCode.userId !== validateCodeDto.userId
      ) {
        this.customLogger.error(
          `[validatePromoCode] => user not eligible to claim this voucher | userId: ${validateCodeDto.userId} `,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.INVALID,
        );
      }

      // Calculate percentage if type is percentage
      amount =
        promoCode.promoCodeType === IPromoCodeType.Fixed
          ? promoCode.amount
          : (validateCodeDto.amount * promoCode.amount) / 100;

      // Replace the amout with amount or maximum_discount_amount whichever is smaller
      amount =
        promoCode.maximumDiscountAmount &&
        amount > promoCode.maximumDiscountAmount
          ? promoCode.maximumDiscountAmount
          : amount;

      if (promoCode.totalUtilised < promoCode.totalBudget) {
        amount =
          promoCode.totalUtilised &&
          amount + promoCode.totalUtilised > promoCode.totalBudget
            ? promoCode.totalUtilised - promoCode.totalBudget
            : amount;
      } else
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.BUDGET_LIMIT_REACHED,
        );

      if (
        (promoCode.areaType == areaType.country ||
          promoCode.areaType == areaType.city) &&
        !(await this.geoLocate(
          validateCodeDto.lat,
          validateCodeDto.long,
          promoCode.area,
        ))
      ) {
        this.customLogger.error(
          `lat: ${validateCodeDto.lat} long: ${validateCodeDto.long} areaType: ${promoCode.areaType} area ${promoCode.area}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.AREA_NOT_EXIST,
        );
      }

      if (
        promoCode.areaType == areaType.polygone &&
        !pointInPolygon(
          [validateCodeDto.lat, validateCodeDto.long],
          polyline.decode(promoCode.area),
        )
      ) {
        this.customLogger.error(
          `lat: ${validateCodeDto.lat} long: ${
            validateCodeDto.long
          } areaType: ${promoCode.areaType} area: ${JSON.stringify(
            polyline.decode(promoCode.area),
          )}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.AREA_NOT_EXIST,
        );
      }

      if (
        promoCode.gender == gender.male ||
        promoCode.gender == gender.female
      ) {
        const genderString = promoCode.gender == gender.male ? 'M' : 'F';
        const user = await this.tripTcpClient
          .send(
            'get-customer-detail',
            JSON.stringify({ userId: validateCodeDto.userId }),
          )
          .pipe()
          .toPromise();
        if (
          user.statusCode != HttpStatus.OK ||
          user.data.gender != genderString
        )
          return ResponseData.error(
            HttpStatus.BAD_REQUEST,
            errorMessage.CODE.GENDER_NOT_MATCHED,
          );
      }

      const data = {
        valid: true,
        amount: amount,
        promoCodeId: promoCode.id,
      };
      if (data.amount > validateCodeDto.amount)
        return ResponseData.error(
          HttpStatus.NOT_ACCEPTABLE,
          errorMessage.CODE.INVALID_AMOUNT,
        );

      this.customLogger.end(`[validatePromoCode] | code: ${code}`);

      return ResponseData.success(data);
    } catch (err) {
      this.customLogger.catchError('validatePromoCode', err.message);
      if (err.message === EXCEPTION.INVALID_CODE)
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CODE.INVALID,
        );
      else if (
        err.message.split(' ').includes(EXCEPTION.NOT_MEETING_REQUIREMENTS)
      )
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          `${errorMessage.CODE.MINIMUM_REQUIREMENTS}${
            err.message.split(' ')[1]
          }`,
        );
      else if (
        err.message
          .split(' ')
          .includes(EXCEPTION.NOT_MEETING_USER_TYPE_REQUIREMENTS)
      )
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          `${errorMessage.CODE.NOT_VALUD_FOR_THIS_TYPE}`,
        );
      else
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
    }
  }

  async applyCode(validateCodeDto: ValidateCodeDto) {
    try {
      this.customLogger.start(
        `[applyCode] | code: ${validateCodeDto.promoCode}`,
      );
      const { data } = await this.validatePromoCode(validateCodeDto);
      if (data.valid) {
        const promo = await this.promoCodesRepository.findOne(data.promoCodeId);

        // Increment user_usage on success
        await this.promoCodesRepository.update(promo.id, {
          userUsage: (promo.userUsage || 0) + 1,
          totalUtilised: promo.totalUtilised + data.amount,
        });

        // Insert to log table
        await this.logService.createLog({
          amount: data.amount,
          couponId: promo.id,
          userId: validateCodeDto.userId,
        });
      }
      this.customLogger.end(`[applyCode] | code: ${validateCodeDto.promoCode}`);
      return ResponseData.success({ valid: data.valid, amount: data.amount });
    } catch (err) {
      this.customLogger.catchError('applyCode', err.message);
      return ResponseData.error(HttpStatus.OK, errorMessage.CODE.INVALID);
    }
  } 

  async revertCode(revertCouponDto: RevertCouponDto) {
    try {
      this.customLogger.start(
        `[revertCode] | code: ${revertCouponDto.promoCode}`,
      );

      const promoCode = await this.findByCode(revertCouponDto.promoCode);
      if (!promoCode) {
        throw new Error(`Invalid code | ${revertCouponDto.promoCode}`);
      }

      const deletedLog = await this.logService.revertLog({
        promoCode: promoCode.id,
        userId: revertCouponDto.userId,
      });

      if (deletedLog) {
        promoCode.userUsage = (promoCode.userUsage || 1) - 1;
      }
      this.customLogger.end(
        `[revertCode] | code: ${revertCouponDto.promoCode}`,
      );
      return ResponseData.success(deletedLog);
    } catch (err) {
      this.customLogger.catchError('revertCode', err.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.CODE.INVALID,
      );
    }
  }

  async geoLocate(lat, long, cityOrCountry) {
    try {
      this.customLogger.log(`[geoLocate] | compoundCode: ${cityOrCountry}`);
      const key = appConfig().googleKey;
      const apiUrl = appConfig().mapsUrl;
      const apiParams = `?key=${key}&latlng=${lat},${long}`;
      const locationDetails = await axios.get(apiUrl + apiParams);

      this.customLogger.log(
        `[geoLocate] | locationDetails: ${locationDetails.data?.plus_code?.compound_code}`,
      );
      let compoundCode = locationDetails.data?.plus_code?.compound_code.split(
        ',',
      );
      compoundCode = `${compoundCode.join('')}`.toLowerCase();

      // compoundCode = compoundCode.split(' ');

      compoundCode = `_${compoundCode.split(' ').join('_')}_`.toLowerCase();
      //  compoundCode = `_${locationDetails.data?.plus_code?.compound_code
      //   .replaceAll(' ', '_')
      //   .toLowerCase()}_`;

      this.customLogger.log(`[geoLocate] | compoundCode: ${compoundCode}`);
      cityOrCountry = `_${cityOrCountry.split(' ').join('_').toLowerCase()}_`;

      this.customLogger.log(`[geoLocate] | cityOrCountry: ${cityOrCountry}`);

      return compoundCode.includes(cityOrCountry);
    } catch (err) {
      this.customLogger.error(`[geoLocate] | err: ${err?.message}`);
      return false;
    }
  }

  checkIfPointIsInPolygon(lat, long, polygonEncoded) {
    try {
      let polygon = polyline.decode(polygonEncoded);
      return pointInPolygon([lat, long], polygon);
    } catch (err) {
      return false;
    }
  }

  // for dashboard promo data by mujtaba
  async dashboardPromoData(params: StatsParams) {
    try {
      console.log(params);
      //destruct param
      let { fromDate, toDate, entity } = params;
      const type: string = params.type || 'week';

      let startDate, endDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        [startDate, endDate] = getDateBounds(type, 'blocks');
      }

      //create current date in string form 2022-12-29 10:46:47.753
      const currentDate = new Date();
      let cDate: string = currentDate.toISOString();
      cDate = cDate.replace('T', ' ');
      cDate = cDate.replace('Z', '');
      cDate = JSON.stringify(cDate);

      //performed quries
      const promoRepo = this.promoCodesRepository.createQueryBuilder(
        'promo_codes',
      );
      promoRepo.select([
        `COUNT(CASE WHEN (status=1 && endAt > ${cDate} ) THEN 1 END) AS active`,
        `SUM(CASE WHEN (status=1 && endAt > ${cDate} ) THEN totalUtilised END) AS totalActiveUsage`,
        `SUM(CASE WHEN (status=1 && endAt > ${cDate} ) THEN totalBudget END) AS totalActiveBudget`,
        `SUM(CASE WHEN (status=1 && endAt > ${cDate} ) THEN (maximumTotalUsage - userUsage) END) AS activeUnutilizedPromo`,

        `COUNT(CASE WHEN (status=0 && endAt > ${cDate} ) THEN 1 END) AS inactive`,
        `SUM(CASE WHEN (status=0 && endAt > ${cDate} ) THEN totalUtilised END) AS totalInactiveUsage`,
        `SUM(CASE WHEN (status=0 && endAt > ${cDate} ) THEN totalBudget END) AS totalInctiveBudget`,
        `SUM(CASE WHEN (status=0 && endAt > ${cDate} ) THEN (maximumTotalUsage - userUsage) END) AS inactiveUnutilizedPromo`,

        `COUNT(CASE WHEN (endAt < ${cDate} ) THEN 1 END) AS expired`,
        `SUM(CASE WHEN ( endAt < ${cDate} ) THEN totalUtilised END) AS expiredUsage`,
        `SUM(CASE WHEN ( endAt < ${cDate} ) THEN totalBudget END) AS totalExpiredBudget`,
        `SUM(CASE WHEN ( endAt < ${cDate} ) THEN (maximumTotalUsage - userUsage) END) AS expiredUnutilizedPromo`,
      ]);

      if (startDate && endDate) {
        promoRepo.andWhere(
          "DATE_FORMAT(promo_codes.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate },
        );
        promoRepo.andWhere(
          "DATE_FORMAT(promo_codes.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate },
        );
      }

      if (params.entity == 'captain') {
        promoRepo.andWhere('promo_codes.applicableFor = :userType', {
          userType: applicableFor.driver,
        });
      } else {
        promoRepo.andWhere('promo_codes.applicableFor = :userType', {
          userType: applicableFor.rider,
        });
      }

      const result = await promoRepo.getRawMany();

      //arranging response
      const response = {
        total:
          parseInt(result[0].active) +
          parseInt(result[0].inactive) +
          parseInt(result[0].expired),
        active: {
          count: parseInt(result[0].active),
          percentage: calculatePercentage(
            parseInt(result[0].active),
            parseInt(result[0].active) +
              parseInt(result[0].inactive) +
              parseInt(result[0].expired),
          ),
          utilizedPercentage: calculatePercentage(
            parseInt(result[0].totalActiveUsage),
            parseInt(result[0].totalActiveBudget),
          ),
          totalActiveUsage: parseInt(result[0].totalActiveUsage),
          totalUnutilizedPromo: parseInt(result[0].activeUnutilizedPromo),
        },
        inactive: {
          count: parseInt(result[0].inactive),
          percentage: calculatePercentage(
            parseInt(result[0].inactive),
            parseInt(result[0].active) +
              parseInt(result[0].inactive) +
              parseInt(result[0].expired),
          ),
          utilizedPercentage: calculatePercentage(
            parseInt(result[0].totalInactiveUsage),
            parseInt(result[0].totalInctiveBudget),
          ),
          totalInctiveUsage: parseInt(result[0].totalInactiveUsage),
          totalUnutilizedPromo: parseInt(result[0].inactiveUnutilizedPromo),
        },
        expired: {
          count: parseInt(result[0].expired),
          percentage: calculatePercentage(
            parseInt(result[0].expired),
            parseInt(result[0].active) +
              parseInt(result[0].inactive) +
              parseInt(result[0].expired),
          ),
          utilizedPercentage: calculatePercentage(
            parseInt(result[0].expiredUsage),
            parseInt(result[0].totalExpiredBudget),
          ),
          totalExpiredUsage: parseInt(result[0].expiredUsage),
          totalUnutilizedPromo: parseInt(result[0].expiredUnutilizedPromo),
        },
      };
      this.customLogger.end(`[dashboardPromoStats] | code: ${response}`);
      return ResponseData.success(response);
    } catch (err) {
      this.customLogger.catchError('dashboardPromoStats', err.message);
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }
}

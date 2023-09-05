import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';

import { DISCOUNT_TYPE, SUB_MASTER_STATUS } from './enum';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionRepository } from './subscription.repository';
import { SUBSCRIPTION_STATUS, USER_TYPE } from '../user-subscriptions/enum';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { StatsParams } from './dto/dashSubStats.dto';
import { getDateBounds } from 'src/helpers/date-functions';
import { calculatePercentage } from 'src/utils/math-functions';

@Injectable()
export class SubscriptionService {
  private readonly logger = new LoggerHandler(
    SubscriptionService.name,
  ).getInstance();
  constructor(
    @InjectRepository(SubscriptionRepository)
    private subscriptionRepository: SubscriptionRepository,
  ) {}

  async create(params: CreateSubscriptionDto) {
    const isSubscriptionExist = await this.subscriptionRepository.findOne({
      packageName: params.packageName,
      planType: params.planType,
    });

    if (isSubscriptionExist) {
      this.logger.error(
        'subscription already exists with ' +
          `packageName: ${params.packageName} & plantype: ${params.planType}`,
      );
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        errorMessage.SUBSCRIPTION_ALREADY_EXISTS,
      );
    }

    const updatedParams = this.calculateFinalPrice(params);
    if (updatedParams?.message) {
      return updatedParams;
    }

    const subscription = this.subscriptionRepository.create(updatedParams);
    await this.subscriptionRepository.save(subscription);
    this.logger.log('subscription package created successfully');

    return ResponseData.success(subscription);
  }

  async findAll() {
    const subscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .select('subscription.*')
      .addSelect(
        'COUNT(DISTINCT activeSubscriptions.userId)',
        'activeSubscribers',
      )
      .addSelect(
        'COUNT(DISTINCT totalSubscriptions.userId)',
        'totalSubscribers',
      )
      // .addSelect(
      //   '(DISTINCT totalSubscribersList.userId)',
      //   'totalSubscribersList',
      // )
      // .addSelect('totalSubscriptions.*')
      .leftJoin(
        'subscription.subscriptions',
        'activeSubscriptions',
        'activeSubscriptions.status = :status',
        { status: SUB_MASTER_STATUS.ACTIVE },
      )
      .leftJoin('subscription.subscriptions', 'totalSubscriptions')
      // .loadRelationCountAndMap(
      //   'subscription.activeSubscribers', // map key name
      //   'subscription.subscriptions', // relation
      //   'activeSubscriptions', // aliasName for relation
      //   query => query.where("activeSubscriptions.status = :status", { status: SUBSCRIPTION_STATUS.ACTIVE }) // action condition in relation
      // )
      // .loadRelationCountAndMap(
      //   'subscription.uniqueSubscribers', // map key name
      //   'subscription.subscriptions', // relation
      //   'uniqueSubscriptions' // aliasName for relation
      // )
      .groupBy('subscription.id')
      .getRawMany();

    subscriptions.map((item) => {
      item.activeSubscribers = item.activeSubscribers
        ? Number(item.activeSubscribers)
        : 0;
      item.totalSubscribers = item.totalSubscribers
        ? Number(item.totalSubscribers)
        : 0;
    });
    this.logger.log('subscription package list found:' + subscriptions.length);
    return ResponseData.success(subscriptions);
  }

  async findOne(id: string) {
    const subscription = await this.subscriptionRepository.findOne(id);

    if (!subscription) {
      this.logger.error('subscription package not found with id:' + id);
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        errorMessage.SUBSCRIPTION_NOT_FOUND,
      );
    }
    this.logger.log('returning subscription package details of id:' + id);
    return ResponseData.success(subscription);
  }

  async update(id: string, params: UpdateSubscriptionDto) {
    const { data } = await this.findOne(id);
    this.logger.debug('subscription details checked for id:' + id);

    const updatedParams = this.calculateFinalPrice({ ...data, ...params });

    if (updatedParams?.message) {
      return updatedParams;
    }

    await this.subscriptionRepository.update(id, updatedParams);
    this.logger.log('subscription package details updated for id:' + id);

    const { data: subscription } = await this.findOne(id);

    return ResponseData.success(subscription);
  }

  async remove(id: string) {
    const { data: subscription } = await this.findOne(id);
    this.logger.debug('subscription details checked for id:' + id);

    await this.subscriptionRepository.delete(id);
    this.logger.log('subscription package removed for id:' + id);

    return ResponseData.success(subscription);
  }

  calculateFinalPrice(params) {
    this.logger.debug(
      'calculating subscription package final amount with data:' +
        JSON.stringify(params),
    );
    if (params.discountType === DISCOUNT_TYPE.FIXED) {
      if (params.basePrice <= params.discountValue) {
        this.logger.error(
          'Fixed discount : package base price was lesser than discount value',
        );
        return ResponseData.error(
          HttpStatus.NOT_ACCEPTABLE,
          errorMessage.DISCOUNT_PRICE_ERROR,
        );
      }
      return {
        ...params,
        finalPrice: params.basePrice - params.discountValue,
      };
    } else if (params.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      if (params.discountValue > 100) {
        this.logger.error('package discount percentage value exceeded 100');
        return ResponseData.error(
          HttpStatus.NOT_ACCEPTABLE,
          errorMessage.DISCOUNT_PRICE_RANGE_ERROR,
        );
      }

      const discountedValue = (params.basePrice * params.discountValue) / 100;
      if (params.basePrice <= discountedValue) {
        this.logger.error(
          'Percentage discount : package base price was lesser than discount value',
        );
        return ResponseData.error(
          HttpStatus.NOT_ACCEPTABLE,
          errorMessage.DISCOUNT_PRICE_ERROR,
        );
      }
      return {
        ...params,
        finalPrice: params.basePrice - discountedValue,
      };
    } else {
      return {
        ...params,
        finalPrice: params.basePrice,
      };
    }
  }

  // suscription dashboard
  async suscriptionDetailsDashboard(params: StatsParams) {
    //dashboard subscription  data
    try {
      // console.log(params);

      let { fromDate, toDate, entity } = params;
      const type: string = params.type || 'week';

      let startDate, endDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        [startDate, endDate] = getDateBounds(type, 'blocks');
      }

      //create current date in string form e.g 2022-12-29 10:46:47.753
      const currentDate = new Date();
      let cDate: string = currentDate.toISOString();
      cDate = cDate.replace('T', ' ');
      cDate = cDate.replace('Z', '');
      // cDate = JSON.stringify(cDate);

      // console.log(startDate);
      // console.log(endDate);
      // console.log(cDate);

      //For active susscriptions.
      const activeSubscriptions =
        this.subscriptionRepository.createQueryBuilder('subscription_master');
      activeSubscriptions.select(
        'COUNT(DISTINCT subscription_master.id)',
        'activeSubcribtion',
      );
      activeSubscriptions.andWhere('subscription_master.status = :status', {
        status: SUB_MASTER_STATUS.ACTIVE,
      });
      // activeSubscriptions.andWhere("subscription_master.endDate > :cDate", {cDate: cDate})
      // activeSubscriptions.andWhere(
      //   "DATE_FORMAT(subscription_master.endDate, '%Y-%m-%d') >= :cDate",
      //   { cDate },
      // );

      if (params.entity == 'captain') {
        activeSubscriptions.andWhere(
          'totalSubscriptions.userType = :userType',
          { userType: USER_TYPE.CAPTAIN },
        );
      } else {
        activeSubscriptions.andWhere(
          'totalSubscriptions.userType = :userType',
          { userType: USER_TYPE.CUSTOMER },
        );
      }
      activeSubscriptions.leftJoin(
        'subscription_master.subscriptions',
        'totalSubscriptions',
      );
      activeSubscriptions.addSelect(
        'COUNT(DISTINCT totalSubscriptions.userId)',
        'totalActiveSubscribers',
      );
      activeSubscriptions.addSelect(
        'SUM(totalSubscriptions.paidAmount)',
        'amountActive',
      );

      if (startDate && endDate) {
        activeSubscriptions.andWhere(
          "DATE_FORMAT(totalSubscriptions.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate },
        );
        activeSubscriptions.andWhere(
          "DATE_FORMAT(totalSubscriptions.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate },
        );
      }
      const activeResponse = await activeSubscriptions.getRawMany();
      // console.log(activeResponse);
      // console.log(
      //   '_____________________________1_______________________________',
      // );

      // For Inactive suscription.
      const inactiveSubscriptions =
        this.subscriptionRepository.createQueryBuilder('subscription_master');
      inactiveSubscriptions.select(
        'COUNT(DISTINCT subscription_master.id)',
        'inactiveSubscribtion',
      );
      inactiveSubscriptions.andWhere('subscription_master.status = :status', {
        status: SUB_MASTER_STATUS.INACTIVE,
      });
      // inactiveSubscriptions.andWhere(
      //   "DATE_FORMAT(subscription_master.endDate, '%Y-%m-%d') >= :cDate",
      //   { cDate },
      // );
      inactiveSubscriptions.leftJoin(
        'subscription_master.subscriptions',
        'totalSubscriptions',
      );
      if (params.entity == 'rider') {
        activeSubscriptions.andWhere(
          'totalSubscriptions.userType = :userType',
          { userType: USER_TYPE.CUSTOMER },
        );
      } else {
        activeSubscriptions.andWhere(
          'totalSubscriptions.userType = :userType',
          { userType: USER_TYPE.CAPTAIN },
        );
      }
      inactiveSubscriptions.addSelect(
        'COUNT(totalSubscriptions.userId)',
        'totalInactiveSubscribers',
      );
      inactiveSubscriptions.addSelect(
        'SUM(totalSubscriptions.paidAmount)',
        'amountInactive',
      );
      // inactiveSubscriptions.andWhere("totalSubscriptions.startDate > :startDate", {startDate: cDate})

      if (startDate && endDate) {
        inactiveSubscriptions.andWhere(
          "DATE_FORMAT(totalSubscriptions.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate },
        );
        inactiveSubscriptions.andWhere(
          "DATE_FORMAT(totalSubscriptions.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate },
        );
      }
      const inactiveResponse = await inactiveSubscriptions.getRawMany();
      // console.log(inactiveResponse);
      // console.log(
      //   '____________________________2________________________________',
      // );

      //For Expired Suscription
      const expiredSubscriptions =
        this.subscriptionRepository.createQueryBuilder('subscription_master');
      expiredSubscriptions.select(
        'COUNT(DISTINCT subscription_master.id)',
        'expiredSubscribtion',
      );
      //expiredSubscriptions.andWhere("subscription_master.endDate < :cDate", {cDate: cDate})
      expiredSubscriptions.andWhere(
        "DATE_FORMAT(subscription_master.endDate, '%Y-%m-%d') < :cDate",
        { cDate },
      );

      if (params.entity == 'rider') {
        activeSubscriptions.andWhere(
          'totalSubscriptions.userType = :userType',
          { userType: USER_TYPE.CUSTOMER },
        );
      } else {
        activeSubscriptions.andWhere(
          'totalSubscriptions.userType = :userType',
          { userType: USER_TYPE.CAPTAIN },
        );
      }

      expiredSubscriptions.leftJoin(
        'subscription_master.subscriptions',
        'totalSubscriptions',
      );
      expiredSubscriptions.addSelect(
        'COUNT(totalSubscriptions.userId)',
        'totalExpiredSubscribers',
      );
      expiredSubscriptions.addSelect(
        'SUM(totalSubscriptions.paidAmount)',
        'amountExpired',
      );

      if (startDate && endDate) {
        expiredSubscriptions.andWhere(
          "DATE_FORMAT(totalSubscriptions.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate },
        );
        expiredSubscriptions.andWhere(
          "DATE_FORMAT(totalSubscriptions.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate },
        );
      }
      const expiredResponse = await expiredSubscriptions.getRawMany();
      // console.log(cDate);
      // console.log(expiredResponse);
      // console.log(
      //   '____________________________3________________________________',
      // );

      let total =
        parseInt(activeResponse[0].activeSubcribtion) +
        parseInt(inactiveResponse[0].inactiveSubscribtion) +
        parseInt(expiredResponse[0].expiredSubscribtion);

      const realResponse = {
        total: total,
        active: {
          count: parseInt(activeResponse[0].activeSubcribtion),
          percentage: calculatePercentage(
            parseInt(activeResponse[0].activeSubcribtion),
            total,
          ),
          totalActiveSubscribers: parseInt(
            activeResponse[0].totalActiveSubscribers,
          ),
          amountActive: parseInt(activeResponse[0].amountActive),
        },
        inactive: {
          count: parseInt(inactiveResponse[0].inactiveSubscribtion),
          percentage: calculatePercentage(
            parseInt(inactiveResponse[0].inactiveSubscribtion),
            total,
          ),
          totalInctiveUsage: parseInt(
            inactiveResponse[0].totalInactiveSubscribers,
          ),
          amountInactive: parseInt(inactiveResponse[0].amountInactive),
        },
        expired: {
          count: parseInt(expiredResponse[0].expiredSubscribtion),
          percentage: calculatePercentage(
            parseInt(expiredResponse[0].expiredSubscribtion),
            total,
          ),
          totalExpiredUsage: parseInt(
            expiredResponse[0].totalExpiredSubscribers,
          ),
          amountExpired: parseInt(expiredResponse[0].amountExpired),
        },
      };

      return ResponseData.success(realResponse);
    } catch (err) {
      console.log(err.message);
      // this.customLogger.catchError('dashboardSubcriptionData', err.message);
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }
}

import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets } from 'typeorm';

import { captainKafkaConfig, captainTCPConfig } from 'src/microServicesConfigs';
import {
  GET_SELECTED_CAPTAINS,
  CAPTAIN_DETAIL,
} from 'src/constants/kafka-constant';

import {
  getIsoDateTime,
  getIsoDate,
  getDays,
  addDays,
  addMonths,
  resetTodayDate,
} from 'src/utils/get-timestamp';
import { roundupDecimals } from 'src/utils/number-roundup';
import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  ENTITY_TYPE,
  TRANSACTION_STATUS,
  TransactionsSort,
  EARNING_DURATION,
} from '../transactions/enum';
import { SUBSCRIPTION_STATUS } from '../user-subscriptions/enum';

import { TransactionRepository } from './transaction.repository';
import {
  ListSearchSortDto,
  EarningListParams,
  StatsParams,
} from './interface/transaction.interface';
import {
  getDateBounds,
  getDateOfWeek,
  getDateRange,
  getGraphLabel,
  matchGraphDate,
} from 'src/helpers/date-functions';
import { UserSubscriptionsEntity } from '../user-subscriptions/entities/user-subscription.entity';
import { SubscriptionEarningDto } from './dto/subscription-earning.dto';
import { TransactionEntity } from './entities/transaction.entity';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { getAmountFormatted } from 'src/helpers/amount-formatter';
import { RedisHandler } from 'src/helpers/redis-handler';
import { QRGeneratorDto } from '../transfer/dto/qr-Dto';
import { Invoice } from '@axenda/zatca';
@Injectable()
export class TransactionService {
  private readonly logger = new LoggerHandler(
    TransactionService.name,
  ).getInstance();
  constructor(
    private redisHandler: RedisHandler,
    @InjectRepository(TransactionRepository)
    private transactionRepository: TransactionRepository,
    @Inject('CLIENT_CAPTAIN_SERVICE_TCP') private clientCaptainTCP: ClientProxy,
  ) {}

  onModuleInit() {}

  async create(params: CreateTransactionDto) {
    this.logger.debug(
      'creating transaction for type:' +
        params.entityType +
        ' of id:' +
        params.entityId,
    );
    const transaction = this.transactionRepository.create(params);
    await this.transactionRepository.save(transaction);
    this.logger.log('transaction created successfully');
    return ResponseData.success(transaction);
  }

  async findAll() {
    const transactions = await this.transactionRepository.find();
    this.logger.debug('retunring transaction list of ' + transactions.length);
    return ResponseData.success(transactions);
  }

  async findOne(id: string) {
    const transaction = await this.transactionRepository.findOne(id);
    if (!transaction) {
      this.logger.error('transaction entry not found with id:' + id);
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        errorMessage.SUBSCRIPTION_NOT_FOUND,
      );
    }
    this.logger.debug('returning transaction details for id:' + id);
    return ResponseData.success(transaction);
  }

  async update(id: string, params: UpdateTransactionDto) {
    this.logger.debug('updating transaction entry of id:' + id);
    await this.transactionRepository.update(id, params);
    const { data: transaction } = await this.findOne(id);
    this.logger.log('transaction updated successfully');
    return ResponseData.success(transaction);
  }
  //Backup
  // async findAllTransactions(params: ListSearchSortDto) {
  //   try {
  //     const fields = [
  //       'transactions.id',
  //       'transactions.senderId',
  //       'transactions.transactionId',
  //       'transactions.transactionAmount',
  //       'transactions.createdAt',
  //       'package.packageName',
  //       'subscription.subscriptionAmount',
  //       'subscription.paidAmount',
  //       'subscription.dueAmount',
  //       'subscription.startDate',
  //       'subscription.endDate',
  //       'subscription.dueDate',
  //       'subscription.status',
  //     ];
  //     const transQryInstance =
  //       this.transactionRepository.createQueryBuilder('transactions');
  //     transQryInstance.select(fields);
  //     transQryInstance.addSelect(
  //       'DATEDIFF(subscription.dueDate, CURDATE())',
  //       'subscription_remainingDays',
  //     );
  //     transQryInstance.innerJoin('transactions.subscription', 'subscription');
  //     transQryInstance.leftJoin('subscription.package', 'package');
  //     transQryInstance.where('transactions.entityType = :entityType', {
  //       entityType: ENTITY_TYPE.SUBSCRIPTION,
  //     });
  //     // Admin Filters
  //     if (params?.filters?.userId) {
  //       transQryInstance.andWhere('subscription.userId = :userId', {
  //         userId: params?.filters?.userId,
  //       });
  //     }
  //     if (params?.filters?.transactionId) {
  //       transQryInstance.andWhere(
  //         'transactions.transactionId LIKE :transactionId',
  //         { transactionId: `${params?.filters?.transactionId}%` },
  //       );
  //     }
  //     if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
  //       const fromDate = getIsoDateTime(
  //         new Date(params?.filters?.createdAt[0]),
  //       );
  //       transQryInstance.andWhere('transactions.createdAt >= :fromDate', {
  //         fromDate,
  //       });
  //     }
  //     if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
  //       const toDate = getIsoDateTime(
  //         new Date(
  //           new Date(params?.filters?.createdAt[1]).setHours(23, 59, 59, 999),
  //         ),
  //       );
  //       transQryInstance.andWhere('transactions.createdAt <= :toDate', {
  //         toDate,
  //       });
  //     }
  //     if (params?.filters?.packageName) {
  //       transQryInstance.andWhere('package.packageName LIKE :packageName', {
  //         packageName: `${params?.filters?.packageName}%`,
  //       });
  //     }
  //     if (typeof params?.filters?.subscriptionAmount === 'number') {
  //       transQryInstance.andWhere(
  //         'subscription.subscriptionAmount = :subscriptionAmount',
  //         { subscriptionAmount: params?.filters?.subscriptionAmount },
  //       );
  //     }
  //     if (typeof params?.filters?.transactionAmount === 'number') {
  //       transQryInstance.andWhere(
  //         'transactions.transactionAmount = :transactionAmount',
  //         { transactionAmount: params?.filters?.transactionAmount },
  //       );
  //     }
  //     if (typeof params?.filters?.remainingDays === 'number') {
  //       transQryInstance.andWhere(
  //         'DATEDIFF(subscription.dueDate, CURDATE()) = :remainingDays',
  //         { remainingDays: params?.filters?.remainingDays },
  //       );
  //     }
  //     if (typeof params?.filters?.status === 'number') {
  //       transQryInstance.andWhere('subscription.status = :status', {
  //         status: params?.filters?.status,
  //       });
  //     }
  //     // TODO: Driver Name Filter

  //     // Admin Sort
  //     if (params?.sort?.field && params?.sort?.order) {
  //       const sortField = TransactionsSort[params?.sort?.field];
  //       if (sortField) {
  //         const sortOrder =
  //           params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  //         transQryInstance.orderBy(sortField, sortOrder);
  //       }
  //     } else {
  //       transQryInstance.orderBy('transactions.createdAt', 'DESC');
  //     }
  //     transQryInstance.skip(params.skip);
  //     transQryInstance.take(params.take);
  //     const [result, total] = await transQryInstance.getManyAndCount();
  //     this.logger.debug(
  //       'received user transactions list of ' + total + ' records',
  //     );

  //     const totalCount: number = total;
  //     const transactions: any = result;
  //     const driverIds = transactions.map((data) => data?.senderId);
  //     this.logger.debug(
  //       'filtering driverIds from the list i.e ' + driverIds.length,
  //     );
  //     let driversList = [];
  //     if (driverIds && driverIds.length > 0) {
  //       const driverResponse = await this.clientCaptainTCP
  //         .send(
  //           GET_SELECTED_CAPTAINS,
  //           JSON.stringify({ externalIds: driverIds }),
  //         )
  //         .pipe()
  //         .toPromise();
  //       if (driverResponse && driverResponse.statusCode == HttpStatus.OK) {
  //         this.logger.debug(
  //           'received details from captain service for following drivers :' +
  //             driverIds.join(','),
  //         );
  //         driversList = driverResponse.data;
  //       }
  //     }
  //     this.logger.debug('patching some more info about each transaction');
  //     transactions.map((data) => {
  //       data['driver'] = {};
  //       const driverInfo = driversList.filter(
  //         (rec) => rec.externalId === data.senderId,
  //       );
  //       if (driverInfo && driverInfo.length > 0) {
  //         data['driver'] = driverInfo[0];
  //         delete data['driver'].externalId;
  //       }
  //       if (data?.subscription) {
  //         data['subscription']['remainingDays'] = getDays(
  //           new Date(data?.subscription?.dueDate),
  //           new Date(),
  //         );
  //       }
  //     });

  //     return ResponseData.success({ transactions, totalCount });
  //   } catch (e) {
  //     this.logger.error(
  //       `[findAllTransactions] -> error : ${JSON.stringify(e.message)}`,
  //     );
  //     return ResponseData.error(
  //       HttpStatus.BAD_REQUEST,
  //       errorMessage.SOMETHING_WENT_WRONG,
  //     );
  //   }
  // }

  async findAllTransactions(params: ListSearchSortDto) {
    try {
      const transQryInstance =
        this.transactionRepository.createQueryBuilder('transactions');
      // Admin Filters
      if (params?.filters?.userId) {
        if (params?.filters?.entityType == '3')
          transQryInstance.andWhere('transactions.receiverId  = :userId', {
            userId: params?.filters?.userId,
          });
        else
          transQryInstance.andWhere('transactions.senderId = :userId', {
            userId: params?.filters?.userId,
          });
      }
      if (params?.filters?.transactionId) {
        transQryInstance.andWhere(
          'transactions.transactionId LIKE :transactionId',
          { transactionId: `${params?.filters?.transactionId}%` },
        );
      }
      if (params?.filters?.entityType) {
        transQryInstance.andWhere('transactions.entityType = :entityType', {
          entityType: params?.filters?.entityType,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        transQryInstance.andWhere('transactions.createdAt >= :fromDate', {
          fromDate,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setHours(23, 59, 59, 999),
          ),
        );
        transQryInstance.andWhere('transactions.createdAt <= :toDate', {
          toDate,
        });
      }
      if (typeof params?.filters?.transactionAmount === 'number') {
        transQryInstance.andWhere(
          'transactions.transactionAmount = :transactionAmount',
          { transactionAmount: params?.filters?.transactionAmount },
        );
      }
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = TransactionsSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          transQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        transQryInstance.orderBy('transactions.createdAt', 'DESC');
      }
      transQryInstance.skip(params.skip);
      transQryInstance.take(params.take);
      const [result, total] = await transQryInstance.getManyAndCount();
      this.logger.debug(
        'received user transactions list of ' + total + ' records',
      );
      // await transQryInstance.getManyAndCount();
      const totalCount: number = total;
      const transactions: any = result;
      // transactions;

      return ResponseData.success({ transactions, totalCount });
    } catch (e) {
      this.logger.error(
        `[findAllTransactions] -> error : ${JSON.stringify(e.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findDriverTransactions(params: ListSearchSortDto) {
    try {
      let driversDetails: any = {};
      if (params?.filters?.userId) {
        const driverResponse = await this.clientCaptainTCP
          .send(
            CAPTAIN_DETAIL,
            JSON.stringify({
              id: params?.filters?.userId,
              data: { isSubscription: false },
            }),
          )
          .pipe()
          .toPromise();
        if (driverResponse && driverResponse.statusCode == HttpStatus.OK) {
          driversDetails = driverResponse.data;
        } else {
          this.logger.error(
            'captain details not found for id:' + params?.filters?.userId,
          );
          throw new Error(errorMessage.CAPTAIN_DETAILS_NOT_FOUND);
        }
      }
      if (!driversDetails.externalId) {
        throw new Error(errorMessage.CAPTAIN_DETAILS_NOT_FOUND);
      }

      const userId: string = driversDetails.externalId;
      const fields = [
        'transactions.id',
        'transactions.transactionId',
        'transactions.transactionAmount',
        'transactions.createdAt',
        'package.packageName',
        'subscription.subscriptionAmount',
        'subscription.paidAmount',
        'subscription.dueAmount',
        'subscription.startDate',
        'subscription.endDate',
        'subscription.dueDate',
        'subscription.status',
      ];
      const transQryInstance =
        this.transactionRepository.createQueryBuilder('transactions');
      transQryInstance.select(fields);
      transQryInstance.addSelect(
        'DATEDIFF(subscription.dueDate, CURDATE())',
        'subscription_remainingDays',
      );
      transQryInstance.innerJoin('transactions.subscription', 'subscription');
      transQryInstance.leftJoin('subscription.package', 'package');
      transQryInstance.where('transactions.entityType = :entityType', {
        entityType: ENTITY_TYPE.SUBSCRIPTION,
      });
      transQryInstance.andWhere('subscription.userId = :userId', { userId });
      // Admin Filters
      if (params?.filters?.transactionId) {
        transQryInstance.andWhere(
          'transactions.transactionId LIKE :transactionId',
          { transactionId: `${params?.filters?.transactionId}%` },
        );
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        transQryInstance.andWhere('transactions.createdAt >= :fromDate', {
          fromDate,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setUTCHours(
              23,
              59,
              59,
              999,
            ),
          ),
        );
        transQryInstance.andWhere('transactions.createdAt <= :toDate', {
          toDate,
        });
      }
      if (params?.filters?.packageName) {
        transQryInstance.andWhere('package.packageName LIKE :packageName', {
          packageName: `${params?.filters?.packageName}%`,
        });
      }
      if (typeof params?.filters?.subscriptionAmount === 'number') {
        transQryInstance.andWhere(
          'subscription.subscriptionAmount = :subscriptionAmount',
          { subscriptionAmount: params?.filters?.subscriptionAmount },
        );
      }
      if (typeof params?.filters?.remainingDays === 'number') {
        transQryInstance.andWhere(
          'DATEDIFF(subscription.dueDate, CURDATE()) = :remainingDays',
          { remainingDays: params?.filters?.remainingDays },
        );
      }
      if (typeof params?.filters?.status === 'number') {
        transQryInstance.andWhere('subscription.status = :status', {
          status: params?.filters?.status,
        });
      }

      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = TransactionsSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          transQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        transQryInstance.orderBy('transactions.createdAt', 'DESC');
      }
      transQryInstance.skip(params.skip);
      transQryInstance.take(params.take);
      const [result, total] = await transQryInstance.getManyAndCount();
      this.logger.debug(
        'diver transaction list of ' + total + ' records for captain:' + userId,
      );

      const totalCount: number = total;
      const transactions: any = result;

      this.logger.debug('patching some more info about each transaction');
      transactions.map((data) => {
        if (data?.subscription) {
          data['subscription']['remainingDays'] = getDays(
            new Date(data?.subscription?.dueDate),
            new Date(),
          );
        }
      });

      return ResponseData.success({ transactions, totalCount });
    } catch (e) {
      this.logger.error(
        `[findDriverTransactions] -> error : ${JSON.stringify(e.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAllSubscriptions(params: ListSearchSortDto, type: string) {
    try {
      const fields = [
        'transactions.id',
        'transactions.senderId',
        'transactions.transactionId',
        'transactions.transactionAmount',
        'transactions.createdAt',
        'package.packageName',
        'subscription.subscriptionAmount',
        'subscription.paidAmount',
        'subscription.dueAmount',
        'subscription.startDate',
        'subscription.endDate',
        'subscription.dueDate',
        'subscription.status',
      ];
      const transQryInstance =
        this.transactionRepository.createQueryBuilder('transactions');
      transQryInstance.select(fields);
      transQryInstance.addSelect(
        'DATEDIFF(subscription.dueDate, CURDATE())',
        'subscription_remainingDays',
      );
      transQryInstance.innerJoin('transactions.subscription', 'subscription');
      transQryInstance.leftJoin('subscription.package', 'package');
      if (type === 'expired') {
        transQryInstance.innerJoin(
          (qb) =>
            qb
              .select(['userId', 'MAX(createdAt) AS createdAt'])
              .from(UserSubscriptionsEntity, 'user_subscriptions')
              .where('status = :expiredStatus', {
                expiredStatus: SUBSCRIPTION_STATUS.EXPIRED,
              })
              .groupBy('userId'),
          'us2',
          'us2.userId = subscription.userId AND us2.createdAt = subscription.createdAt',
        );
      }
      transQryInstance.where('transactions.entityType = :entityType', {
        entityType: ENTITY_TYPE.SUBSCRIPTION,
      });
      if (type === 'expired') {
        transQryInstance.where('subscription.status IN (:...status)', {
          status: [SUBSCRIPTION_STATUS.EXPIRED, SUBSCRIPTION_STATUS.CANCEL],
        });
        // TODO: exclude currect active subscribed users
      } else {
        transQryInstance.where('subscription.status IN (:...status)', {
          status: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.OVERDUE],
        });
      }
      //Keyword filter
      if (params?.keyword) {
        transQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('transactions.transactionId LIKE :transactionId', {
              transactionId: `${params?.keyword}%`,
            });
            sqb.orWhere('transactions.senderId LIKE :senderId', {
              senderId: `${params?.keyword}%`,
            });
          }),
        );
      }

      // Admin Filters
      if (params?.filters?.transactionId) {
        transQryInstance.andWhere(
          'transactions.transactionId LIKE :transactionId',
          { transactionId: `${params?.filters?.transactionId}%` },
        );
      }
      if (params?.filters?.senderId) {
        transQryInstance.andWhere('transactions.senderId = :senderId', {
          senderId: params?.filters?.senderId,
        });
      }
      if (params?.filters?.userId) {
        transQryInstance.andWhere('subscription.userId = :userId', {
          userId: params?.filters?.userId,
        });
      }
      if (params?.filters?.startDate && params?.filters?.startDate[0]) {
        const startDateStartsAt = getIsoDate(
          new Date(params?.filters?.startDate[0]),
        );
        transQryInstance.andWhere(
          'subscription.startDate >= :startDateStartsAt',
          { startDateStartsAt },
        );
      }
      if (params?.filters?.startDate && params?.filters?.startDate[1]) {
        const startDateEndsAt = getIsoDate(
          new Date(params?.filters?.startDate[1]),
        );
        transQryInstance.andWhere(
          'subscription.startDate <= :startDateEndsAt',
          { startDateEndsAt },
        );
      }
      if (params?.filters?.endDate && params?.filters?.endDate[0]) {
        const endDateStartsAt = getIsoDate(
          new Date(params?.filters?.endDate[0]),
        );
        transQryInstance.andWhere('subscription.endDate >= :endDateStartsAt', {
          endDateStartsAt,
        });
      }
      if (params?.filters?.endDate && params?.filters?.endDate[1]) {
        const endDateEndsAt = getIsoDate(new Date(params?.filters?.endDate[1]));
        transQryInstance.andWhere('subscription.endDate <= :endDateEndsAt', {
          endDateEndsAt,
        });
      }
      if (params?.filters?.packageName) {
        transQryInstance.andWhere('package.packageName LIKE :packageName', {
          packageName: `${params?.filters?.packageName}%`,
        });
      }
      if (typeof params?.filters?.subscriptionAmount === 'number') {
        transQryInstance.andWhere(
          'subscription.subscriptionAmount = :subscriptionAmount',
          { subscriptionAmount: params?.filters?.subscriptionAmount },
        );
      }
      if (params?.filters?.remainingDays) {
        transQryInstance.andWhere(
          'DATEDIFF(subscription.dueDate, CURDATE()) = :remainingDays',
          { remainingDays: params?.filters?.remainingDays },
        );
      }
      if (typeof params?.filters?.status === 'number') {
        transQryInstance.andWhere('subscription.status = :status', {
          status: params?.filters?.status,
        });
      }
      // TODO: Driver Name Filter

      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = TransactionsSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          transQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        transQryInstance.orderBy('subscription.startDate', 'DESC');
      }
      transQryInstance.skip(params.skip);
      transQryInstance.take(params.take);
      const [result, total] = await transQryInstance.getManyAndCount();

      this.logger.debug(
        'received active subscriptions list of ' + total + ' records',
      );

      const totalCount: number = total;
      const subscriptions: any = result;
      const driverIds = subscriptions.map((data) => data?.senderId);
      this.logger.debug(
        'filtering driverIds from the list i.e ' + driverIds.length,
      );
      let driversList = [];
      if (driverIds && driverIds.length > 0) {
        const driverResponse = await this.clientCaptainTCP
          .send(
            GET_SELECTED_CAPTAINS,
            JSON.stringify({ externalIds: driverIds }),
          )
          .pipe()
          .toPromise();
        if (driverResponse && driverResponse.statusCode == HttpStatus.OK) {
          this.logger.debug(
            'received details from captain service for following drivers :' +
              driverIds.join(','),
          );
          driversList = driverResponse.data;
        }
      }
      this.logger.debug('patching some more info about each transaction');
      subscriptions.map((data) => {
        data['driver'] = {};
        const driverInfo = driversList.filter(
          (rec) => rec.externalId === data.senderId,
        );
        if (driverInfo && driverInfo.length > 0) {
          data['driver'] = driverInfo[0];
          delete data['driver'].externalId;
        }
        if (data?.subscription) {
          data['subscription']['remainingDays'] = getDays(
            new Date(data?.subscription?.dueDate),
            new Date(),
          );
        }
      });

      return ResponseData.success({ subscriptions, totalCount });
    } catch (e) {
      this.logger.error(
        `[findActiveSubscriptions] -> error : ${JSON.stringify(e.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getDashboardEarnings(params: EarningListParams) {
    try {
      let { fromDate, toDate } = params;
      const type: string = params.type || 'week';

      let startDate;
      let endDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        [startDate, endDate] = getDateBounds(type, 'blocks');
      }

      const fields = [
        'SUM(ts.transactionAmount) AS rowTotal',
        'MAX(ts.createdAt) AS maxDate',
      ];
      if (type === 'year') {
        fields.push('DATE_FORMAT(ts.createdAt,"%Y-%m") AS rowDateFormat');
      } else if (type === 'month') {
        fields.push('WEEK(ts.createdAt) AS rowDateFormat');
      } else if (type === 'day' || type === 'custom') {
        fields.push('DATE_FORMAT(ts.createdAt,"%Y-%m-%d") AS rowDateFormat');
      } else if (type === 'week') {
        fields.push('DATE_FORMAT(ts.createdAt, "%d/%m/%Y") AS rowDateFormat');
      } else {
        fields.push('ts.createdAt AS rowDateFormat');
      }
      const transQryInstance =
        this.transactionRepository.createQueryBuilder('ts');
      transQryInstance.select(fields);
      if (params.entity == 'driver') {
        transQryInstance.where('ts.entityType = :entityType', {
          entityType: ENTITY_TYPE.TRIP,
        });
      } else {
        transQryInstance.where('ts.entityType = :entityType', {
          entityType: ENTITY_TYPE.SUBSCRIPTION,
        });
      }
      transQryInstance.andWhere('ts.status = :status', {
        status: TRANSACTION_STATUS.COMPLETED,
      });
      transQryInstance.andWhere(
        "DATE_FORMAT(ts.createdAt, '%Y-%m-%d') >= :startDate",
        { startDate },
      );
      transQryInstance.andWhere(
        "DATE_FORMAT(ts.createdAt, '%Y-%m-%d') <= :endDate",
        { endDate },
      );
      transQryInstance.groupBy('rowDateFormat');
      const results = await transQryInstance.getRawMany();
      this.logger.debug(
        `[getDashboardEarnings] results: ${JSON.stringify(results)}`,
      );

      let graphList = [];
      let loopKey, loopVal, loopObj;
      const rangeList = getDateRange(type);
      rangeList.forEach((dateVal) => {
        loopKey = getGraphLabel(dateVal, type);
        loopObj = results.filter(matchGraphDate(dateVal, type));
        loopVal = loopObj[0]?.rowTotal ?? 0;
        graphList.push({
          key: loopKey,
          value: getAmountFormatted(loopVal),
        });
      });
      this.logger.debug(
        `[getDashboardEarnings] graphList: ${JSON.stringify(graphList)}`,
      );

      let total = results.reduce((prev, curr) => {
        return prev + curr.rowTotal;
      }, 0);
      total = getAmountFormatted(total);
      return ResponseData.success({ graphList, total });
    } catch (err) {
      this.logger.error(`[getDashboardEarnings] error: ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAllEarningsByUser(userId: string, body: SubscriptionEarningDto) {
    try {
      const { page, limit, duration } = body || {};
      this.logger.log(
        `[findAllEarningsByUser] userId: ${userId} | body: ${JSON.stringify(
          body,
        )}`,
      );

      const transactionQuery = this.transactionRepository
        .createQueryBuilder('ts')
        .where('ts.entityType = :entityType', { entityType: ENTITY_TYPE.TRIP })
        .andWhere('ts.receiverId = :receiverId', { receiverId: userId })
        .andWhere('ts.status = :status', {
          status: TRANSACTION_STATUS.COMPLETED,
        })
        .orderBy('ts.createdAt', 'DESC')
        .select([
          'ts.id',
          'ts.createdAt',
          'ts.updatedAt',
          'ts.senderId',
          'ts.receiverId',
          'ts.transactionId',
          'ts.creditAmount',
          'ts.status',
        ]);

      if (page && limit) {
        this.logger.log(
          `[findAllEarningsByUser] | page: ${page} | limit: ${limit}`,
        );
        transactionQuery.skip((page - 1) * limit);
        transactionQuery.take(limit);
      }

      if (duration) {
        this.logger.log(`[findAllEarningsByUser] Duration: ${duration}`);

        const currentDate: Date = new Date();

        const todayDate: Date = new Date(currentDate.toDateString());

        const weekDate: Date = addDays(currentDate, -7);
        const monthDate: Date = addMonths(currentDate, -1);
        const endDate: Date = currentDate;

        this.logger.log(
          `[findAllEarningsByUser] duration | todayDate: ${todayDate} | weekDate: ${weekDate} | monthDate: ${monthDate} | endDate: ${endDate}`,
        );

        switch (duration) {
          case EARNING_DURATION.TODAY:
            transactionQuery.andWhere('ts.createdAt >= :today', {
              today: todayDate,
            });
            break;

          case EARNING_DURATION.WEEKLY:
            transactionQuery.andWhere(
              'ts.createdAt BETWEEN :startDate AND :endDate',
              { startDate: weekDate, endDate },
            );
            break;

          case EARNING_DURATION.MONTHLY:
            transactionQuery.andWhere(
              'ts.createdAt BETWEEN :startDate AND :endDate',
              { startDate: monthDate, endDate },
            );
            break;

          default:
            break;
        }
      }

      const transactions = await transactionQuery.getMany();

      const totalEarning = transactions?.reduce(
        (accumulator: number, item: TransactionEntity) => {
          return accumulator + item.creditAmount;
        },
        0,
      );

      this.logger.log(
        `[findAllEarningsByUser] ${JSON.stringify(transactions)}`,
      );

      return ResponseData.success({
        transactions,
        totalEarning: roundupDecimals(totalEarning),
      });
    } catch (err) {
      this.logger.error(
        `[findAllEarningsByUser] Error in catch: ${err.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getTaxPercentage() {
    return (
      (await this.redisHandler.getRedisKey('SETTING_TRIP_TAX_PERCENTAGE')) || 15
    );
  }
  async getMasterCardFee() {
    return (
      (await this.redisHandler.getRedisKey('SETTING_MASTER_CARD_FEE')) || 0
    );
  }

  async getVisaCardFee() {
    return (await this.redisHandler.getRedisKey('SETTING_VISA_CARD_FEE')) || 0;
  }
  // date to be like 2022-12-14
  async getSingleDayEarning(date: String) {
    let sDate = date + 'T00:00:00.00Z';
    let eDate = date + 'T23:59:59.999Z';
    try {
      const transactionQ = this.transactionRepository.createQueryBuilder('ts');
      transactionQ.select(['ts.creditAmount']);
      transactionQ.andWhere('ts.createdAt BETWEEN :startDate AND :endDate', {
        startDate: sDate,
        endDate: eDate,
      });
      let res = await transactionQ.getRawMany();

      //get total earning,
      const totalDailyEarning: number = res?.reduce(
        (accumulator: number, item: any) => {
          return accumulator + item.ts_creditAmount;
        },
        0,
      );

      //get minEarning from result
      let minDateEarning: number = res?.reduce((prev: number, item: any) => {
        return prev < item.ts_creditAmount ? prev : item.ts_creditAmount;
      }, 100000000000000);
      if (minDateEarning == 100000000000000) {
        minDateEarning = 0;
      }

      //get maximum earning from result
      const maxDateEarning: number = res?.reduce((prev: number, item: any) => {
        return prev > item.ts_creditAmount ? prev : item.ts_creditAmount;
      }, 0);

      return ResponseData.success({
        totalDateEarning: roundupDecimals(totalDailyEarning),
        minDateEarning: roundupDecimals(minDateEarning),
        maxDateEarning: roundupDecimals(maxDateEarning),
      });
    } catch (err) {
      // console.log(err.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async cashflows(params: StatsParams) {
    try {
      let { fromDate, toDate } = params;
      const type: string = params.type || 'week';

      let startDate, endDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        [startDate, endDate] = getDateBounds(type, 'blocks');
      }

      const cashFlow: any = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select([
          'SUM(CASE WHEN entityType = 3 and status = 2 THEN transaction.transactionAmount ELSE 0 END) walletTopup',
          'SUM(CASE WHEN entityType = 2 and status = 2 THEN transaction.transactionAmount ELSE 0 END) subscription',
          // 'SUM(CASE WHEN entityType = 1 THEN transaction.receiverAmount ELSE 0 END) tripFare',
          'SUM(bankFee) bankFee',
          'SUM(CASE WHEN entityType = 1 and status = 2 THEN transaction.creditAmount ELSE 0 END) paymentToDrivers',
          // 'SUM(transaction.senderTax + transaction.receiverTax) vat',

          'SUM(CASE WHEN entityType = 2 and status = 2 THEN transaction.senderTax WHEN entityType = 3 and status = 2 THEN transaction.receiverTax ELSE 0 END) vat',
          'SUM(CASE WHEN entityType = 1 and status = 2 THEN transaction.receiverFee ELSE 0 END) fee',
          // '(SUM(transaction.senderTax) + SUM(transaction.receiverTax)) vat',
          // '(SUM(transaction.senderFee) + SUM(transaction.receiverFee)) fee',
        ])
        .where("DATE_FORMAT(transaction.createdAt, '%Y-%m-%d') >= :startDate", {
          startDate,
        })
        .andWhere(
          "DATE_FORMAT(transaction.createdAt, '%Y-%m-%d') <= :endDate",
          {
            endDate,
          },
        )
        .getRawMany();
      return ResponseData.success({
        ...cashFlow,
      });
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // app usage
  async earningAndTopupGraph(
    userId,
    entityType: ENTITY_TYPE,
    params: StatsParams,
  ) {
    try {
      let { fromDate, toDate } = params;
      const type: string = params.type || 'week';

      let startDate, endDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        [startDate, endDate] = getDateBounds(type, 'blocks');
      }
      const fields = [
        'SUM(creditAmount) AS rowTotal',
        'MAX(ts.createdAt) AS maxDate',
      ];
      if (type === 'year') {
        fields.push('DATE_FORMAT(ts.createdAt,"%Y-%m") AS rowDateFormat');
      } else if (type === 'month') {
        fields.push('WEEK(ts.createdAt) AS rowDateFormat');
      } else if (type === 'week') {
        fields.push('DATE_FORMAT(ts.createdAt,"%Y-%m-%d") AS rowDateFormat');
      } else {
        fields.push('ts.createdAt AS rowDateFormat');
      }
      const transactionQuery =
        this.transactionRepository.createQueryBuilder('ts');
      transactionQuery.select(fields);
      transactionQuery
        .where('ts.entityType = :entityType', { entityType: entityType })
        .andWhere('ts.receiverId = :receiverId', { receiverId: userId })
        .andWhere('ts.status = :status', {
          status: TRANSACTION_STATUS.COMPLETED,
        });
      transactionQuery.andWhere(
        "DATE_FORMAT(ts.createdAt, '%Y-%m-%d') >= :startDate",
        { startDate },
      );
      transactionQuery.andWhere(
        "DATE_FORMAT(ts.createdAt, '%Y-%m-%d') <= :endDate",
        { endDate },
      );
      transactionQuery.groupBy('rowDateFormat');
      let results = await transactionQuery.getRawMany();

      const totalStats = {
        Amount: 0,
      };
      const graphList = [];

      let totalVal = 0,
        minAmount: number = 0,
        maxAmount: number = 0;
      if (results?.length) {
        let dateStats = {};
        let statCode, statLabel;
        results.forEach((record) => {
          statCode = 'Amount';
          if (type === 'month') {
            record.maxDate = getDateOfWeek(
              Number(record.rowDateFormat),
              record.maxDate.getFullYear(),
            );
          }
          statLabel = getGraphLabel(record.maxDate, type);
          if (!dateStats[statLabel]) {
            dateStats[statLabel] = {};
          }
          if (statCode !== '') {
            totalStats[statCode] += Number(record.rowTotal || 0);
            dateStats[statLabel][statCode] =
              (dateStats[statLabel][statCode] || 0) +
              Number(record.rowTotal || 0);
          }

          minAmount =
            Number(record.rowTotal) < minAmount || minAmount < 1
              ? Number(record.rowTotal)
              : minAmount;
          maxAmount =
            Number(record.rowTotal) > maxAmount
              ? Number(record.rowTotal)
              : maxAmount;
        });
        totalVal = Object.keys(totalStats).reduce((prev, curr) => {
          return prev + totalStats[curr];
        }, 0);

        let loopKey, loopVal, loopObj;
        const rangeList = getDateRange(type);
        rangeList.forEach((dateVal) => {
          loopKey = getGraphLabel(dateVal, type);
          loopObj = dateStats[loopKey] ?? {};
          loopVal = [];
          Object.keys(loopObj).forEach((innKey) => {
            loopVal.push({
              key: innKey,
              value: roundupDecimals(Number(loopObj[innKey])),
            });
          });
          Object.keys(totalStats).forEach((statKey) => {
            loopObj = loopVal.find((innVal) => innVal.key == statKey);
            if (!loopObj) {
              loopVal.push({
                key: statKey,
                value: 0,
              });
            }
          });
          graphList.push({
            key: loopKey,
            data: loopVal,
          });
        });
        dateStats = {};
        results = [];
      }
      return ResponseData.success({
        graphList,
        totalAmount: roundupDecimals(totalVal),
        maxAmount: roundupDecimals(maxAmount),
        minAmount: roundupDecimals(minAmount),
      });
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async topupAndSpentGraph(userId, params: StatsParams) {
    try {
      let { fromDate, toDate } = params;
      const type: string = params.type || 'week';

      let startDate, endDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        [startDate, endDate] = getDateBounds(type, 'blocks');
      }
      const fields = [
        `SUM(CASE WHEN (entityType = 3 and receiverId = ${userId}) THEN ts.creditAmount ELSE 0 END) rowTotal`,
        `SUM(CASE WHEN (entityType = 1 and senderId = ${userId}) THEN ts.debitAmount ELSE 0 END) totalSpent`,
        'MAX(ts.createdAt) AS maxDate',
        'ts.entityType AS entityType',
      ];
      if (type === 'year') {
        fields.push('DATE_FORMAT(ts.createdAt,"%Y-%m") AS rowDateFormat');
      } else if (type === 'month') {
        fields.push('WEEK(ts.createdAt) AS rowDateFormat');
      } else if (type === 'week') {
        fields.push('DATE_FORMAT(ts.createdAt,"%Y-%m-%d") AS rowDateFormat');
      } else {
        fields.push('ts.createdAt AS rowDateFormat');
      }
      const transactionQuery =
        this.transactionRepository.createQueryBuilder('ts');
      transactionQuery.select(fields);
      transactionQuery
        .where('ts.entityType IN (:...entityType)', {
          entityType: [ENTITY_TYPE.TRIP, ENTITY_TYPE.TOP_UP],
        })
        .andWhere('(ts.receiverId = :receiverId OR ts.senderId = :senderId)', {
          receiverId: userId,
          senderId: userId,
        })
        .andWhere('ts.status = :status', {
          status: TRANSACTION_STATUS.COMPLETED,
        });
      transactionQuery.andWhere(
        "DATE_FORMAT(ts.createdAt, '%Y-%m-%d') >= :startDate",
        { startDate },
      );
      transactionQuery.andWhere(
        "DATE_FORMAT(ts.createdAt, '%Y-%m-%d') <= :endDate",
        { endDate },
      );
      transactionQuery.groupBy('rowDateFormat,entityType');
      let results = await transactionQuery.getRawMany();
      const totalStats = {
        topup: 0,
        spent: 0,
      };
      const graphList = [];
      let totalTopup = 0,
        totalSpent = 0;
      if (results?.length) {
        let dateStats = {};
        let statCode, statLabel;
        results.forEach((record) => {
          if (record?.entityType == ENTITY_TYPE.TOP_UP) statCode = 'topup';
          else if (record?.entityType == ENTITY_TYPE.TRIP) statCode = 'spent';
          else statCode = '';
          if (type === 'month') {
            record.maxDate = getDateOfWeek(
              Number(record.rowDateFormat),
              record.maxDate.getFullYear(),
            );
          }
          statLabel = getGraphLabel(record.maxDate, type);
          if (!dateStats[statLabel]) {
            dateStats[statLabel] = {};
          }
          if (statCode == 'topup') {
            totalStats[statCode] += Number(record.rowTotal || 0);
            dateStats[statLabel][statCode] =
              (dateStats[statLabel][statCode] || 0) +
              Number(record.rowTotal || 0);
          } else if (statCode == 'spent') {
            totalStats[statCode] += Number(record.totalSpent || 0);
            dateStats[statLabel][statCode] =
              (dateStats[statLabel][statCode] || 0) +
              Number(record.totalSpent || 0);
          }
        });

        totalTopup = Object.keys(totalStats).reduce((prev, curr) => {
          return curr == 'topup' ? prev + totalStats[curr] : prev;
        }, 0);
        totalSpent = Object.keys(totalStats).reduce((prev, curr) => {
          return curr == 'spent' ? prev + totalStats[curr] : prev;
        }, 0);
        let loopKey, loopVal, loopObj;
        const rangeList = getDateRange(type);
        rangeList.forEach((dateVal) => {
          loopKey = getGraphLabel(dateVal, type);
          loopObj = dateStats[loopKey] ?? {};
          loopVal = [];
          Object.keys(loopObj).forEach((innKey) => {
            loopVal.push({
              key: innKey,
              value: roundupDecimals(Number(loopObj[innKey])),
            });
          });
          Object.keys(totalStats).forEach((statKey) => {
            loopObj = loopVal.find((innVal) => innVal.key == statKey);
            if (!loopObj) {
              loopVal.push({
                key: statKey,
                value: 0,
              });
            }
          });
          graphList.push({
            key: loopKey,
            data: loopVal,
          });
        });
        dateStats = {};
        results = [];
      }
      return ResponseData.success({
        graphList,
        total: {
          topup: roundupDecimals(totalTopup),
          spent: roundupDecimals(totalSpent),
        },
      });
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // dashboard captain average earning per ride.
  async captainAverageEarningGraph(
    userId,
    entityType: ENTITY_TYPE,
    params: StatsParams,
  ) {
    try {
      let { fromDate, toDate } = params;
      const type: string = params.type || 'week';

      let startDate, endDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        [startDate, endDate] = getDateBounds(type, 'blocks');
      }
      const fields = [
        'SUM(creditAmount) AS rowTotal',
        'MAX(creditAmount) AS rowMax',
        'MIN(creditAmount) AS rowMin',
        'COUNT(CASE WHEN creditAmount THEN 1 END) AS rowCount',
        'MAX(ts.createdAt) AS maxDate',
      ];
      if (type === 'year') {
        fields.push('DATE_FORMAT(ts.createdAt,"%Y-%m") AS rowDateFormat');
      } else if (type === 'month') {
        fields.push('WEEK(ts.createdAt) AS rowDateFormat');
      } else if (type === 'week') {
        fields.push('DATE_FORMAT(ts.createdAt,"%Y-%m-%d") AS rowDateFormat');
      } else {
        fields.push('ts.createdAt AS rowDateFormat');
      }
      const transactionQuery =
        this.transactionRepository.createQueryBuilder('ts');
      transactionQuery.select(fields);
      transactionQuery
        .where('ts.entityType = :entityType', { entityType: entityType })
        .andWhere('ts.receiverId = :receiverId', { receiverId: userId })
        .andWhere('ts.status = :status', {
          status: TRANSACTION_STATUS.COMPLETED,
        });
      transactionQuery.andWhere(
        "DATE_FORMAT(ts.createdAt, '%Y-%m-%d') >= :startDate",
        { startDate },
      );
      transactionQuery.andWhere(
        "DATE_FORMAT(ts.createdAt, '%Y-%m-%d') <= :endDate",
        { endDate },
      );
      transactionQuery.groupBy('rowDateFormat');
      let results = await transactionQuery.getRawMany();

      // console.log(results);

      const totalStats = {
        Amount: 0,
      };
      const graphList = [];

      let totalVal = 0,
        max: number = 0,
        min: number = 0,
        rideCount: number = 0,
        anotherTotal: number = 0,
        minAmount: number = 0,
        maxAmount: number = 0;
      if (results?.length) {
        let dateStats = {};
        let statCode, statLabel;
        results.forEach((record) => {
          if (max < record.rowMax) {
            max = record.rowMax;
          }
          min = record.rowMin;
          if (min > record.rowMin) {
            min = record.rowMin;
          }

          if (type === 'day') {
            rideCount = rideCount + parseInt(record.rowCount);
          } else {
            rideCount = record.rowCount;
          }
          anotherTotal = anotherTotal + parseInt(record.rowCount);
          // console.log(rideCount);
          // console.log('+++++++++++++++++++++++++++++++++');
          // console.log(record.rowTotal);
          // console.log(record.rowCount);

          statCode = 'Amount';
          if (type === 'month') {
            record.maxDate = getDateOfWeek(
              Number(record.rowDateFormat),
              record.maxDate.getFullYear(),
            );
          }
          statLabel = getGraphLabel(record.maxDate, type);
          if (!dateStats[statLabel]) {
            dateStats[statLabel] = {};
          }
          if (statCode !== '') {
            totalStats[statCode] += Number(record.rowTotal || 0);
            dateStats[statLabel][statCode] =
              (dateStats[statLabel][statCode] || 0) +
              Number(record.rowTotal || 0);
          }

          minAmount =
            Number(record.rowTotal) < minAmount || minAmount < 1
              ? Number(record.rowTotal)
              : minAmount;
          maxAmount =
            Number(record.rowTotal) > maxAmount
              ? Number(record.rowTotal)
              : maxAmount;
        });
        totalVal = Object.keys(totalStats).reduce((prev, curr) => {
          return prev + totalStats[curr];
        }, 0);
        // console.log(anotherTotal);
        // console.log('anotherTotal');
        // console.log('totalVal');
        // console.log(totalVal);
        totalVal = totalVal / anotherTotal;
        // console.log('new total value');
        // console.log(totalVal);

        let loopKey, loopVal, loopObj;
        const rangeList = getDateRange(type);
        rangeList.forEach((dateVal) => {
          loopKey = getGraphLabel(dateVal, type);
          loopObj = dateStats[loopKey] ?? {};
          loopVal = [];
          Object.keys(loopObj).forEach((innKey) => {
            loopVal.push({
              key: innKey,
              value: roundupDecimals(Number(loopObj[innKey]) / rideCount),
            });
          });
          Object.keys(totalStats).forEach((statKey) => {
            loopObj = loopVal.find((innVal) => innVal.key == statKey);
            if (!loopObj) {
              loopVal.push({
                key: statKey,
                value: 0,
              });
            }
          });
          graphList.push({
            key: loopKey,
            data: loopVal,
          });
        });
        dateStats = {};
        results = [];
      }
      return ResponseData.success({
        graphList,
        totalAmount: roundupDecimals(totalVal),
        maxAmount: roundupDecimals(max),
        minAmount: roundupDecimals(min),
      });
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
}

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan } from 'typeorm';

import { socketMicroServiceConfig } from 'src/microServicesConfigs';

import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';
import { getIsoDate, addMonths, addDays } from 'src/utils/get-timestamp';

import {
  GET_CUSTOMER_DETAIL,
  SEND_EMAIL_NOTIFICATION,
  SEND_PUSH_NOTIFICATION,
  SEND_SMS_NOTIFICATION,
  UPDATE_CAPTAIN_SUBSCRIPTION,
} from 'src/constants/kafka-constant';

import { SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from './enum';
import {
  CreateUserSubscriptionDto,
  UpdateUserSubscriptionDto,
} from './dto/user-subscription.dto';
import { UserSubscriptionRepository } from './user-subscription.repository';

import { TransactionService } from '../transactions/transaction.service';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import { ENTITY_TYPE, TRANSACTION_STATUS } from '../transactions/enum';
import { successMessage } from 'src/constants/success-message-constant';
import { UserSubscriptionsEntity } from './entities/user-subscription.entity';
import { TransferService } from '../transfer/transfer.service';
import {
  SubscriptionFindAllInterface,
  SubscriptionFindOneInterface,
} from './interface/user-subscription.interface';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { RedisHandler } from 'src/helpers/redis-handler';

import { EMIT_TO_ADMIN_DASHBOARD } from 'src/constants/kafka-constant';
import { TRANSACTION_STATUS_COMPLETED_OF_SUBSCRIPTION_ENTITY } from 'src/constants/socket-constants';

@Injectable()
export class UserSubscriptionService {
  private readonly logger = new LoggerHandler(
    UserSubscriptionService.name,
  ).getInstance();

  constructor(
    @InjectRepository(UserSubscriptionRepository)
    private userSubscriptionRepository: UserSubscriptionRepository,
    private transactionService: TransactionService,
    private transferService: TransferService,
    private redisHandler: RedisHandler,
    @Inject('CLIENT_CAPTAIN_SERVICE_KAFKA')
    private clientCaptainKafka: ClientKafka,
    @Inject('CLIENT_NOTIFICATION_SERVICE_KAFKA')
    private clientNotificationKafka: ClientKafka,
    @Inject('TRIP_KAFKA_CLIENT_SERVICE') private tripKafkaClient: ClientKafka,
    @Inject('TRIP_TCP_CLIENT_SERVICE') private tripTcpClient: ClientProxy,
  ) {
    // this.tripKafkaClient.subscribeToResponseOf(GET_CUSTOMER_DETAIL);
  }

  @Client(socketMicroServiceConfig)
  socketGateway: ClientKafka;

  async create(
    params: CreateUserSubscriptionDto,
    transactionId: string = null,
    eWalletAPIResponse = null,
  ) {
    try {
      const userSubscription = this.userSubscriptionRepository.create(params);
      await this.userSubscriptionRepository.save(userSubscription);
      this.logger.log(
        'user subscription created successfully for userId:' + params.userId,
      );

      // create transaction
      const transParams: CreateTransactionDto = {
        entityId: userSubscription.id,
        entityType: ENTITY_TYPE.SUBSCRIPTION,
        senderId: userSubscription.userId,
        receiverId: '0', // Need to confirm
        transactionId: transactionId, // e-wallet transaction id
        transactionAmount:
          params?.transactionAmount || userSubscription.subscriptionAmount,
        senderAmount: userSubscription.subscriptionAmount, // Need to confirm
        senderTax: params?.tax || 0, // Need to confirm
        senderFee: params?.fee || 0,
        receiverAmount: userSubscription.paidAmount, // Need to confirm
        receiverTax: 0, // Need to confirm
        creditAmount: userSubscription.paidAmount, // Need to confirm
        debitAmount: userSubscription.paidAmount, // Need to confirm
        taxAmount: 0, // Need to confirm
        source: params?.source,
        sourceRef: params?.sourceRef,
        eWalletAPIResponse: eWalletAPIResponse
          ? JSON.stringify(eWalletAPIResponse)
          : null,
        status:
          params.dueAmount > 0
            ? TRANSACTION_STATUS.FAILED
            : TRANSACTION_STATUS.COMPLETED,
      };
      await this.transactionService.create(transParams);
      this.logger.log(
        'Transaction created for the above user subscription:' +
          userSubscription.id,
      );

      // send notification
      if (params.notify) {
        this.sendNotifications('become_captain', userSubscription.userId);
      }

      if (!(params.dueAmount > 0)) {
        // Updates admin dashboard stats as transaction status is updated to completed of entity type subscription
        await this.notifyAdminDashboardAsTransactionStatusCompletedOfSubscriptionEntity();
      }

      return ResponseData.success(userSubscription);
    } catch (error) {
      this.logger.error(
        'Error creating user subscription' + JSON.stringify(error),
      );
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAll(params: SubscriptionFindAllInterface) {
    try {
      const { page, limit } = params?.pagination || {};

      const subQryInstance =
        this.userSubscriptionRepository.createQueryBuilder('us');

      // fetch latest one (recent) subscription for each driver
      if (params?.latest) {
        subQryInstance.innerJoin(
          (qb) =>
            qb
              .select(['userId', 'MAX(createdAt) AS createdAt'])
              .from(UserSubscriptionsEntity, 'user_subscriptions')
              .groupBy('userId'),
          'us2',
          'us2.userId = us.userId AND us2.createdAt = us.createdAt',
        );
      }

      subQryInstance.where('us.userId IN (:...userIds)', {
        userIds: params.userIds,
      });

      if (params?.status) {
        subQryInstance.andWhere('us.status = :status', {
          status: params.status,
        });
      }

      if (page && limit) {
        this.logger.log(`[findAll] | page: ${page} | limit: ${limit}`);
        subQryInstance.skip((page - 1) * limit);
        subQryInstance.take(limit);
      }

      subQryInstance.orderBy('us.createdAt', 'DESC');

      const userSubscription = await subQryInstance.getMany();

      return ResponseData.success(userSubscription);
    } catch (error) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findOne(params: SubscriptionFindOneInterface) {
    try {
      const subQryInstance =
        this.userSubscriptionRepository.createQueryBuilder('us');
      subQryInstance.where('us.userId = :userId', { userId: params.userId });
      if (params?.status) {
        subQryInstance.andWhere('us.status = :status', {
          status: params.status,
        });
      }
      subQryInstance.orderBy('us.createdAt', 'DESC');
      const userSubscription = await subQryInstance.getOne();
      if (!userSubscription) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.SUBSCRIPTION_NOT_FOUND,
        );
      }
      return ResponseData.success(userSubscription);
    } catch (error) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async update(id: string, params: UpdateUserSubscriptionDto) {
    try {
      await this.userSubscriptionRepository.update(id, params);
      const userSubscription = await this.userSubscriptionRepository.findOne(
        id,
      );
      return ResponseData.success(userSubscription);
    } catch (error) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async processRenewSubscriptions() {
    //TODO:: update bulk record for performance optimization
    this.logger.debug('processing subscription renewals');

    // Fetch due date subscriptions
    const currentDate: string = getIsoDate(new Date());
    const dueSubscriptions = await this.userSubscriptionRepository.find({
      dueDate: currentDate,
      status: SUBSCRIPTION_STATUS.ACTIVE,
    });
    this.logger.debug(
      'fetching due subscriptions on today i.e ' +
        currentDate +
        ' and found ' +
        dueSubscriptions.length,
    );
    if (dueSubscriptions && dueSubscriptions?.length > 0) {
      this.logger.debug('start renewing each due subscriptions');
      dueSubscriptions.forEach((record) => {
        this.renewUserSubscription(record, currentDate);
      });
      this.logger.log('completed renewing all due subscriptions');
    }

    // If the yesterday cronjob failed to update due subscriptions
    const oldSubscriptions = await this.userSubscriptionRepository.find({
      dueDate: LessThan(currentDate),
      status: SUBSCRIPTION_STATUS.ACTIVE,
    });
    this.logger.debug(
      'fetching any due subscriptions failed on before today and found ' +
        oldSubscriptions.length,
    );
    if (oldSubscriptions && oldSubscriptions?.length > 0) {
      this.logger.debug('start renewing failed subscriptions of before today');
      oldSubscriptions.forEach((record) => {
        this.renewUserSubscription(record, String(record.dueDate));
      });
      this.logger.log(
        'completed renewing all failed subscriptions of before today',
      );
    }

    return true;
  }

  async renewUserSubscription(
    record: UserSubscriptionsEntity,
    currentDate: string,
    forceActivate = false,
  ) {
    // Expire current subscription
    await this.expireExisting(record.id);

    if (!record.autoRenewal && !forceActivate) {
      return;
    }

    // Subscription renew e-wallet API
    const transactionResponse =
      await this.transferService.addSubscriptionTransaction({
        customerId: record.userId,
        amount: record.subscriptionAmount,
        fee: 0, // TODO add fee
        tax: 0, // TODO add tax
      });

    // After API call add the new record
    const month = record.subscriptionType === SUBSCRIPTION_TYPE.YEARLY ? 12 : 1;
    this.logger.log(
      'renewal subscription done for user ' +
        record.userId +
        ' for ' +
        month +
        ' month',
    );

    const startDate: Date = new Date(currentDate);
    const endDate: Date = addMonths(startDate, month);
    const dueDate: Date = addDays(endDate, 1);

    let subParams: CreateUserSubscriptionDto = {
      userId: record.userId,
      userType: record.userType,
      subscriptionId: record.subscriptionId,
      subscriptionType: record.subscriptionType,
      autoRenewal: record.autoRenewal,
      subscriptionAmount: record.subscriptionAmount, // Need to confirm
      paidAmount: record.subscriptionAmount, // Depends upon e-wallet API response
      dueAmount: record.dueAmount, // Depends upon e-wallet API response
      startDate: getIsoDate(startDate),
      endDate: getIsoDate(endDate),
      dueDate: getIsoDate(dueDate),
      status: SUBSCRIPTION_STATUS.ACTIVE, // Depends upon e-wallet API response
      notify: false,
    };

    if (
      transactionResponse.statusCode === HttpStatus.OK &&
      transactionResponse?.data?.txnId
    ) {
      await this.create(
        subParams,
        transactionResponse.data.txnId,
        transactionResponse.data,
      );
    } else {
      subParams = {
        ...subParams,
        paidAmount: 0,
        dueAmount: record.dueAmount + record.subscriptionAmount,
      };
      await this.create(subParams, null, transactionResponse);
    }

    this.clientCaptainKafka.emit(
      UPDATE_CAPTAIN_SUBSCRIPTION,
      JSON.stringify({ userId: record.userId, status: 1 }),
    );

    return transactionResponse;
  }

  async expireExisting(subscriptionId: string) {
    this.logger.log(`[expireExisting] subscriptionId: ${subscriptionId}`);

    // Expire current subscription
    const expireParams = {
      status: SUBSCRIPTION_STATUS.EXPIRED,
      autoRenewal: false,
    };

    await this.userSubscriptionRepository.update(subscriptionId, expireParams);
    this.logger.log(
      `[expireExisting] Success | subscriptionId: ${subscriptionId}`,
    );

    return;
  }

  //Cancel User Subscription
  async cancel(userId: string) {
    try {
      this.logger.log(`[cancel] | userId: ${userId}`);

      const userSubscription = await this.userSubscriptionRepository.findOne({
        userId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      });

      if (!userSubscription) {
        this.logger.error('user subscription not found for:' + userId);
        throw new Error(errorMessage.SUBSCRIPTION_NOT_AVAILABLE);
      }

      if (userSubscription?.dueAmount > 0) {
        this.logger.error(
          'subscription cannot cancelled as Due amount pending for :' + userId,
        );

        const isTransactionSuccessful =
          await this.transferService.addSubscriptionTransaction({
            customerId: userId,
            amount: userSubscription?.dueAmount,
            fee: 0,
            tax: 0,
          });

        if (isTransactionSuccessful.statusCode !== HttpStatus.OK) {
          throw new Error(errorMessage.SUBSCRIPTION_HAS_DUE_AMOUNT);
        }
      }

      await this.userSubscriptionRepository.update(userSubscription.id, {
        status: SUBSCRIPTION_STATUS.CANCEL,
        paidAmount: userSubscription.subscriptionAmount,
        dueAmount: 0,
      });
      // this.clientCaptainKafka.emit(UPDATE_CAPTAIN_SUBSCRIPTION, JSON.stringify({ userId, status: 0 }));

      // send notification
      this.sendNotifications('subscription_cancelled', userId);

      this.logger.log('subscription cancelled successfully for : ' + userId);

      return ResponseData.successWithMessage(
        successMessage.SUBSCRIPTION_CANCELLED,
      );
    } catch (error) {
      this.logger.error('Error cancelling user subscription' + error?.message);
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  //Activate User Subscription
  async activate(userId: string) {
    try {
      this.logger.log(`[activate] | userId: ${userId}`);

      const userSubscription = await this.userSubscriptionRepository.findOne({
        userId,
        status: SUBSCRIPTION_STATUS.CANCEL,
      });

      if (!userSubscription) {
        this.logger.error(
          '[activate] user subscription not found for:' + userId,
        );
        throw new Error(errorMessage.CANCEL_SUBSCRIPTION_NOT_AVAILABLE);
      }

      const currentDate: Date = new Date();
      const dueDate: Date = new Date(userSubscription.dueDate);
      this.logger.log(
        `[activate] | currentDate: ${currentDate} | dueDate: ${dueDate}`,
      );

      if (currentDate > dueDate) {
        // throw new Error(errorMessage.SUBSCRIPTION_PASSED_DUE_DATE)

        const isTransactionSuccessful = await this.renewUserSubscription(
          userSubscription,
          getIsoDate(currentDate),
          true,
        );

        if (isTransactionSuccessful.statusCode !== HttpStatus.OK) {
          throw new Error(errorMessage.SUBSCRIPTION_TRANSACTION_FAILED);
        }
      } else {
        await this.userSubscriptionRepository.update(userSubscription.id, {
          status: SUBSCRIPTION_STATUS.ACTIVE,
        });
      }

      // this.clientCaptainKafka.emit(UPDATE_CAPTAIN_SUBSCRIPTION, JSON.stringify({ userId, status: 1 }));

      // send notification
      this.sendNotifications('subscription_activated', userId);

      this.logger.log(
        '[activate] subscription activated successfully for : ' + userId,
      );
      return ResponseData.successWithMessage(
        successMessage.SUBSCRIPTION_ACTIVATED,
      );
    } catch (error) {
      this.logger.error(
        '[activate] Error while activate user subscription' + error?.message,
      );
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async changeAutoRenewalStatus(userId: string) {
    try {
      const userActiveSubscription = await this.findOne({
        userId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      });
      if (userActiveSubscription.statusCode == HttpStatus.OK) {
        await this.update(userActiveSubscription.data.id, {
          autoRenewal: !userActiveSubscription.data.autoRenewal,
        });
        return ResponseData.successWithMessage(
          successMessage.AUTO_RENEWAL_STATUS_CHANGED,
        );
      } else return userActiveSubscription;
    } catch (err) {
      this.logger.error(
        '[changeAutoRenewalStatus] Error while changing subscription renewal status' +
          err?.message,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCount(params: SubscriptionFindAllInterface) {
    try {
      const subQryInstance =
        this.userSubscriptionRepository.createQueryBuilder('us');
      subQryInstance.select([
        'ANY_VALUE(us.userId) AS userId',
        'COUNT(*) AS totalSubscriptions',
      ]);
      if (params?.userIds) {
        subQryInstance.where('us.userId IN (:...userIds)', {
          userIds: params.userIds,
        });
      }
      if (params?.status) {
        subQryInstance.andWhere('us.status = :status', {
          status: params.status,
        });
      }
      subQryInstance.groupBy('us.userId');

      const userSubscription = await subQryInstance.getRawMany();

      return ResponseData.success(userSubscription);
    } catch (error) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async sendNotifications(code: string, userId: string) {
    // Notifications
    let driverDetails: any = {};
    let driverResponse = await this.tripTcpClient
      .send(GET_CUSTOMER_DETAIL, JSON.stringify({ userId }))
      .pipe()
      .toPromise();
    if (driverResponse && driverResponse.statusCode === HttpStatus.OK) {
      driverDetails = driverResponse.data;
    } else {
      return;
    }

    const captainName =
      driverDetails?.prefferedLanguage === 'AR'
        ? driverDetails?.arabicFirstName
          ? `${driverDetails?.arabicFirstName} ${driverDetails?.arabicLastName}`
          : `${driverDetails?.firstName} ${driverDetails?.lastName}`
        : driverDetails?.firstName
        ? `${driverDetails?.firstName} ${driverDetails?.lastName}`
        : '';

    // DRIVER
    // SMS notification to driver
    const driverSmsActionCodes = {
      subscription_expired: 'SUBSCRIPTION_EXPIRED_TO_DRIVER',
      subscription_overdue: 'SUBSCRIPTION_OVERDUE_TO_DRIVER',
    };
    if (code in driverSmsActionCodes) {
      try {
        const smsParams: any = {
          externalId: driverDetails?.userId,
          language: driverDetails?.prefferedLanguage,
          mobileNo: driverDetails?.mobileNo,
          templateCode: driverSmsActionCodes[code],
          keyValues: {
            captainName: captainName,
            // TODO: depends upon template
          },
        };
        this.clientNotificationKafka.emit(
          SEND_SMS_NOTIFICATION,
          JSON.stringify(smsParams),
        );
      } catch (e) {
        this.logger.error(e.message);
      }
    }
    // Push notification to driver
    const driverPushActionCodes = {
      subscription_activated: 'SUBSCRIPTION_ACTIVATED_TO_DRIVER',
      subscription_cancelled: 'SUBSCRIPTION_CANCELLED_TO_DRIVER',
      subscription_expired: 'SUBSCRIPTION_EXPIRED_TO_DRIVER',
      subscription_overdue: 'SUBSCRIPTION_OVERDUE_TO_DRIVER',
    };
    if (code in driverPushActionCodes) {
      try {
        const pushParams: any = {
          externalId: driverDetails?.userId,
          language: driverDetails?.prefferedLanguage,
          deviceToken: driverDetails?.deviceToken,
          templateCode: driverPushActionCodes[code],
          keyValues: {
            captainName: captainName,
            // TODO: depends upon template
          },
          extraParams: {
            type: code,
            userID: driverDetails?.userId,
          },
        };
        this.clientNotificationKafka.emit(
          SEND_PUSH_NOTIFICATION,
          JSON.stringify(pushParams),
        );
      } catch (e) {
        this.logger.error(e.message);
      }
    }
    // Email notification for rider
    const driverEmailActionCodes = {
      become_captain: 'BECOME_CAPTAIN_TO_DRIVER',
      subscription_activated: 'SUBSCRIPTION_ACTIVATED_TO_DRIVER',
      subscription_cancelled: 'SUBSCRIPTION_CANCELLED_TO_DRIVER',
      subscription_expired: 'SUBSCRIPTION_EXPIRED_TO_DRIVER',
      subscription_overdue: 'SUBSCRIPTION_OVERDUE_TO_DRIVER',
    };
    if (code in driverEmailActionCodes) {
      try {
        const emailParams = {
          receiver: driverDetails?.emailId,
          language: driverDetails?.prefferedLanguage,
          templateCode: driverEmailActionCodes[code],
          keyValues: {
            captainName: captainName,
            // TODO: depends upon template
          },
        };
        this.clientNotificationKafka.emit(
          SEND_EMAIL_NOTIFICATION,
          JSON.stringify(emailParams),
        );
      } catch (e) {
        this.logger.error(e.message);
      }
    }

    // ADMIN
    // Email notification for admin
    const adminActionCodes = {
      become_captain: 'BECOME_CAPTAIN_TO_ADMIN',
      subscription_activated: 'SUBSCRIPTION_ACTIVATED_TO_ADMIN',
      subscription_cancelled: 'SUBSCRIPTION_CANCELLED_TO_ADMIN',
    };
    if (code in adminActionCodes) {
      try {
        const adminEmail = await this.redisHandler.getRedisKey(
          'ADMIN_TRANSACTION_NOTIFY_EMAIL',
        );
        const emailParams = {
          receiver: adminEmail,
          templateCode: adminActionCodes[code],
          keyValues: {
            captainName: captainName,
            // TODO: depends upon template
          },
        };
        this.clientNotificationKafka.emit(
          SEND_EMAIL_NOTIFICATION,
          JSON.stringify(emailParams),
        );
      } catch (e) {
        this.logger.error(e.message);
      }
    }
  }

  async emitToAdminDashboardViaSocket(eventType: string, data: any) {
    const emitData = {
      eventType,
      ...data,
    };

    this.logger.log(
      `[emitToAdminDashboardViaSocket] emitData: ${JSON.stringify(emitData)}`,
    );

    this.socketGateway.emit(EMIT_TO_ADMIN_DASHBOARD, JSON.stringify(emitData));
  }

  async notifyAdminDashboardAsTransactionStatusCompletedOfSubscriptionEntity() {
    try {
      this.logger.log(
        '[notifyAdminDashboardAsTransactionStatusCompletedOfSubscriptionEntity] Started',
      );

      const params = { type: 'day', ...{ entity: 'subscription' } };
      const subscriptionEarningsRes =
        await this.transactionService.getDashboardEarnings(params);

      await this.emitToAdminDashboardViaSocket(
        TRANSACTION_STATUS_COMPLETED_OF_SUBSCRIPTION_ENTITY,
        { subscriptionEarnings: subscriptionEarningsRes?.data || {} },
      );

      this.logger.log(
        '[notifyAdminDashboardAsTransactionStatusCompletedOfSubscriptionEntity] Ended',
      );
    } catch (e) {
      this.logger.error(
        '[notifyAdminDashboardAsTransactionStatusCompletedOfSubscriptionEntity]' +
          JSON.stringify(e.message),
      );
    }
  }

  async subscibersFromSubscriptionId(subId: string) {
    try {
      const responseArray: string[] = [];
      const subIdDetails = await this.userSubscriptionRepository
        .createQueryBuilder('')
        .select(['id'])
        .where('subscriptionId = :subId', { subId })
        .getRawMany();
      subIdDetails.map((o) => {
        responseArray.push(o.id);
      });
      this.logger.result(
        'subscribers-Details-From-Subscription-Id',
        responseArray,
      );
      return ResponseData.success(responseArray);
    } catch (err) {
      console.log(err.message);
      this.logger.error(
        'subscribers-Details-From-Subscription-Id',
        err.message,
      );
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }
  async getSusscriptionDetailsbyUserId(userId: string) {
    try {
      const responseArray: Object[] = [];
      const susIdDetails = await this.userSubscriptionRepository
        .createQueryBuilder('')
        .select(['id', 'subscriptionId'])
        .where('userId = :userId', { userId })
        .getRawMany();
      susIdDetails.map((o) => {
        const obj = {
          subscriberId: o.id,
          subscriptionId: o.subscriptionId,
        };
        responseArray.push(obj);
      });
      console.log('---------------------');
      console.log(susIdDetails);
      console.log(responseArray);
      return ResponseData.success(responseArray);
    } catch (err) {
      console.log(err.message);
      // this.customLogger.catchError('dashboardSubcriptionData', err.message);
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }

  async getSusscriptionDetailsbyUserIds(userIds: string[]) {
    try {
      const responseArray: Object[] = [];
      const susIdDetails = await this.userSubscriptionRepository
        .createQueryBuilder('')
        .select(['id as subscriberId', 'subscriptionId', 'userId'])
        .where('userId IN (:...userIds)', { userIds: userIds })
        // .where('userId = :userId', { userId })
        .getRawMany();
      susIdDetails.map((o) => {
        const obj = {
          userIds: o.userId,
          subscriberId: o.id,
          subscriptionId: o.subscriptionId,
        };
        responseArray.push(obj);
      });
      console.log('---------------------');
      console.log(susIdDetails);
      console.log(responseArray);
      return ResponseData.success(responseArray);
    } catch (err) {
      console.log(err.message);
      // this.customLogger.catchError('dashboardSubcriptionData', err.message);
      return ResponseData.error(HttpStatus.BAD_REQUEST);
    }
  }
}

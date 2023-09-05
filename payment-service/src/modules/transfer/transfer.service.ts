import {
  Injectable,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
  HttpService,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Client, ClientProxy, ClientKafka } from '@nestjs/microservices';
import axios from 'axios';

import {
  paymentTCPConfig,
  socketMicroServiceConfig,
} from 'src/microServicesConfigs';

import {
  HoldDto,
  HoldUpdateDto,
  HoldConfirmDto,
  tripMainAccTransfersDto,
  topUpMainAccXferDto,
} from './dto/transfer-amounts.dto';
import { errorMessage } from 'src/constants/error-message-constant';
import appConfig from 'config/appConfig';
import { TransferHandler } from 'src/helpers/TransferHandler';
import { TransactionRepository } from '../transactions/transaction.repository';
import { ENTITY_TYPE, TRANSACTION_STATUS } from '../transactions/enum';
import {
  HoldParams,
  HoldUpdateParams,
  HoldConfirmParams,
  HoldRollbackParams,
} from './interface/transfer-amounts.interface';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';
import { successMessage } from 'src/constants/success-message-constant';
import {
  SubscriptionRequestDTO,
  TransactionForSubscriptionDto,
} from './dto/subscription-transaction.dto';
import { UpdateTransactionDto } from '../transactions/dto/update-transaction.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { In, Repository } from 'typeorm';

import {
  DASHBOARD_GET_EARNINGS,
  EMIT_TO_ADMIN_DASHBOARD,
  GET_IBAN,
} from 'src/constants/kafka-constant';
import { TRANSACTION_STATUS_COMPLETED_OF_TRIP_ENTITY } from 'src/constants/socket-constants';
// import { WalletService } from '../wallet/wallet.service';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletEntity } from './entites/wallet.entity';
import { holdAmountEntity } from './entites/hold-amount.entity';
import { subscriptionsEntity } from './entites/subscriptions.entity';
import {
  ConfirmAmountDto,
  createSubscriptionDto,
  HoldUpdatesDto,
  updateWalletDto,
} from './dto/wallet.dto';
import { Invoice } from '@axenda/zatca';
import { QRGeneratorDto } from './dto/qr-Dto';
import { AlinmaB2BService } from '../alinma-b2-b/alinma-b2-b.service';
import { TRANSACTION_TYPE } from '../click-pay/enums/clickpay.enum';
import { RedisHandler } from 'src/helpers/redis-handler';

@Injectable()
export class TransferService {
  constructor(
    private redisHandler: RedisHandler,
    @InjectRepository(holdAmountEntity)
    private holdAmountRepository: Repository<holdAmountEntity>,
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
    @InjectRepository(subscriptionsEntity)
    private subscriptionsRepository: Repository<subscriptionsEntity>, // private httpService: HttpService
    private readonly transactionRepository: TransactionRepository, // private walletService: WalletService, // private httpService: HttpService
    private alinmaService: AlinmaB2BService,
    @Inject('CLIENT_CAPTAIN_SERVICE_TCP') private clientCaptainTCP: ClientProxy,
  ) {}
  private readonly logger = new LoggerHandler(
    TransferService.name,
  ).getInstance();

  @Client(socketMicroServiceConfig)
  socketGateway: ClientKafka;

  @Client(paymentTCPConfig)
  clientPaymentTCP: ClientProxy;

  @UsePipes(ValidationPipe)
  async blockAmount(data: HoldDto) {
    try {
      this.logger.log(`[blockAmount] data: ${JSON.stringify(data)}`);

      // const apiUrl = `${appConfig().paymentAPIUrl}/tripcreate`;
      // const apiHeaders = TransferHandler.getHeaderParams();
      const apiParams: HoldParams = TransferHandler.prepareInput(data, 'hold');

      // this.logger.log('[blockAmount] Sending data to e-wallet for Hold API:' + apiUrl + ' for trip:' + data.tripId)
      // this.logger.debug('[blockAmount] apiHeaders:' + JSON.stringify(apiHeaders))
      this.logger.debug('[blockAmount] apiParams:' + JSON.stringify(apiParams));

      let transParams: UpdateTransactionDto = {
        entityId: data.tripId,
        entityType: ENTITY_TYPE.TRIP,
        senderId: apiParams.senderId,
        receiverId: apiParams.receiverId,
        transactionAmount: Number(apiParams.amount),
        senderTax: Number(apiParams.senderTax),
        senderFee: Number(apiParams.senderFee),
        receiverTax: Number(apiParams.receiverTax),
        taxAmount: 0,
      };
      const res = await this.holdAmount(apiParams);

      if (res.statusCode == HttpStatus.OK && res?.data?.status == 'CREATE') {
        this.logger.log(
          '[blockAmount] Transaction --hold-- Success Response:' +
            JSON.stringify(res.data),
        );

        transParams = {
          ...transParams,
          transactionId: res.data.id,
          transactionAmount: res.data.fullAmountToDebit,
          senderAmount: res.data.amount,
          receiverAmount: res.data.fullAmountToCredit,
          creditAmount: res.data.fullAmountToCredit,
          debitAmount: res.data.fullAmountToDebit,
          eWalletAPIResponse: JSON.stringify(res.data),
          status: TRANSACTION_STATUS.PENDING,
        };

        const transaction = this.transactionRepository.create(transParams);
        await this.transactionRepository.save(transaction);
        this.logger.log(
          '[blockAmount] Transaction create Success - logged in system',
        );

        return ResponseData.success(res.data);
      } else {
        this.logger.error(
          '[blockAmount] Transaction --hold-- Error Response Message:' +
            res?.message,
        );
        this.logger.error(
          '[blockAmount] Transaction --hold-- Error Response:' + res?.data,
        );

        transParams = {
          ...transParams,
          eWalletAPIResponse: JSON.stringify(res),
          status: TRANSACTION_STATUS.FAILED,
        };

        const transactionFail = this.transactionRepository.create(transParams);
        await this.transactionRepository.save(transactionFail);
        this.logger.error(
          '[blockAmount] Transaction create (update) Error - logged in system',
        );

        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          res?.message || errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    } catch (e) {
      this.logger.error('[blockAmount] Payment Hold Error' + e?.message);
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        e?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateBlockedAmount(data: HoldUpdateDto) {
    try {
      this.logger.log(`[updateBlockedAmount] data: ${JSON.stringify(data)}`);

      const existTransaction = await this.transactionRepository.findOne({
        entityId: data.tripId,
        entityType: ENTITY_TYPE.TRIP,
        status: In([TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.FAILED]),
      });
      if (
        !existTransaction ||
        (existTransaction?.status === TRANSACTION_STATUS.FAILED &&
          !existTransaction?.transactionId)
      ) {
        this.logger.error(
          `[updateBlockedAmount] error: ${errorMessage.TRIP_TRANSACTION.HOLD_TX_NOT_FOUND} | tripId: ${data.tripId}`,
        );
        throw new HttpException(
          errorMessage.TRIP_TRANSACTION.HOLD_TX_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const existParams = {
        senderId: existTransaction.senderId,
        receiverId: existTransaction.receiverId,
        transactionId: existTransaction.transactionId,
      };
      data = { ...data, ...existParams };

      // const apiUrl = `${appConfig().paymentAPIUrl}/tripupdate`;
      // const apiHeaders = TransferHandler.getHeaderParams();
      const apiParams: HoldUpdateParams = TransferHandler.prepareInput(
        data,
        'update',
      );

      // this.logger.log('[updateBlockedAmount] Sending data to e-wallet for Hold Update API:' + apiUrl + ' for trip:' + data.tripId)
      // this.logger.debug('[updateBlockedAmount] apiHeaders:' + JSON.stringify(apiHeaders))
      this.logger.debug(
        '[updateBlockedAmount] apiParams:' + JSON.stringify(apiParams),
      );

      let transParams: UpdateTransactionDto = {
        transactionAmount: Number(apiParams.amount),
        senderTax: Number(apiParams.senderTax),
        receiverTax: Number(apiParams.receiverTax),
        senderFee: Number(apiParams.senderFee),
        receiverFee: Number(apiParams.receiverFee),
        taxAmount: 0,
      };
      const res = await this.holdUpdate(apiParams);

      if (res?.statusCode == HttpStatus.OK) {
        // Transaction entry updates
        transParams = {
          ...transParams,
          transactionAmount: res.data.fullAmountToDebit,
          senderAmount: res.data.amount,
          receiverAmount: res.data.fullAmountToCredit,
          creditAmount: res.data.fullAmountToCredit,
          debitAmount: res.data.fullAmountToDebit,
          eWalletAPIResponse: JSON.stringify(res.data),
          status: TRANSACTION_STATUS.PENDING,
        };

        await this.transactionRepository.update(
          { id: existTransaction.id },
          transParams,
        );
        this.logger.log(
          '[updateBlockedAmount] Transaction update (update) Success - logged in system',
        );

        return ResponseData.success(res.data);
      } else {
        this.logger.error(
          '[updateBlockedAmount] Transaction --hold-update-- Error Response Message:' +
            res?.message,
        );
        this.logger.error(
          '[updateBlockedAmount] Transaction --hold-update-- Error Response:' +
            res?.data,
        );

        const transParams = {
          eWalletAPIResponse: JSON.stringify(res),
          status: TRANSACTION_STATUS.FAILED,
        };

        await this.transactionRepository.update(
          { id: existTransaction.id },
          transParams,
        );
        this.logger.error(
          '[updateBlockedAmount] Transaction update (update) Error - logged in system',
        );

        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          res?.message || errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    } catch (e) {
      this.logger.error(
        '[updateBlockedAmount] Payment Hold Update Error' + e?.message,
      );
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        e?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async confirmBlockedAmount(data: HoldConfirmDto) {
    try {
      this.logger.log(`[confirmBlockedAmount] data: ${JSON.stringify(data)}`);

      // Check if hold amount exists for rollback transaction
      const existTransaction = await this.transactionRepository.findOne({
        entityId: data.tripId,
        entityType: ENTITY_TYPE.TRIP,
        status: In([TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.FAILED]),
      });
      if (
        !existTransaction ||
        (existTransaction?.status === TRANSACTION_STATUS.FAILED &&
          !existTransaction?.transactionId)
      ) {
        this.logger.error(
          `[confirmBlockedAmount] error: ${errorMessage.TRIP_TRANSACTION.HOLD_TX_NOT_FOUND} | tripId: ${data.tripId}`,
        );
        throw new HttpException(
          errorMessage.TRIP_TRANSACTION.HOLD_TX_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const existParams = {
        senderId: existTransaction.senderId,
        receiverId: existTransaction.receiverId,
        transactionId: existTransaction.transactionId,
      };
      data = { ...data, ...existParams };

      // const apiUrl = `${appConfig().paymentAPIUrl}/tripconfirm`;
      // const apiHeaders = TransferHandler.getHeaderParams();
      const apiParams: HoldConfirmParams = TransferHandler.prepareInput(
        data,
        'confirm',
      );

      // this.logger.log('[confirmBlockedAmount] Sending data to e-wallet for Hold Confirm API:' + apiUrl + ' for trip:' + data.tripId)
      // this.logger.debug('[confirmBlockedAmount] apiHeaders:' + JSON.stringify(apiHeaders))
      this.logger.debug(
        '[confirmBlockedAmount] apiParams:' + JSON.stringify(apiParams),
      );

      const res = await this.confirmAmount(apiParams);
      if (res?.statusCode == HttpStatus.OK) {
        this.logger.log(
          '[confirmBlockedAmount] Transaction --hold-confirm-- Success Response:' +
            JSON.stringify(res.data),
        );

       
        // Transaction entry updates
        const transParams : any = {
          bankFee: data?.transferFee,
          creditAmount: existTransaction?.receiverAmount - data?.transferFee,
          eWalletAPIResponse: JSON.stringify(res.data),
          status: TRANSACTION_STATUS.COMPLETED,
        };

        if(data?.discount > 0) {
            this.logger.log(
          '[confirmBlockedAmount] Adding discount amount to user wallet discount :' +
            data.discount + ' Transaction ID: ' + existTransaction.id
        );
            transParams.discount = data.discount;
            transParams.debitAmount = existTransaction.debitAmount - data.discount;
            await this.updateWalletBlance({userId: existTransaction.senderId, balance: data.discount}, true);
        }

        await this.transactionRepository.update(
          { id: existTransaction.id },
          transParams,
        );
        existTransaction.creditAmount =
          existTransaction?.receiverAmount - data?.transferFee;

        this.logger.log(
          '[confirmBlockedAmount] Transaction update (confirm) Success - logged in system',
        );

        // Updates admin dashboard stats as transaction status is updated to completed of entity type trip
        await this.notifyAdminDashboardAsTransactionStatusCompletedOfTripEntity();

        // existTransaction.receiverAmount = data?.transferFee;
        this.tripMainAccTransfers(existTransaction);

        return ResponseData.success(res.data);
      } else {
        this.logger.error(
          '[confirmBlockedAmount] Transaction --hold-confirm-- Error Response Message:' +
            res?.message,
        );
        this.logger.error(
          '[confirmBlockedAmount] Transaction --hold-confirm-- Error Response:' +
            res?.data,
        );

        const transParams = {
          eWalletAPIResponse: JSON.stringify(res),
          status: TRANSACTION_STATUS.FAILED,
        };

        await this.transactionRepository.update(
          { id: existTransaction.id },
          transParams,
        );
        this.logger.error(
          '[confirmBlockedAmount] Transaction update (confirm) Error - logged in system',
        );

        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          res?.message || errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    } catch (e) {
      this.logger.error(
        '[releaseBlockedAmount] Payment Hold Confirm Error' + e?.message,
      );
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        e?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async releaseBlockedAmount(data: HoldConfirmDto) {
    try {
      this.logger.log(`[releaseBlockedAmount] data: ${JSON.stringify(data)}`);

      // Check if hold amount exists for rollback transaction
      const existTransaction = await this.transactionRepository.findOne({
        entityId: data.tripId,
        entityType: ENTITY_TYPE.TRIP,
        status: In([TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.FAILED, TRANSACTION_STATUS.REFUNDED]),
      });

      if(existTransaction.status === TRANSACTION_STATUS.REFUNDED){
         this.logger.error(
          `[releaseBlockedAmount] error: amount already proceed | tripId: ${data.tripId}`,
        );
        return ResponseData.success();
      }
      if (
        !existTransaction ||
        (existTransaction?.status === TRANSACTION_STATUS.FAILED &&
          !existTransaction?.transactionId)
      ) {
        this.logger.error(
          `[releaseBlockedAmount] error: ${errorMessage.TRIP_TRANSACTION.HOLD_TX_NOT_FOUND} | tripId: ${data.tripId}`,
        );
        throw new HttpException(
          errorMessage.TRIP_TRANSACTION.HOLD_TX_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const existParams = {
        senderId: existTransaction.senderId,
        receiverId: existTransaction.receiverId,
        transactionId: existTransaction.transactionId,
      };
      data = { ...data, ...existParams };

      const apiUrl = `${appConfig().paymentAPIUrl}/triprollback`;
      const apiHeaders = TransferHandler.getHeaderParams();
      const apiParams: HoldRollbackParams = TransferHandler.prepareInput(
        data,
        'rollback',
      );

      this.logger.log(
        '[releaseBlockedAmount] Sending data to e-wallet for Hold Rollback API:' +
          apiUrl +
          ' for trip:' +
          data.tripId,
      );
      this.logger.debug(
        '[releaseBlockedAmount] apiHeaders:' + JSON.stringify(apiHeaders),
      );
      this.logger.debug(
        '[releaseBlockedAmount] apiParams:' + JSON.stringify(apiParams),
      );

      const res = await this.rollBackAmount(apiParams);
      if (res?.statusCode == HttpStatus.OK) {
        this.logger.log(
          '[releaseBlockedAmount] Transaction --hold-rollback-- Success Response:' +
            JSON.stringify(res.data),
        );

        // Transaction entry updates
        const transParams = {
          eWalletAPIResponse: JSON.stringify(res.data),
          status: TRANSACTION_STATUS.CANCELLED,
        };

        await this.transactionRepository.update(
          { id: existTransaction.id },
          transParams,
        );
        this.logger.log(
          '[releaseBlockedAmount] Transaction update (rollback) Success - logged in system',
        );

        return ResponseData.success(res.data);
      } else {
        this.logger.error(
          '[releaseBlockedAmount] Transaction --hold-rollback-- Error Response Message:' +
            res?.message,
        );
        this.logger.error(
          '[releaseBlockedAmount] Transaction --hold-rollback-- Error Response:' +
            res?.data,
        );

        const transParams = {
          eWalletAPIResponse: JSON.stringify(res),
          status: TRANSACTION_STATUS.FAILED,
        };

        await this.transactionRepository.update(
          { id: existTransaction.id },
          transParams,
        );
        this.logger.error(
          '[releaseBlockedAmount] Transaction update (rollback) Error - logged in system',
        );

        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          res?.message || errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    } catch (e) {
      this.logger.error(
        '[releaseBlockedAmount] Payment Hold Rollback Error' + e?.message,
      );
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        e?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // Subscription e-wallet APIs
  async getSubscriptionTransactions(customerId: string) {
    try {
      // const apiUrl = `${
      //   appConfig().subscriptionAPIUrl
      // }/subscriptionrenewal/transactions`;
      this.logger.log('Fetching data of subscription transactions');

      const apiHeaders =
        TransferHandler.getSubscriptionHeaderParams(customerId);

      // this.logger.log(apiUrl, 'subscriptionrenewal/transactions')
      this.logger.debug('apiHeaders:' + JSON.stringify(apiHeaders));

      // const apiResponse = await axios.get(apiUrl, { headers: apiHeaders });
      // const apiResponse = this.httpService.get(apiUrl, { headers: apiHeaders });
      const apiResponse = await this.getSubscriptionTransactionslist(
        customerId,
      );
      if (apiResponse.statusCode === HttpStatus.OK) {
        this.logger.debug('Got response:' + JSON.stringify(apiResponse.data));

        if (!apiResponse.data.length) {
          this.logger.error(
            'No transaction available for user customerId:' + customerId,
          );
          throw new Error(errorMessage.SUBSCRIPTION_TRANSACTION_NOT_FOUND);
        }

        const todayDate = new Date().toLocaleDateString();

        this.logger.debug(
          'Checking for today transactions in the response i.e ' + todayDate,
        );
        const isTransactionAvailable = apiResponse.data.find(
          (transaction: TransactionForSubscriptionDto) => {
            const transactionDate = new Date(
              transaction.creationDate,
            ).toLocaleDateString();

            return transactionDate === todayDate;
          },
        );

        this.logger.debug(isTransactionAvailable, 'isTransactionAvailable');

        if (!isTransactionAvailable) {
          this.logger.error('No transaction found for today');
          throw new Error(errorMessage.SUBSCRIPTION_TRANSACTION_NOT_FOUND);
        }
        this.logger.log('Got valid Transaction from ewallet');
        isTransactionAvailable.txnId = isTransactionAvailable.id;
        return ResponseData.success(
          isTransactionAvailable,
          successMessage.SUBSCRIPTION_TRANSACTION_VALIDATED,
        );
      } else {
        this.logger.error('Got failure from ewallet');
        throw new Error(errorMessage.SOMETHING_WENT_WRONG);
      }
    } catch (e) {
      this.logger.error('getSubscriptionTransactions error', e.message, e);
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        e.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async addSubscriptionTransaction(payload: SubscriptionRequestDTO) {
    try {
      this.logger.log(
        '[addSubscriptionTransaction] Sending transaction details to e-wallet',
      );
      //
      // const apiUrl = `${appConfig().subscriptionAPIUrl}/subscriptionrenewal`;
      // const apiHeaders = TransferHandler.getSubscriptionHeaderParams();

      // this.logger.log('[addSubscriptionTransaction] apiUrl:' + apiUrl);
      this.logger.log(
        '[addSubscriptionTransaction] apiHeaders:' + JSON.stringify(payload),
      );
      //
      const res = await this.createSubscriptionsTransaction(payload);
      if (res?.statusCode == HttpStatus.OK) {
        this.logger.log(
          '[addSubscriptionTransaction] Transaction recorded add to e-wallet Success: ' +
            JSON.stringify(res.data),
        );

        return ResponseData.success(
          { txnId: res.data?.id },
          successMessage.SUBSCRIPTION_TRANSACTION_CREATED,
        );
      } else {
        this.logger.error(
          '[addSubscriptionTransaction] Transaction recorded add to e-wallet Error: ' +
            JSON.stringify(res),
        );
        throw new Error(res?.message || errorMessage.SOMETHING_WENT_WRONG);
      }
    } catch (e) {
      this.logger.error(
        '[addSubscriptionTransaction] Error in catch ' + e.message,
      );
      return ResponseData.error(
        HttpStatus.NOT_FOUND,
        e.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
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

  // Updates admin dashboard stats as transaction status is updated to completed of entity type trip
  async notifyAdminDashboardAsTransactionStatusCompletedOfTripEntity() {
    try {
      this.logger.log(
        '[notifyAdminDashboardAsTransactionStatusCompletedOfTripEntity] Started',
      );

      const params = { type: 'day', ...{ entity: 'driver' } };
      const driverEarningsRes = await this.clientPaymentTCP
        .send(DASHBOARD_GET_EARNINGS, JSON.stringify(params))
        .pipe()
        .toPromise();

      await this.emitToAdminDashboardViaSocket(
        TRANSACTION_STATUS_COMPLETED_OF_TRIP_ENTITY,
        { driverEarnings: driverEarningsRes?.data || {} },
      );

      this.logger.log(
        '[notifyAdminDashboardAsTransactionStatusCompletedOfTripEntity] Ended',
      );
    } catch (e) {
      this.logger.error(
        '[notifyAdminDashboardAsTransactionStatusCompletedOfTripEntity]' +
          JSON.stringify(e.message),
      );
    }
  }

  async getBalance(customerId: string) {
    try {
      this.logger.log('[getBalance] customerId:' + customerId);
      const wallet = await this.findOne(customerId);
      this.logger.log('[getBalance] wallet response:' + JSON.stringify(wallet));
      return wallet;
    } catch (err) {
      this.logger.error(
        '[getBalance] getBalance Error Response Message: ' +
          err?.response?.data?.message,
      );
      this.logger.error('[getBalance] getBalance ' + err?.response);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async addBalance(params: updateWalletDto) {
    try {
      this.logger.log('[addBalance] customerId:' + JSON.stringify(params));
      const wallet = await this.updateWalletBlance(params, false);
      this.logger.log('[addBalance] wallet response:' + JSON.stringify(wallet));
      return await this.getBalance(params.userId);
    } catch (err) {
      this.logger.error(
        '[addBalance] getBalance Error Response Message: ' +
          err?.response?.data?.message,
      );
      this.logger.error('[addBalance] getBalance ' + err?.response);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // ===============wallet ========= //

  async holdAmount(params: HoldParams) {
    try {
      const {
        senderId,
        receiverId,
        amount,
        senderFee,
        senderTax,
        receiverFee,
        receiverTax,
        motFee,
      } = params;

      this.logger.log(`[holdAmount] start`);

      const fullAmountToDebit = (
        Number(amount) +
        Number(senderFee) +
        Number(senderTax) +
        Number(motFee)
      ).toFixed(2);
      const fullAmountToCredit = (
        Number(amount) -
        (Number(receiverFee) + Number(receiverTax))
      ).toFixed(2);

      this.logger.log(
        `[holdAmount] senderAmount: ${fullAmountToDebit} and receiverAmount: ${fullAmountToCredit}`,
      );

      const senderWallet = await this.findOne(senderId);
      const receiverWallet = await this.findOne(receiverId);

      if (
        senderWallet?.data &&
        receiverWallet?.data &&
        fullAmountToDebit <= senderWallet?.data?.balance
      ) {
        this.logger.log(`[holdAmount] sender and receiver wallet found`);
        this.logger.log(
          `[holdAmount] sender Balance: ${senderWallet?.data?.balance}`,
        );
        const updateWalletParams = {
          userId: senderId,
          balance: -fullAmountToDebit,
        };

        const updateSenderWallet = await this.updateWalletBlance(
          updateWalletParams,
          false,
        );
        if (updateSenderWallet?.statusCode != HttpStatus.OK)
          return updateSenderWallet;

        const holdParams: any = {
          ...params,
          fullAmountToCredit,
          fullAmountToDebit,
          status: 'CREATE',
        };
        this.logger.log(
          `[holdAmount] holdParams: ${JSON.stringify(holdParams)}`,
        );

        const AmountHold = await this.holdAmountRepository.create(holdParams);
        return ResponseData.success(
          await this.holdAmountRepository.save(AmountHold),
        );
      } else if (!senderWallet?.data) {
        // this.logger.error(`[holdAmount] senderWallet response: ${senderWallet}`)
        this.logger.error(
          `[holdAmount] error: ${errorMessage.SENDER_WALLET_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SENDER_WALLET_NOT_FOUND,
        );
      } else if (!receiverWallet?.data) {
        this.logger.error(
          `[holdAmount] error: ${errorMessage.RECEIVER_WALLET_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.RECEIVER_WALLET_NOT_FOUND,
        );
      } else if (fullAmountToDebit > senderWallet?.data?.balance) {
        this.logger.error(
          `[holdAmount] error: ${errorMessage.RIDER_HAVE_NOT_ENOUGH_BALANCE}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.RIDER_HAVE_NOT_ENOUGH_BALANCE,
        );
      }
    } catch (err) {
      this.logger.error(`[holdAmount] catch error: ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async holdUpdate(params: HoldUpdatesDto) {
    try {
      this.logger.log(`[holdUpdate] start`);
      const {
        senderId,
        receiverId,
        amount,
        senderFee,
        senderTax,
        receiverFee,
        receiverTax,
        holderId,
      } = params;
      const holdAmountRow = await this.findOneHoldAmount(holderId);

      if (!holdAmountRow?.data?.status) {
        this.logger.error(
          `[rollBackAmount] error: ${errorMessage.HOLD_AMOUNT_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.HOLD_AMOUNT_NOT_FOUND,
        );
      } else if (holdAmountRow?.data?.status != 'CREATE') {
        this.logger.error(
          `[rollBackAmount] error: ${errorMessage.HOLD_AMOUNT_ALREADY_PROCEED}, hold status: ${holdAmountRow?.data?.status}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          `${errorMessage.HOLD_AMOUNT_ALREADY_PROCEED}, status: ${holdAmountRow?.data?.status}`,
        );
      }

      const fullAmountToDebit = (
        Number(amount) +
        Number(senderFee) +
        Number(senderTax) +
        Number(holdAmountRow?.data?.motFee)
      ).toFixed(2);
      const fullAmountToCredit = (
        Number(amount) -
        (Number(receiverFee) + Number(receiverTax))
      ).toFixed(2);

      const blanceChange =
        holdAmountRow?.data?.fullAmountToDebit - Number(fullAmountToDebit);

      this.logger.log(
        `[holdUpdate] senderAmount: ${fullAmountToDebit} and receiverAmount: ${fullAmountToCredit}`,
      );

      const senderWallet = await this.findOne(senderId);
      const receiverWallet = await this.findOne(receiverId);

      if (
        senderWallet?.data &&
        receiverWallet?.data &&
        holdAmountRow?.data?.senderId == senderId &&
        holdAmountRow?.data?.receiverId == receiverId 
      ) {
        this.logger.log(`[holdUpdate] sender and receiver wallet found`);

        this.logger.log(
          `[holdUpdate] sender Balance: ${senderWallet?.data?.balance}`,
        );
        const updateWalletParams = {
          userId: senderId,
          balance: blanceChange,
        };

        const updateSenderWallet = await this.updateWalletBlance(
          updateWalletParams,
          true,
        );
        if (updateSenderWallet?.statusCode != HttpStatus.OK)
          return updateSenderWallet;

        const holdParams: any = {
          senderId,
          receiverId,
          amount,
          senderFee,
          senderTax,
          receiverFee,
          receiverTax,
          fullAmountToCredit,
          fullAmountToDebit,
        };
        this.logger.log(
          `[holdUpdate] holdParams: ${JSON.stringify(holdParams)}`,
        );

        const AmountHold = await this.holdAmountRepository.update(
          { id: holderId },
          holdParams,
        );
        if (AmountHold)
          return ResponseData.success({
            ...holdParams,
          });
      } else if (!senderWallet?.data) {
        // this.logger.error(`[holdAmount] senderWallet response: ${senderWallet}`)
        this.logger.error(
          `[holdAmount] error: ${errorMessage.SENDER_WALLET_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SENDER_WALLET_NOT_FOUND,
        );
      } else if (!receiverWallet?.data) {
        this.logger.error(
          `[holdAmount] error: ${errorMessage.RECEIVER_WALLET_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.RECEIVER_WALLET_NOT_FOUND,
        );
      } else if (blanceChange > senderWallet?.data?.balance) {
        this.logger.error(
          `[holdAmount] error: ${errorMessage.RIDER_HAVE_NOT_ENOUGH_BALANCE}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.RIDER_HAVE_NOT_ENOUGH_BALANCE,
        );
      } else if (
        holdAmountRow?.data?.senderId != senderId ||
        holdAmountRow?.data?.receiverId != receiverId
      ) {
        this.logger.error(
          `[holdUpdate] error: ${errorMessage.INVALID_REQUEST}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.INVALID_REQUEST,
        );
      }
    } catch (err) {
      this.logger.error(`[holdUpdate] catch error: ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async confirmAmount(params: ConfirmAmountDto) {
    try {
      this.logger.log(`[confirmAmount] start`);
      const { senderId, receiverId, holderId } = params;

      const holdAmountRow = await this.findOneHoldAmount(holderId);
      if (holdAmountRow?.statusCode != HttpStatus.OK) {
        this.logger.error(
          `[rollBackAmount] error: ${errorMessage.HOLD_AMOUNT_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.HOLD_AMOUNT_NOT_FOUND,
        );
      } else if (holdAmountRow?.data?.status != 'CREATE') {
        this.logger.error(
          `[rollBackAmount] error: ${errorMessage.HOLD_AMOUNT_ALREADY_PROCEED}, hold status: ${holdAmountRow?.data?.status}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          `${errorMessage.HOLD_AMOUNT_ALREADY_PROCEED}, status: ${holdAmountRow?.data?.status}`,
        );
      }

      const senderWallet = await this.findOne(senderId);
      const receiverWallet = await this.findOne(receiverId);

      if (
        senderWallet?.data &&
        receiverWallet?.data &&
        holdAmountRow?.data?.senderId == senderId &&
        holdAmountRow?.data?.receiverId == receiverId
      ) {
        this.logger.log(`[confirmAmount] sender and receiver wallet found`);

        //TODO LATER PAYMENT
        // const updateWalletParams = {
        //   userId: receiverId,
        //   balance: holdAmountRow?.data?.fullAmountToCredit,
        // };

        // const updateReceiverWallet = await this.updateWalletBlance(
        //   updateWalletParams,
        // );
        // if (updateReceiverWallet?.statusCode != HttpStatus.OK)
        //   return updateReceiverWallet;
        this.logger.log(`[confirmAmount] receiver wallet blanace updated`);

        const holdParams: any = {
          status: 'CONFIRM',
        };

        this.logger.log(
          `[confirmAmount] holdParams: ${JSON.stringify(holdParams)}`,
        );

        const AmountHold = await this.holdAmountRepository.update(
          { id: holderId },
          holdParams,
        );
        if (AmountHold) return await this.findOneHoldAmount(holderId);
      } else if (!senderWallet?.data) {
        // this.logger.error(`[holdAmount] senderWallet response: ${senderWallet}`)
        this.logger.error(
          `[holdAmount] error: ${errorMessage.SENDER_WALLET_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SENDER_WALLET_NOT_FOUND,
        );
      } else if (!receiverWallet?.data) {
        this.logger.error(
          `[holdAmount] error: ${errorMessage.RECEIVER_WALLET_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.RECEIVER_WALLET_NOT_FOUND,
        );
      } else if (
        holdAmountRow?.data?.senderId != senderId ||
        holdAmountRow?.data?.receiverId != receiverId
      ) {
        this.logger.error(
          `[confirmAmount] error: ${errorMessage.INVALID_REQUEST}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.INVALID_REQUEST,
        );
      }
    } catch (err) {
      this.logger.error(`[confirmAmount] catch error: ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async rollBackAmount(params: ConfirmAmountDto) {
    try {
      this.logger.log(`[rollBackAmount] start`);
      const { senderId, receiverId, holderId } = params;

      const holdAmountRow = await this.findOneHoldAmount(holderId);
      if (!holdAmountRow?.data?.status) {
        this.logger.error(
          `[rollBackAmount] error: ${errorMessage.HOLD_AMOUNT_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.HOLD_AMOUNT_NOT_FOUND,
        );
      } else if (holdAmountRow?.data?.status != 'CREATE') {
        this.logger.error(
          `[rollBackAmount] error: ${errorMessage.HOLD_AMOUNT_ALREADY_PROCEED}, hold status: ${holdAmountRow?.data?.status}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          `${errorMessage.HOLD_AMOUNT_ALREADY_PROCEED}, status: ${holdAmountRow?.data?.status}`,
        );
      }

      const senderWallet = await this.findOne(senderId);
      const receiverWallet = await this.findOne(receiverId);

      if (
        senderWallet?.data &&
        receiverWallet?.data &&
        holdAmountRow?.data?.senderId == senderId &&
        holdAmountRow?.data?.receiverId == receiverId
      ) {
        this.logger.log(`[rollBackAmount] sender and receiver wallet found`);

        const updateWalletParams = {
          userId: senderId,
          balance: holdAmountRow?.data?.fullAmountToDebit,
        };

        const updateSenderWallet = await this.updateWalletBlance(
          updateWalletParams,
          false,
        );
        if (updateSenderWallet?.statusCode != HttpStatus.OK)
          return updateSenderWallet;
        this.logger.log(`[rollBackAmount] sender wallet blanace updated`);

        const holdParams: any = {
          status: 'ROLLBACK',
        };

        this.logger.log(
          `[rollBackAmount] holdParams: ${JSON.stringify(holdParams)}`,
        );

        const AmountHold = await this.holdAmountRepository.update(
          { id: holderId },
          holdParams,
        );
        if (AmountHold) return await this.findOneHoldAmount(holderId);
      } else if (!senderWallet?.data) {
        // this.logger.error(`[holdAmount] senderWallet response: ${senderWallet}`)
        this.logger.error(
          `[holdAmount] error: ${errorMessage.SENDER_WALLET_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SENDER_WALLET_NOT_FOUND,
        );
      } else if (!receiverWallet?.data) {
        this.logger.error(
          `[holdAmount] error: ${errorMessage.RECEIVER_WALLET_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.RECEIVER_WALLET_NOT_FOUND,
        );
      } else if (
        holdAmountRow?.data?.senderId != senderId ||
        holdAmountRow?.data?.receiverId != receiverId
      ) {
        this.logger.error(
          `[rollBackAmount] error: ${errorMessage.INVALID_REQUEST}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.INVALID_REQUEST,
        );
      }
    } catch (err) {
      this.logger.error(`[rollBackAmount] catch error: ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findOne(userId: string) {
    try {
      this.logger.log(`[findOne] userId: ${userId}`);

      const userWallet = await this.walletRepository.findOne({
        userId: userId,
      });
      if (!userWallet) {
        const createUserthis = await this.createWallet(userId);
        if (createUserthis.statusCode == HttpStatus.OK) return createUserthis;
        this.logger.error(`[findOne] response: ${JSON.stringify(userWallet)}`);
        this.logger.error(`[findOne] error: ${errorMessage.WALLET_NOT_FOUND}`);
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.WALLET_NOT_FOUND,
        );
      } else return ResponseData.success(userWallet);
    } catch (err) {
      this.logger.error(`[findOne] catch error: ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createWallet(userId: string) {
    try {
      this.logger.log(`[createWallet] userId: ${userId}`);
      const newWalletParams: any = {
        userId: userId,
        balance: 0,
      };
      const newWallet = await this.walletRepository.create(newWalletParams);
      return ResponseData.success(await this.walletRepository.save(newWallet));
    } catch (err) {
      this.logger.error(`[createWallet] catch error: ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getSubscriptionTransactionslist(customerId: string) {
    try {
      this.logger.log(
        `[getSubscriptionTransactions] customerId: ${JSON.stringify(
          customerId,
        )}`,
      );
      const subscriptions = await this.subscriptionsRepository
        .createQueryBuilder('subscriptions_transactions')
        .where('subscriptions_transactions.userId = :userId', {
          userId: customerId,
        })
        .getMany();
      // const subscriptions = await this.subscriptionsRepository.findOne({
      //   userId: customerId,
      // });
      if (!subscriptions) {
        this.logger.error(
          `[getSubscriptionTransactions] error: ${errorMessage.NO_SUBSCRIPTION_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.NO_SUBSCRIPTION_FOUND,
        );
      } else return ResponseData.success(subscriptions);
    } catch (err) {
      this.logger.error(
        `[getSubscriptionTransactions] catch error: ${err.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async findOneHoldAmount(holderId: string) {
    try {
      this.logger.log(`[findOneHoldAmount] data: ${holderId}`);

      const userHoldAmount = await this.holdAmountRepository.findOne({
        id: holderId,
      });
      if (!userHoldAmount) {
        this.logger.error(
          `[findOneHoldAmount] error: ${errorMessage.HOLD_AMOUNT_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.HOLD_AMOUNT_NOT_FOUND,
        );
      } else return ResponseData.success(userHoldAmount);
    } catch (err) {
      this.logger.error(`[findOneHoldAmount] catch error: ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

   async updateWalletBlance(params: updateWalletDto, isTripEnd = false) {
    try {
      this.logger.log(
        `[updateWalletBlance] params: ${JSON.stringify(params)} `,
      );
      //TODO: WALLET CHANGE HISTORY
      const wallet = await this.findOne(params.userId);
      if (wallet?.statusCode == HttpStatus.OK) {
        const newBlance = wallet?.data?.balance + params.balance;
        if (newBlance < 0) {
          if (isTripEnd) {
            this.logger.log(
              `[updateWalletBlance] error: Rider have insufficient to update hold amount wallet amount: ${newBlance}`,
            );
          } else {
            this.logger.error(
              `[updateWalletBlance] error: ${errorMessage.NOT_ENOUGH_BALANCE}`,
            );
            return ResponseData.error(
              HttpStatus.NOT_FOUND,
              errorMessage.NOT_ENOUGH_BALANCE,
            );
          }
        }

        const updateWallet = await this.walletRepository.update(
          { userId: params.userId },
          { balance: newBlance },
        );
        if (!updateWallet) {
          this.logger.error(
            `[updateWalletBlance] error: ${errorMessage.WALLET_COULD_NOT_UPDATE}`,
          );
          return ResponseData.error(
            HttpStatus.NOT_FOUND,
            errorMessage.WALLET_COULD_NOT_UPDATE,
          );
        } else return ResponseData.success(updateWallet);
      } else return wallet;
    } catch (err) {
      this.logger.error(`[updateWalletBlance] catch error: ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }


  async createSubscriptionsTransaction(params: createSubscriptionDto) {
    try {
      this.logger.log(
        `[createSubscriptionsTransaction] -> start params: ${JSON.stringify(
          params,
        )}`,
      );
      const { customerId, amount, fee, tax } = params;

      const fullAmountToDebit = amount + fee + tax;
      this.logger.log(
        `[createSubscriptionsTransaction] -> fullAmountToDebit: ${fullAmountToDebit}`,
      );
      const customerWallet = await this.findOne(customerId);
      if (
        customerWallet?.statusCode == HttpStatus.OK &&
        customerWallet?.data?.balance >= fullAmountToDebit
      ) {
        const updateWalletParams = {
          userId: customerId,
          balance: -fullAmountToDebit,
        };

        const updateSenderWallet = await this.updateWalletBlance(
          updateWalletParams,
          false,
        );
        if (updateSenderWallet?.statusCode != HttpStatus.OK)
          return updateSenderWallet;

        const createSubscriptionParams = {
          userId: customerId,
          taxAmount: tax,
          fee: fee,
          amount: amount,
          status: 'COMPLETED',
        };

        this.logger.log(
          `[createSubscriptionsTransaction] createSubscriptionParams: ${JSON.stringify(
            createSubscriptionParams,
          )}`,
        );

        const subscriptions = await this.subscriptionsRepository.create(
          createSubscriptionParams,
        );
        return ResponseData.success(
          await this.subscriptionsRepository.save(subscriptions),
        );
      } else if (!customerWallet?.data) {
        this.logger.error(
          `[createSubscriptionsTransaction] error: ${errorMessage.SENDER_WALLET_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SENDER_WALLET_NOT_FOUND,
        );
      } else if (fullAmountToDebit > customerWallet?.data?.balance) {
        this.logger.error(
          `[createSubscriptionsTransaction] error: ${errorMessage.NOT_ENOUGH_BALANCE}`,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.NOT_ENOUGH_BALANCE,
        );
      }
    } catch (err) {
      this.logger.error(
        `[createSubscriptionsTransaction] catch error: ${err.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async topupMainAccTransfer(params: topUpMainAccXferDto) {
    try {
      this.logger.log(
        `[topMainAccTransfer]  params -> ${JSON.stringify(params)}`,
      );
      // const taxPercentage: number = await this.getTaxPercentage();
      // const bankFeePercentage =
      //   (params.amount / 100) * Number(await this.getBankFeePercentage());
      // const bankFee = Number(await this.getBankFeeFixAmount());

      // this.logger.log(
      //   `[topMainAccTransfer]  taxPercentage -> ${taxPercentage})}`,
      // );
      // this.logger.log(
      //   `[topMainAccTransfer]  bankFeePercentage -> ${bankFeePercentage})}`,
      // );
      // this.logger.log(`[topMainAccTransfer]  bankFee -> ${bankFee})}`);

      // params.amount -= bankFeePercentage + bankFee;

      // this.logger.log(
      //   `[ topMainAccTransfer]  amount after fee cut -> ${params.amount})}`,
      // );

      // let tax;
      // tax = (params.amount / 100) * taxPercentage;

      // this.logger.log(`[topMainAccTransfer]  tax amount -> ${tax})}`);

      // params.amount -= tax;

      // this.logger.log(
      //   `[topMainAccTransfer]  amount after tax -> ${params.amount})}`,
      // );
      let tax: any = params.tax;
      if (tax) {
        tax = TransferHandler.prepareMainAccInput(
          {
            amount: tax,
            id: params.id,
          },
          'tax',
          `${params.type}`,
        );
        this.alinmaService.fundXfer(tax);
      }

      if (params?.type == TRANSACTION_TYPE.TOP_UP) {
        const topup = TransferHandler.prepareMainAccInput(params, 'topup', '');
        this.alinmaService.fundXfer(topup);
      } else if (params?.type == TRANSACTION_TYPE.SUBSCRIPTION) {
        const subscription = TransferHandler.prepareMainAccInput(
          params,
          'subscription',
          '',
        );
        this.alinmaService.fundXfer(subscription);
      }
    } catch (err) {
      this.logger.error(`[topMainAccTransfer]  catch -> ${err?.message}`);
    }
  }
  async tripMainAccTransfers(params: tripMainAccTransfersDto) {
    try {
      this.logger.log(
        `[tripMainAccTransfers]  params -> ${JSON.stringify(params)}`,
      );
      // const ibanInfo = this.clientCaptainTCP();
      const ibanInfo = await this.clientCaptainTCP
        .send(
          GET_IBAN,
          JSON.stringify({ param: { externalId: params.receiverId } }),
        )
        .pipe()
        .toPromise();
      if (params?.receiverAmount) {
        const totalAmount = TransferHandler.prepareMainAccInput(
          {
            amount: params.receiverAmount + params?.receiverFee,
            id: params?.id,
          },
          'proxy',
          'trip',
        );
        await this.alinmaService.fundXfer(totalAmount);

        // let fee: any = params?.receiverFee; //: any = Number(await this.getTripWaslFee());
        if (params?.receiverFee) {
          const fee = TransferHandler.prepareMainAccInput(
            {
              amount:
                params?.receiverFee + Number(await this.ibanTransferFee()),
              id: params.id,
            },
            'fee',
            'trip',
          );
          await this.alinmaService.fundXfer(fee);
        }

        const earning = TransferHandler.prepareMainAccInput(
          {
            amount: params.creditAmount,
            id: params.id,
            ...ibanInfo?.data,
          },
          'earning',
          'trip',
        );
        await this.alinmaService.fundXfer(earning);
      }
      // let tax: any =
      //   (Number(params?.senderTax) || 0) + (Number(params?.receiverTax) || 0);
      // if (tax) {
      //   tax = TransferHandler.prepareMainAccInput(
      //     {
      //       amount: tax,
      //       id: params.id,
      //     },
      //     'tax',
      //     'trip',
      //   );
      //   this.alinmaService.fundXfer(tax);
      // }
    } catch (err) {
      this.logger.error(`[tripMainAccTransfers]  catch -> ${err?.message}`);
    }
  }
  async generateBase64QRcode(body: QRGeneratorDto) {
    try {
      // console.log(body);
      const invoice = new Invoice({
        sellerName: body?.seller || appConfig().sellerName,
        vatRegistrationNumber: body?.vatNo || appConfig().vatRegistrationNo,
        invoiceTimestamp:
          body?.dateTime || this.getCurrentDateTimeInQRCodeFormat(),
        invoiceTotal: body.invoiceTotal,
        invoiceVatTotal: body.vatTotal,
      });
      // console.log('-------------------------------------');
      // console.log(invoice);

      let base64QRcode = await invoice.toBase64();
      return ResponseData.success({ QR: base64QRcode });
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  getCurrentDateTimeInQRCodeFormat() {
    try {
      function padTo2Digits(num: number) {
        return num.toString().padStart(2, '0');
      }

      function formatDate(date: any) {
        return (
          [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
          ].join('-') +
          'T' +
          [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
          ].join(':') +
          'Z'
        );
      }

      let timestamp = new Date().getTime();

      // 👇️ 01/20/2022 10:07:59 (mm/dd/yyyy hh:mm:ss)
      return formatDate(new Date(timestamp));
    } catch (err) {
      throw new Error(errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getTaxPercentage() {
    return (
      (await this.redisHandler.getRedisKey('SETTING_TRIP_TAX_PERCENTAGE')) || 15
    );
  }

  async getBankFeePercentage() {
    return (
      Number(await this.redisHandler.getRedisKey('BANK_FEE_PERCENTAGE')) || 1.75
    );
  }
  async getBankFeeFixAmount() {
    return (
      Number(await this.redisHandler.getRedisKey('BANK_FEE_FIX_AMOUNT')) || 1
    );
  }

  async getMasterCardFee() {
    return (
      Number(await this.redisHandler.getRedisKey('SETTING_MASTER_CARD_FEE')) ||
      1.75
    );
  }

  async getVisaCardFee() {
    return (
      Number(await this.redisHandler.getRedisKey('SETTING_VISA_CARD_FEE')) ||
      1.75
    );
  }

  async getTripWaslFee() {
    return (
      Number(await this.redisHandler.getRedisKey('SETTING_TRIP_WASL_FEE')) ||
      0.2
    );
  }

  async ibanTransferFee() {
    return (
      Number(await this.redisHandler.getRedisKey('IBAN_TRANSFER_FEE')) || 0.3
    );
  }
}

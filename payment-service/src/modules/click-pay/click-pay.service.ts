import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import appConfig from 'config/appConfig';
import e from 'express';
import { errorMessage } from 'src/constants/error-message-constant';
import { ADD_USER_SUBSCRIPTION } from 'src/constants/kafka-constant';
import { getAmountFormatted } from 'src/helpers/amount-formatter';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import {
  ENTITY_TYPE,
  TRANSACTION_SOURCE,
  TRANSACTION_STATUS,
} from '../transactions/enum';
import { TransactionService } from '../transactions/transaction.service';
import { TransferService } from '../transfer/transfer.service';
import {
  ClickPayCallBackResponseDto,
  CreateClickPayDto,
} from './dto/click-pay.dto';
import { UpdateClickPayDto } from './dto/update-click-pay.dto';
import { ClickpayEntity } from './entities/click-pay.entity';
import {
  ClickPayStatus,
  PAYMENT_METHOD,
  TRANSACTION_TYPE,
} from './enums/clickpay.enum';
@Injectable()
export class ClickPayService {
  constructor(
    private transactionService: TransactionService,
    private transferService: TransferService,
    @InjectRepository(ClickpayEntity)
    private ClickpayRepository: Repository<ClickpayEntity>,
    @Inject('CLIENT_CAPTAIN_SERVICE_TCP') private clientCaptainTCP: ClientProxy,
  ) {}

  private readonly logger = new LoggerHandler(
    ClickPayService.name,
  ).getInstance();

  async createHostedPaymentRequest(params: CreateClickPayDto) {
    try {
      if (params?.amount < 3) {
        return ResponseData.error(
          HttpStatus.BAD_GATEWAY,
          errorMessage.MINIMUM_TOP,
        );
      }

      const taxPercentage: number =
        await this.transferService.getTaxPercentage();

      const bankFeePercentage = getAmountFormatted(
        (params.amount / 100) *
          Number(await this.transferService.getBankFeePercentage()),
      );
      const bankFee = getAmountFormatted(
        Number(await this.transferService.getBankFeeFixAmount()),
      );
      this.logger.log(
        `[createHostedPaymentRequest]  taxPercentage -> ${taxPercentage})}`,
      );

      this.logger.log(
        `[createHostedPaymentRequest]  taxPercentage -> ${taxPercentage})}`,
      );
      const tax = getAmountFormatted(
        ((params.amount - (bankFeePercentage + bankFee)) / 100) * taxPercentage,
      );

      this.logger.log(`[createHostedPaymentRequest] start`);
      const cart_amount = getAmountFormatted(
        params.amount - (params?.promoCodeAmount || 0),
      );
      const creditAmount = getAmountFormatted(
        params.amount -
          (bankFeePercentage + bankFee + tax + (params?.promoCodeAmount || 0)),
      );
      const clickPayDbParams: any = {
        userId: params.userId,
        cart_amount: cart_amount, // params.amount - (params?.promoCodeAmount || 0),
        creditAmount: creditAmount,
        fee: bankFee,
        tax: tax,
        type: params?.type,
        promoCode: params?.promoCode,
        promoCodeAmount: params?.promoCodeAmount,
        paymentMethod: params?.applePayToken
          ? PAYMENT_METHOD.APPLEPAY
          : PAYMENT_METHOD.CLICKPAY_HOSTED_PAGE,
      };
      const clickPayDbEntry = this.ClickpayRepository.create(clickPayDbParams);
      const clickPayEntry: any = await this.ClickpayRepository.save(
        clickPayDbEntry,
      );
      this.logger.log(`[createHostedPaymentRequest]  response saved`);
      if (clickPayEntry?.id) {
        const clickPayRequest: any = {
          profile_id: parseInt(appConfig().clickPayPorfileId),
          cart_id: clickPayEntry?.id,
          cart_amount: clickPayEntry?.cart_amount,
          cart_currency: 'SAR',
          tran_type: 'sale',
          tran_class: 'ecom',
          cart_description: 'TopUp',
          callback: appConfig().clickPayCallbackUrl,
          return: appConfig().clickPayCallbackUrl,
        };
        if (params?.applePayToken) {
          this.logger.log(`[createHostedPaymentRequest] applePay method`);
          clickPayRequest.customer_details = {
            name: 'John Smith',
            email: 'test@gmail.com',
            street1: '404, 11th st, void',
            city: 'riyadh',
            country: 'SA',
            phone: '97333333101',
            ip: '99.99.00.00',
          };
          clickPayRequest.apple_pay_token = params?.applePayToken;
        }

        this.logger.log(
          `[createHostedPaymentRequest] clickPayRequest ${JSON.stringify(
            clickPayRequest,
          )}`,
        );
        const clickPayApiUrl = `${appConfig().clickPayBaseurl}/payment/request`;
        const clickPayApiHeader = {
          headers: {
            Authorization: appConfig().clickPayAuth,
          },
        };
        const clickPayResponse: any = await axios.post(
          clickPayApiUrl,
          clickPayRequest,
          clickPayApiHeader,
        );
        this.logger.log(
          `[createHostedPaymentRequest] clickPayResponse request sent`,
        );
        const updateParams: any = {
          tran_ref: clickPayResponse?.data?.tran_ref,
          tran_type: clickPayResponse?.data?.tran_type,
          cart_description: clickPayResponse?.data?.cart_description,
          cart_currency: clickPayResponse?.data?.cart_currency,
          serviceId: clickPayResponse?.data?.serviceId,
          merchantId: clickPayResponse?.data?.merchantId,
          trace: clickPayResponse?.data?.trace,
        };
        await this.ClickpayRepository.update(
          { id: clickPayResponse?.data?.cart_id },
          updateParams,
        );
        if (params?.applePayToken) {
          this.logger.log(
            `[createHostedPaymentRequest] clickPayResponse applePayToken verification sent`,
          );
          return await this.handleCallBack({
            cartId: clickPayEntry?.id,
            tranRef: clickPayResponse?.data?.tran_ref,
          });
        } else if (
          clickPayResponse?.data?.redirect_url &&
          !params?.applePayToken
        ) {
          return ResponseData.success({
            redirect_url: clickPayResponse?.data?.redirect_url,
            txnId: clickPayResponse?.data?.cart_id,
          });
        } else {
          return ResponseData.error(
            HttpStatus.BAD_REQUEST,
            errorMessage.SOMETHING_WENT_WRONG,
          );
        }
      }
    } catch (err) {
      this.logger.error(`[create] catch error: ${err?.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async handleCallBack(params: ClickPayCallBackResponseDto) {
    try {
      this.logger.log(`[handlCallBack] start`);
      const transactionDetails = await this.findOne(params?.cartId);
      const verifyTransaction = await this.verifyTransaction(params?.tranRef);
      if (
        transactionDetails?.data?.payment_status == ClickPayStatus.PENDING &&
        transactionDetails?.data?.tran_ref == params.tranRef &&
        verifyTransaction?.statusCode == HttpStatus.OK &&
        verifyTransaction?.data?.payment_result?.response_message ==
          'Authorised'
      ) {
        await this.ClickpayRepository.update(
          { id: params?.cartId },
          {
            verifyApiResponse: JSON.stringify(verifyTransaction?.data),
            apiResponse: JSON.stringify(params),
            payment_status: ClickPayStatus.COMPLETED,
          },
        );
        if (transactionDetails.data.type == TRANSACTION_TYPE.TOP_UP) {
          const createTransaction: any = {
            entityId: transactionDetails.data.id,
            entityType: ENTITY_TYPE.TOP_UP,
            senderId: '0',
            senderAmount: 0,
            debitAmount: 0,
            receiverId: transactionDetails.data.userId,
            receiverTax: transactionDetails.data.tax,
            receiverFee: 0,
            bankFee: transactionDetails.data.fee,
            receiverAmount: transactionDetails.data.creditAmount,
            transactionAmount: transactionDetails.data.cart_amount,
            creditAmount: transactionDetails.data.creditAmount,
            source: TRANSACTION_SOURCE.CLICK_PAY,
            sourceRef: transactionDetails.data.id,
            transactionId: transactionDetails.data.tran_ref,
            status: TRANSACTION_STATUS.COMPLETED,
            eWalletAPIResponse: JSON.stringify(verifyTransaction?.data),
          };

          this.transactionService.create(createTransaction);
          const updateBalanceParams = {
            userId: transactionDetails?.data?.userId,
            balance: transactionDetails?.data?.cart_amount,
          };

          await this.transferService.updateWalletBlance(updateBalanceParams);
        } else if (
          transactionDetails.data.type == TRANSACTION_TYPE.SUBSCRIPTION
        ) {
          const payload = {
            source: TRANSACTION_SOURCE.CLICK_PAY,
            sourceRef: transactionDetails.data.id,
            transactionId: transactionDetails.data.tran_ref,
            userId: transactionDetails.data.userId,
            senderTax: transactionDetails.data.tax,
            senderFee: 0,
            bankFee: transactionDetails.data.fee,
            senderAmount: transactionDetails.data.creditAmount,
            transactionAmount: transactionDetails.data.cart_amount,
            promoCode: transactionDetails.data?.promoCode,
            promoCodeAmount: transactionDetails.data?.promoCodeAmount,
            eWalletAPIResponse: JSON.stringify(verifyTransaction?.data),
          };

          this.logger.log(
            `kafka::payment::${ADD_USER_SUBSCRIPTION}::emit -> ${JSON.stringify(
              payload,
            )}`,
          );
          this.clientCaptainTCP
            .send(ADD_USER_SUBSCRIPTION, JSON.stringify(payload))
            .pipe()
            .toPromise();
        }
        const b2bParams = {
          id: transactionDetails.data.id,
          amount: transactionDetails.data.creditAmount,
          type: transactionDetails.data.type,
          // fee: transactionDetails.data.fee,
          tax: transactionDetails.data.tax,
        };
        this.transferService.topupMainAccTransfer(b2bParams);
        return ResponseData.success({}, 'Payment Completed');
      } else {
        if (
          transactionDetails?.statusCode == HttpStatus.OK &&
          transactionDetails?.data?.tran_ref == params.tranRef &&
          verifyTransaction?.statusCode == HttpStatus.OK
        ) {
          await this.ClickpayRepository.update(
            { id: params?.cartId },
            {
              verifyApiResponse: JSON.stringify(verifyTransaction?.data),
              apiResponse: JSON.stringify(params),
              payment_status: ClickPayStatus.FAILED,
            },
          );
        }
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          params.respMessage || errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    } catch (err) {
      this.logger.error(`[handlCallBack] catch error: ${err?.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async verifyTransaction(tran_ref: string) {
    try {
      this.logger.log(`[verifyTransaction] params: ${tran_ref}`);
      const profile_id = appConfig().clickPayPorfileId;
      const clickPayApiUrl = `${appConfig().clickPayBaseurl}/payment/query`;
      const clickPayApiHeader = {
        headers: {
          Authorization: appConfig().clickPayAuth,
        },
      };
      const clickPayApiReq = { tran_ref, profile_id };
      const clickPayResponse: any = await axios.post(
        clickPayApiUrl,
        clickPayApiReq,
        clickPayApiHeader,
      );
      if (clickPayResponse?.data?.payment_result) {
        return ResponseData.success(clickPayResponse.data);
      } else {
        return ResponseData.error(HttpStatus.BAD_REQUEST);
      }
    } catch (err) {
      this.logger.error(`[verifyTransaction] catch error: ${err?.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAllByUserId(userId: string) {
    try {
      this.logger.log('[findAllByUserId] userId:' + userId);

      const fields = [
        'clickpay_transactions.id',
        'clickpay_transactions.userId',
        'clickpay_transactions.cart_amount',
        'clickpay_transactions.tax',
        'clickpay_transactions.fee',
        'clickpay_transactions.payment_status',
        'clickpay_transactions.cart_currency',
        'clickpay_transactions.tran_ref',
        'clickpay_transactions.createdAt',
        'clickpay_transactions.updatedAt',
      ];
      const paymentStatus = [ClickPayStatus.COMPLETED, ClickPayStatus.FAILED];

      const clickPayInstance = this.ClickpayRepository.createQueryBuilder(
        'clickpay_transactions',
      );
      const transactions = await clickPayInstance
        .select(fields)
        .where(`payment_status In(${paymentStatus})`)
        .andWhere({ userId })
        .getMany();
      return ResponseData.success(transactions);
    } catch (err) {
      this.logger.error(
        '[findAllByUserId] findAllByUserId Error Response Message: ' +
          err?.response?.data?.message,
      );
      this.logger.error('[findAllByUserId] findAllByUserId ' + err?.response);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAll() {
    try {
      this.logger.log('[findAll]');

      const fields = [
        'clickpay_transactions.id',
        'clickpay_transactions.userId',
        'clickpay_transactions.cart_amount',
        'clickpay_transactions.tax',
        'clickpay_transactions.fee',
        'clickpay_transactions.payment_status',
        'clickpay_transactions.cart_currency',
        'clickpay_transactions.tran_ref',
        'clickpay_transactions.createdAt',
        'clickpay_transactions.updatedAt',
      ];

      const clickPayInstance = this.ClickpayRepository.createQueryBuilder(
        'clickpay_transactions',
      );
      const transactions = await clickPayInstance.select(fields).getMany();
      return ResponseData.success(transactions);
    } catch (err) {
      this.logger.error(
        '[findAllByUserId] findAllByUserId Error Response Message: ' +
          err?.response?.data?.message,
      );
      this.logger.error('[findAllByUserId] findAllByUserId ' + err?.response);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findOne(id: string) {
    const transaction = await this.ClickpayRepository.findOne(id);
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

  update(id: number, updateClickPayDto: UpdateClickPayDto) {
    return `This action updates a #${id} clickPay`;
  }

  remove(id: number) {
    return `This action removes a #${id} clickPay`;
  }
}

import appConfig from 'config/appConfig';
import { TRANSACTION_ENTITY_TYPE } from 'src/modules/alinma-b2-b/enums/alinma.enum';

export interface TransferAPIHeaders {
  // sessionId: string // removed from latest e-wallet API changes
  channelId: string;
  Authorization: string;
  'Content-Type': string;
}
export interface SubscriptionTransactionAPIHeaders {
  customerId?: string;
  channelId: string;
  Accept: string;
  'Content-Type': string;
  Authorization: string;
}
export interface TransferAPIInput {
  holderId?: string;
  senderId: string;
  senderUserType: string;
  receiverId: string;
  receiverUserType: string;
  amount?: string;
  senderFee?: string;
  senderTax?: string;
  receiverFee?: string;
  receiverTax?: string;
  channel?: string;
  details?: string;
}

export class TransferHandler {
  constructor() {}

  static getHeaderParams(): TransferAPIHeaders {
    const authCredentails = `${appConfig().paymentAPIUser}:${
      appConfig().paymentAPIPass
    }`;
    const authToken = Buffer.from(authCredentails).toString('base64');
    let headers: TransferAPIHeaders = {
      channelId: appConfig().paymentChannel,
      Authorization: `Basic ${authToken}`,
      'Content-Type': 'application/json',
    };
    return headers;
  }

  static getSubscriptionHeaderParams(
    customerId?: string,
  ): SubscriptionTransactionAPIHeaders {
    const authCredentials = `${appConfig().subscriptionAPIUser}:${
      appConfig().subscriptionAPIPass
    }`;
    const authToken = Buffer.from(authCredentials).toString('base64');

    let headers: SubscriptionTransactionAPIHeaders = {
      channelId: appConfig().paymentChannel,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${authToken}`,
    };

    if (customerId) {
      headers = {
        ...headers,
        customerId,
      };
    }

    return headers;
  }

  static prepareInput(data: any, apiname: string) {
    let apiInput: any = {
      senderId: data.senderId ?? '',
      receiverId: data.receiverId ?? '',
      holderId: '',
    };
    if (data.transactionId) {
      apiInput.holderId = data.transactionId;
      delete data.transactionId;
    } else {
      delete apiInput.holderId;
    }
    apiInput = { ...apiInput, ...data };
    delete apiInput.tripId;
    if (apiname == 'hold' || apiname == 'update') {
      // apiInput.amount = apiInput.amount ?? 0;
      // apiInput.senderFee = apiInput.senderFee ?? 0;
      // apiInput.senderTax = apiInput.senderTax ?? 0;
      // apiInput.receiverFee = apiInput.receiverFee ?? 0;
      // apiInput.receiverTax = apiInput.receiverTax ?? 0;

      // apiInput.amount = apiInput.amount.toString();
      // apiInput.senderFee = apiInput.senderFee.toString();
      // apiInput.senderTax = apiInput.senderTax.toString();
      // apiInput.receiverFee = apiInput.receiverFee.toString();

      apiInput.amount = Number(apiInput?.amount || 0).toString();
      apiInput.senderFee = Number(apiInput?.senderFee || 0).toString();
      apiInput.senderTax = Number(apiInput?.senderTax || 0).toString();
      apiInput.receiverFee = Number(apiInput?.receiverFee || 0).toString();
      apiInput.receiverTax = Number(apiInput?.receiverTax || 0).toString();
      apiInput.motFee = Number(apiInput?.motFee || 0).toString();
    }
    return apiInput;
  }

  static prepareMainAccInput(data: any, type: string, source: string) {
    let Input: any = {};
    Input.amount = Number(data.amount).toFixed(2);
    if (type == 'topup') {
      Input.srcAccNum = appConfig().alinmaMainAccNum;
      Input.targAccNum = appConfig().alinmaTopupAccNum;
      Input.pmtDesc = data?.pmtDesc || 'topup';
      Input.entityType = TRANSACTION_ENTITY_TYPE.TOP_UP;
    }

    if (type == 'proxy') {
      Input.srcAccNum = appConfig().alinmaTopupAccNum;
      Input.targAccNum = appConfig().alinmaRideTopupAccNum;
      Input.pmtDesc = data?.pmtDesc || 'topup';
      Input.entityType = TRANSACTION_ENTITY_TYPE.TRIP_AMOUNT;
    }

    if (type == 'subscription') {
      Input.srcAccNum = appConfig().alinmaMainAccNum;
      Input.targAccNum = appConfig().alinmaSubscriptionAccNum;
      Input.pmtDesc = data?.pmtDesc || 'subscription';
      Input.entityType = TRANSACTION_ENTITY_TYPE.SUBSCRIPTION;
    }
    if (type == 'earning') {
      Input.srcAccNum = appConfig().alinmaRideTopupAccNum;
      Input.targAccNum = data?.iban.toUpperCase();
      Input.benBankCode =
        data?.bic.substring(data?.bic.length - 3) === 'XXX'
          ? data?.bic.slice(0, -3)
          : data?.bic;
      Input.benFullName = data?.bank.replace(/[^\w\s]/gi, ' ');
      Input.pmtDesc = data?.pmtDesc || 'earning';
      Input.entityType = TRANSACTION_ENTITY_TYPE.DRIVER_WITHDRAWAL;
    }
    if (type == 'tax') {
      Input.srcAccNum =
        source == 'subscription'
          ? appConfig().alinmaMainAccNum
          : appConfig().alinmaMainAccNum;
      Input.targAccNum = appConfig().alinmaTaxAccNum;
      Input.pmtDesc = data?.pmtDesc || 'tax';
      Input.entityType = TRANSACTION_ENTITY_TYPE.TAX;
    }
    if (type == 'fee') {
      Input.srcAccNum =
        source == 'subscription'
          ? appConfig().alinmaMainAccNum
          : appConfig().alinmaRideTopupAccNum;
      Input.targAccNum = appConfig().alinmaFeeAccNum;
      Input.pmtDesc = data?.pmtDesc || 'fee';
      Input.entityType = TRANSACTION_ENTITY_TYPE.FEE;
    }
    Input.srcCurCode = data?.srcCurCode || 'SAR';
    Input.srcTrnDesc = data?.srcTrnDesc || Input.pmtDesc;
    Input.memo = data?.memo || Input.pmtDesc;
    Input.parentId = data?.id;

    return Input;
  }
}

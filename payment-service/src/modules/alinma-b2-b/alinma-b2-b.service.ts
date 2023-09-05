import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  accountInquiryDto,
  xferBtwCustAccDto,
} from './dto/create-alinma-b2-b.dto';
import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';
import { LoggerHandler } from 'src/helpers/logger-handler';
import appConfig from 'config/appConfig';
import axios from 'axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { alinmaTransactionsEntity } from './entities/alinma-trasactions.entity';
import { alinmaHistoryEntity } from './entities/alinma-history.entity';
import {
  RESPONSE_STATUS_CODE,
  TRANSACTION_ENTITY_TYPE,
  TRANSACTION_STATUS,
} from './enums/alinma.enum';
import { ListSearchSortDto } from '../transactions/interface/transaction.interface';
import { getIsoDateTime } from 'src/utils/get-timestamp';
import { AlinmaTransactionsSort } from '../transactions/enum';
import { IbanService } from '../iban/iban.service';

const fs = require('fs');
const jks = require('jks-js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const https = require('https');
const xmlToJsonConverter = require('xml-js');

@Injectable()
export class AlinmaB2BService {
  constructor(
    @InjectRepository(alinmaTransactionsEntity)
    private alinmaTransRepository: Repository<alinmaTransactionsEntity>,
    @InjectRepository(alinmaHistoryEntity)
    private alinmaTransHistoryRepository: Repository<alinmaHistoryEntity>,
    private ibanService: IbanService,
  ) {}
  private readonly logger = new LoggerHandler(
    AlinmaB2BService.name,
  ).getInstance();
  private channelId = appConfig().alinmaChannelId;
  private partnerId = appConfig().alinmaPartnerId;

  private certBuffer = fs.readFileSync(appConfig().alinmaCertPath);
  private keyBuffer = fs.readFileSync(appConfig().alinmaKeyPath);
  private encryptedKeyBuffer = fs.readFileSync(
    appConfig().alinmaEncryptedKeyPath,
  );

  private cert = this.certBuffer.toString('utf8');
  private key = this.keyBuffer.toString('utf8');

  // private keystore = jks.toPem(
  //   fs.readFileSync(appConfig().alinmaJksPath, 'utf8'),
  //   appConfig().alinmaJksPass,
  // );
  // private cert = this.keystore['ride']['cert'];
  // private key = this.keystore['ride']['key'];

  private agent = new https.Agent({
    key: this.encryptedKeyBuffer,
    cert: this.certBuffer,
    passphrase: appConfig().alinmaKeyPass,
    rejectUnauthorized: false,
  });

  private readonly axiosConfig = {
    httpsAgent: this.agent,
    headers: {
      'Content-Type': 'text/xml',
    },
  };
  private readonly xmlToJsonOptions = {
    compact: true,
    ignoreComment: true,
    spaces: 0,
    ignoreAttributes: true,
    ignoreInstruction: true,
    ignoreCdata: true,
    ignoreDoctype: true,
    ignoreDeclaration: true,
    instructionHasAttributes: true,
    nativeTypeAttributes: true,
    nativeType: true,
  };

  async retryTransaction(id) {
    try {
      this.logger.log(`[retryTransaction] id -> ${id}`);

      const updateAlinma = await this.alinmaTransRepository
        .createQueryBuilder()
        .update(alinmaTransactionsEntity)
        .set({ status: TRANSACTION_STATUS.PENDING })
        .where('id = :id', { id: id })
        .andWhere('status = :status', {
          status: TRANSACTION_STATUS.FAILED,
        }) // total kitni entries ka status update karna
        .execute();
      if (updateAlinma?.affected > 0) {
        this.logger.log(
          `[retryTransaction] id -> ${id}, status changed failed to pending`,
        );

        let transactionData: any = await this.alinmaTransRepository.findOne(id);
        const requestId = this.makeId(22);
        const requestDateTime = this.isoDate();
        const functionId = transactionData.functionId;
        const requestHeader = this.alinmaHeader(
          requestId,
          requestDateTime,
          functionId,
        );
        let reuqestBody;
        if (
          transactionData.entityType ==
          TRANSACTION_ENTITY_TYPE.DRIVER_WITHDRAWAL
        ) {
          const { data } = await this.ibanService.findOne(
            transactionData.targAccNum,
          );
          transactionData = {
            ...transactionData,
            benBankCode:
              data?.bic.substring(data?.bic.length - 3) === 'XXX'
                ? data?.bic.slice(0, -3)
                : data?.bic,
            benFullName: data?.bank.replace(/[^\w\s]/gi, ' '),
          };
          reuqestBody = this.xferSarie(transactionData);
        } else {
          reuqestBody = this.xferBtwCustAccRqBody(transactionData);
        }
        const xmlRequest = this.alinmaRequest(requestHeader, reuqestBody);
        const apiUrl = appConfig().alinmaXferAlinmaUrl;
        let signedRequest = await this.generateSignedRequest(xmlRequest);
        this.logger.log(`[retryTransaction] generateSignedRequest received`);
        if (signedRequest.statusCode == HttpStatus.OK) {
          const alinmaTransHisDbParams: any = {
            requestId,
            request: signedRequest.xmlRequest,
            transactionId: transactionData.id,
          };
          const transhisDbEntry = this.alinmaTransHistoryRepository.create(
            alinmaTransHisDbParams,
          );
          const saveTransHisRecords: any =
            await this.alinmaTransHistoryRepository.save(transhisDbEntry);
          // try {
          this.logger.log(`[retryTransaction]  [fundXfer] seinding`);
          const reqParams = {
            apiUrl,
            xmlRequest,
            tId: id,
            historyId: saveTransHisRecords.id,
          };
          return await this.sendRequest(reqParams);
        } else {
          this.logger.log(
            `[retryTransaction] generateSignedRequest failed: ${id} `,
          );
          return ResponseData.error(
            HttpStatus.BAD_REQUEST,
            errorMessage.SOMETHING_WENT_WRONG,
          );
        }
      } else {
        this.logger.log(
          `[retryTransaction] transaction not allowed to retry id: ${id} `,
        );
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.TRANSACTION_NOT_ALLOWED_TO_RETRY,
        );
      }
    } catch (err) {
      this.logger.log(`[retryTransaction] catch -> ${err?.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async alinmaTransactions(params: ListSearchSortDto) {
    TRANSACTION_STATUS.FAILED;
    try {
      const transQryInstance =
        this.alinmaTransRepository.createQueryBuilder('transactions');
      // Admin Filters
      if (params?.filters?.userId) {
        transQryInstance.andWhere('transactions.userId = :userId', {
          userId: params?.filters?.userId,
        });
      }
      if (params?.filters?.status) {
        transQryInstance.andWhere('transactions.entityType = :status', {
          status: params?.filters?.status,
        });
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
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = AlinmaTransactionsSort[params?.sort?.field];
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
      await transQryInstance.getManyAndCount();
      const totalCount: number = total;
      const transactions: any = result;
      // console.log(transactions);

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
  async accountInquiry(params: accountInquiryDto) {
    try {
      const requestId = this.makeId(22);
      const requestDateTime = this.isoDate();
      const functionId = appConfig().alinmaAccInqFuncId;
      const requestHeader = this.alinmaHeader(
        requestId,
        requestDateTime,
        functionId,
      );
      const reuqestBody = this.custAcctDtlsInqRqBody(params);
      const xmlRequest = this.alinmaRequest(requestHeader, reuqestBody);
      const apiUrl = appConfig().alinmaAccInqUrl;
      let signedRequest = await this.generateSignedRequest(xmlRequest);
      if (signedRequest.statusCode == HttpStatus.OK) {
        this.logger.log(
          `[accountInquiry] -> request : ${JSON.stringify(xmlRequest)}`,
        );

        // this.logger.log(
        //   `[accountInquiry] -> request signed : ${JSON.stringify(
        //     signedRequest,
        //   )}`,
        // );

        this.logger.log(
          `[accountInquiry] -> api url : ${JSON.stringify(apiUrl)}`,
        );
        // this.logger.log(
        //   `[accountInquiry] -> axiosConfig : ${JSON.stringify(
        //     this.axiosConfig,
        //   )}`,
        // );
        const { data } = await axios.post(
          apiUrl,
          signedRequest.xmlRequest,
          this.axiosConfig,
        );
        const dataInJson = xmlToJsonConverter.xml2js(
          data,
          this.xmlToJsonOptions,
        );
        // this.logger.log(
        //   `[accountInquiry] -> apiRes : ${JSON.stringify(apiRes?.data)}`,
        // );

        const CurrBal =
          dataInJson['soapenv:Envelope']['soapenv:Body']['CustAcctDtlsInqRs'][
            'CurrBal'
          ]['_text'] || 'error';

        const LedgerBal =
          dataInJson['soapenv:Envelope']['soapenv:Body']['CustAcctDtlsInqRs'][
            'LedgerBal'
          ]['_text'] || 'error';

        const AvailBal =
          dataInJson['soapenv:Envelope']['soapenv:Body']['CustAcctDtlsInqRs'][
            'AvailBal'
          ]['_text'] || 'error';

        return ResponseData.success({
          accNum: params.accNum,
          currentBal: CurrBal,
          ledgerBal: LedgerBal,
          availableBal: AvailBal,
        });
      } else
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAllAccBal() {
    const main = await this.accountInquiry({
      accNum: appConfig().alinmaMainAccNum,
    });
    const topup = await this.accountInquiry({
      accNum: appConfig().alinmaTopupAccNum,
    });
    const rideTopup = await this.accountInquiry({
      accNum: appConfig().alinmaRideTopupAccNum,
    });
    const vat = await this.accountInquiry({
      accNum: appConfig().alinmaTaxAccNum,
    });
    const fee = await this.accountInquiry({
      accNum: appConfig().alinmaFeeAccNum,
    });
    const subscription = await this.accountInquiry({
      accNum: appConfig().alinmaSubscriptionAccNum,
    });

    return ResponseData.success({
      main: main?.data,
      topup: topup?.data,
      rideTopup: rideTopup?.data,
      vat: vat?.data,
      fee: fee?.data,
      subscription: subscription?.data,
    });
  }

  async fundXfer(params: xferBtwCustAccDto) {
    try {
      this.logger.log(`[fundXfer] start`);
      const requestId = this.makeId(22);
      const requestDateTime = this.isoDate();

      const functionId =
        params?.entityType == TRANSACTION_ENTITY_TYPE.FEE ||
        params?.entityType == TRANSACTION_ENTITY_TYPE.TAX ||
        params?.entityType == TRANSACTION_ENTITY_TYPE.TOP_UP ||
        params?.entityType == TRANSACTION_ENTITY_TYPE.TRIP_AMOUNT
          ? appConfig().alinmaXferBtwCustFuncId
          : params?.entityType == TRANSACTION_ENTITY_TYPE.DRIVER_WITHDRAWAL
          ? appConfig().alinmaXferSarieFuncId
          : '';
      const requestHeader = this.alinmaHeader(
        requestId,
        requestDateTime,
        functionId,
      );
      const reuqestBody =
        params?.entityType == TRANSACTION_ENTITY_TYPE.FEE ||
        params?.entityType == TRANSACTION_ENTITY_TYPE.TAX ||
        params?.entityType == TRANSACTION_ENTITY_TYPE.TOP_UP ||
        params?.entityType == TRANSACTION_ENTITY_TYPE.TRIP_AMOUNT
          ? this.xferBtwCustAccRqBody(params)
          : params?.entityType == TRANSACTION_ENTITY_TYPE.DRIVER_WITHDRAWAL
          ? this.xferSarie(params)
          : '';
      const xmlRequest = this.alinmaRequest(requestHeader, reuqestBody);
      const apiUrl = appConfig().alinmaXferAlinmaUrl;
      let signedRequest = await this.generateSignedRequest(xmlRequest);
      this.logger.log(`[fundXfer] generateSignedRequest received`);
      if (signedRequest.statusCode == HttpStatus.OK) {
        const alinmaTransDbParams: any = {
          ...params,
          functionId,
        };
        const transBbEntry =
          this.alinmaTransRepository.create(alinmaTransDbParams);
        const saveTransRecords: any = await this.alinmaTransRepository.save(
          transBbEntry,
        );

        const alinmaTransHisDbParams: any = {
          requestId,
          request: signedRequest.xmlRequest,
          transactionId: saveTransRecords.id,
        };
        const transhisDbEntry = this.alinmaTransHistoryRepository.create(
          alinmaTransHisDbParams,
        );
        const saveTransHisRecords: any =
          await this.alinmaTransHistoryRepository.save(transhisDbEntry);

        try {
          this.logger.log(`[fundXfer] seinding`);
          const { data } = await axios.post(
            apiUrl,
            signedRequest.xmlRequest,
            this.axiosConfig,
          );
          this.logger.log(`[fundXfer] success received`);
          await this.alinmaTransHistoryRepository.update(
            { id: saveTransHisRecords.id },
            { response: data },
          );
          const dataInJson = xmlToJsonConverter.xml2js(
            data,
            this.xmlToJsonOptions,
          );
          const statusCode = dataInJson['soapenv:Envelope']['soapenv:Header'][
            'b2b:ResponseHeader'
          ]['b2b:StatusCode']['_text']
            ? dataInJson['soapenv:Envelope']['soapenv:Header'][
                'b2b:ResponseHeader'
              ]['b2b:StatusCode']['_text']
            : false;

          const status =
            statusCode == RESPONSE_STATUS_CODE.SUCCESS
              ? TRANSACTION_STATUS.COMPLETED
              : TRANSACTION_STATUS.FAILED;

          await this.alinmaTransRepository.update(
            { id: saveTransRecords.id },
            {
              responseStatusCode: statusCode,
              status: status,
            },
          );
          return ResponseData.success();
        } catch (err) {
          this.logger.error(`[fundXfer] failed received:`);
          await this.alinmaTransRepository.update(
            { id: saveTransRecords.id },
            {
              status: TRANSACTION_STATUS.FAILED,
            },
          );
          if (axios.isAxiosError(err)) {
            const data = err?.response?.data;
            if (data)
              await this.alinmaTransHistoryRepository.update(
                { id: saveTransHisRecords.id },
                { response: data },
              );
            const dataInJson = xmlToJsonConverter.xml2js(
              data,
              this.xmlToJsonOptions,
            );
            const statusCode = dataInJson['soapenv:Envelope']['soapenv:Header'][
              'b2b:ResponseHeader'
            ]['b2b:StatusCode']['_text']
              ? dataInJson['soapenv:Envelope']['soapenv:Header'][
                  'b2b:ResponseHeader'
                ]['b2b:StatusCode']['_text']
              : false;
            await this.alinmaTransRepository.update(
              { id: saveTransRecords.id },
              {
                responseStatusCode: statusCode,
              },
            );
          }
        }

        return ResponseData.error(HttpStatus.SERVICE_UNAVAILABLE);
      } else
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async sendRequest(params: any) {
    let tId = params?.tId;
    let historyId = params?.historyId;
    try {
      const { apiUrl, xmlRequest } = params;

      this.logger.log(`[sendRequest] seinding`);
      const { data } = await axios.post(apiUrl, xmlRequest, this.axiosConfig);
      this.logger.log(`[sendRequest] success received`);
      await this.alinmaTransHistoryRepository.update(
        { id: historyId },
        { response: data },
      );
      const dataInJson = xmlToJsonConverter.xml2js(data, this.xmlToJsonOptions);
      const statusCode = dataInJson['soapenv:Envelope']['soapenv:Header'][
        'b2b:ResponseHeader'
      ]['b2b:StatusCode']['_text']
        ? dataInJson['soapenv:Envelope']['soapenv:Header'][
            'b2b:ResponseHeader'
          ]['b2b:StatusCode']['_text']
        : false;

      const status =
        statusCode == RESPONSE_STATUS_CODE.SUCCESS
          ? TRANSACTION_STATUS.COMPLETED
          : TRANSACTION_STATUS.FAILED;

      await this.alinmaTransRepository.update(
        { id: tId },
        {
          responseStatusCode: statusCode,
          status: status,
        },
      );
      return ResponseData.success();
    } catch (err) {
      this.logger.error(`[sendRequest] failed received:`);
      await this.alinmaTransRepository.update(
        { id: tId },
        {
          status: TRANSACTION_STATUS.FAILED,
        },
      );
      if (axios.isAxiosError(err)) {
        const data = err?.response?.data;
        if (data)
          await this.alinmaTransHistoryRepository.update(
            { id: historyId },
            { response: data },
          );
        const dataInJson = xmlToJsonConverter.xml2js(
          data,
          this.xmlToJsonOptions,
        );
        const statusCode = dataInJson['soapenv:Envelope']['soapenv:Header'][
          'b2b:ResponseHeader'
        ]['b2b:StatusCode']['_text']
          ? dataInJson['soapenv:Envelope']['soapenv:Header'][
              'b2b:ResponseHeader'
            ]['b2b:StatusCode']['_text']
          : false;
        await this.alinmaTransRepository.update(
          { id: tId },
          {
            responseStatusCode: statusCode,
          },
        );
      }
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.TRANSACTION_RETRY_FAILED,
      );
    }
  }
  async generateSignedRequest(request, cert = this.cert, key = this.key) {
    try {
      const argv = Buffer.from(JSON.stringify({ request, cert, key })).toString(
        'base64',
      ); //btoa(JSON.stringify({ request, cert, key }));
      this.logger.log(`[generateSignedRequest] input sent`);
      const { stdout, stderr } = await exec(
        `php ${appConfig().wssePhpScriptPath} ${argv}`,
      );
      this.logger.log(`[generateSignedRequest] output received`);
      let res: any = stdout.match(/\-\-\-start\-\-\-(.*?)\-\-\-end\-\-\-/m);
      if (res[1]) {
        this.logger.log(`[generateSignedRequest] output readed`);
        return JSON.parse(res[1]);
      } else {
        this.logger.error(`[generateSignedRequest] output not correct`);
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    } catch (err) {
      this.logger.error(`[generateSignedRequest] catch error `);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  isoDate() {
    const now = new Date();
    return now.toISOString();
  }
  makeId(length: number) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let i: number;
    for (i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return `B2B_${result}`;
  }

  xferBtwCustAccRqBody(params: xferBtwCustAccDto) {
    return `<b2b:FundXferRq>
			<alin:Src>
				<alin:AcctId>
					<alin:AcctNum>${params.srcAccNum}</alin:AcctNum>
				</alin:AcctId>
				<alin:CurAmt>
					<alin:Amt>${params.amount}</alin:Amt>
					<alin:CurCode>${params.srcCurCode}</alin:CurCode>
				</alin:CurAmt>
				<alin:TrnDesc>${params.srcTrnDesc || params.trnDesc || 'retry'}</alin:TrnDesc>
			</alin:Src>
			<alin:Targ>
				<alin:AcctId>
					<alin:AcctNum>${params.targAccNum}</alin:AcctNum>
				</alin:AcctId>
			</alin:Targ>
			<alin:PmtDesc>${params.pmtDesc || 'retry'}</alin:PmtDesc>
			<alin:Memo>${params.memo || 'retry'}</alin:Memo>
		</b2b:FundXferRq>`;
  }

  xferSarie(params: xferBtwCustAccDto) {
    return `<b2b:FundXferRq>
         <alin:Src>
            <alin:AcctId>
               <alin:AcctNum>${params.srcAccNum}</alin:AcctNum>
            </alin:AcctId>
            <alin:CurAmt>
               <alin:Amt>${params.amount}</alin:Amt>
               <alin:CurCode>${params.srcCurCode}</alin:CurCode>
            </alin:CurAmt>
         </alin:Src>
         <alin:Targ>
            <alin:AdhocBen>
               <alin:FullName>${params.benFullName}</alin:FullName>
               <alin:BenAcctNum>${params.targAccNum}</alin:BenAcctNum>
               <alin:BenBankDtl>
                  <alin:BankCode>${params.benBankCode}</alin:BankCode>
               </alin:BenBankDtl>
            </alin:AdhocBen>
            <alin:CurAmt>
               <alin:CurCode>${params?.targCurCode || 'SAR'}</alin:CurCode>
            </alin:CurAmt>
         </alin:Targ>
      </b2b:FundXferRq>`;
  }

  custAcctDtlsInqRqBody(params: accountInquiryDto) {
    return `<b2b:CustAcctDtlsInqRq>
         <alin:AcctId>
            <alin:AcctNum>${params.accNum}</alin:AcctNum>
         </alin:AcctId>
      </b2b:CustAcctDtlsInqRq>`;
  }

  alinmaHeader(reqId, requestDateTime, functionId) {
    return `<b2b:RequestId>${reqId}</b2b:RequestId>
          <b2b:ChannelId>${this.channelId}</b2b:ChannelId>
          <b2b:FunctionId>${functionId}</b2b:FunctionId>
          <b2b:RequestDateTime>${requestDateTime}</b2b:RequestDateTime>
          <b2b:PartnerId>${this.partnerId}</b2b:PartnerId>`;
  }

  alinmaRequest(header, body) {
    return `<soapenv:Envelope xmlns:alin="http://www.alinma.com" xmlns:b2b="http://www.alinma.com/b2b/" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <soapenv:Header>
          <b2b:RequestHeader wsu:Id="pfxe1d23d67-28ea-7def-9a25-308749212c6e">
          ${header}
          </b2b:RequestHeader>
      </soapenv:Header>
      <soapenv:Body wsu:Id="pfxfe2928c4-30ad-5253-0bc7-527bb3727327">
        ${body}
      </soapenv:Body>
    </soapenv:Envelope>`;
  }
}

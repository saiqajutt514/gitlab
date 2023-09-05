import {
  Injectable,
  HttpStatus,
  Logger,
  HttpException,
  BadGatewayException,
} from '@nestjs/common';
import {
  ClientKafka,
  Client,
  Transport,
  ClientProxy,
} from '@nestjs/microservices';
import { RedisClient } from 'redis';
import { promisify } from 'util';
import { createHash } from 'crypto';

import appConfig from 'config/appConfig';
import {
  paymentTCPConfig,
  tripKafkaMicroServiceConfig,
  tripTCPMicroServiceConfig,
} from 'src/microServiceConfigs';
import {
  authKafkaMicroServiceConfig,
  authTCPMicroServiceConfig,
} from 'config/authServiceConfig';
import {
  captainKafkaConfig,
  captainTCPConfig,
  notificationKafkaConfig,
  notificationTCPConfig,
} from 'src/microServiceConfigs';
import {
  CAPTAIN_DETAIL,
  GET_USER_DETAILS,
  GET_NOTIFICATIONS,
  CREATE_CUSTOMER,
  CUSTOMER_UPDATE_PICTURE,
  UPSERT_CUSTOMER,
  GET_BALANCE,
  CLICKPAY_HOSTED_TOP_UP,
  CLICKPAY_CALLBACK,
  TOP_UP_HISTORY,
  GET_CUSTOMER_DETAIL,
  VALIDATE_IBAN,
  CUSTOMER_KYC,
  GET_CUSTOMER_KYC_STATUS,
  GET_IBAN,
  GET_ALL_ACTIVE_LOCATIONS,
  GET_ALL_USER_TRANSACTIONS,
} from './kafka-constants';
import { PaginationCommonDto } from 'src/helpers/dto/pagination';
import { GetNotificationsDto } from './dto/get-notifications';

import { LoggerHandler } from 'src/helpers/logger-handler';
import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';
import {
  ListSearchSortDto,
  UpdateCustomerDto,
} from './dto/update-customer.dto';
import { MailerService } from '@nestjs-modules/mailer';
import {
  ClickPayCallBackResponseDto,
  customerKycDto,
  UpdateBalanceDto,
  UpdatePictureDto,
} from '../admin/dto/admin-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly mailerService: MailerService) {}

  private readonly logger = new LoggerHandler(UserService.name).getInstance();

  // @Client(notificationKafkaConfig)
  // clientNotification: ClientKafka;

  @Client(tripTCPMicroServiceConfig)
  tripTcpClient: ClientProxy;

  @Client(notificationTCPConfig)
  clientNotificationTCP: ClientProxy;

  // @Client(authKafkaMicroServiceConfig)
  // authKafkaClient: ClientKafka;

  @Client(authTCPMicroServiceConfig)
  authTcpClient: ClientProxy;

  @Client(paymentTCPConfig)
  clientPaymentTCP: ClientProxy;

  // @Client({
  //   ...captainKafkaConfig,
  //   options: {
  //     ...captainKafkaConfig.options,
  //     consumer: {
  //       ...captainKafkaConfig.options.consumer,
  //       groupId: 'captain-consumer-auth',
  //     }
  //   }
  // })
  // clientCaptainKafka: ClientKafka;
  @Client(captainTCPConfig)
  clientCaptain: ClientProxy;

  redisClient: RedisClient;
  getRedisKey: Function;

  onModuleInit() {
    // this.clientNotification.subscribeToResponseOf(GET_NOTIFICATIONS);
    // this.authKafkaClient.subscribeToResponseOf(GET_USER_DETAILS);
    // this.clientCaptainKafka.subscribeToResponseOf(CAPTAIN_DETAIL);
    try {
      this.redisClient = new RedisClient({
        host: appConfig().RedisHost,
        port: appConfig().RedisPort,
      });
      this.getRedisKey = promisify(this.redisClient.get).bind(this.redisClient);
    } catch (err) {
      this.logger.error(`redis catch err ${err?.message}`);
    }
  }

  async getAllLocationsWithInDesireTime() {
    try {
      this.logger.log(`[getAllLocationsWithInDesireTime] Inside service`);
      return await this.tripTcpClient
        .send(GET_ALL_ACTIVE_LOCATIONS, {})
        .pipe()
        .toPromise();
    } catch (e) {
      this.logger.error(
        `[getAllLocationsWithInDesireTime] -> Error in catch -> ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async sendSMTPEmailHandler() {
    try {
      this.logger.log(`[sendSMTPEmailHandler] Inside service`);

      return await this.mailerService.sendMail({
        to: '', // list of receivers
        from: 'dev.webelight@gmail.com', // sender address
        subject: 'Testing Nest MailerModule ✔', // Subject line
        text: 'welcome', // plaintext body
      });
    } catch (e) {
      this.logger.error(
        `[sendSMTPEmailHandler] -> Error in catch -> ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async fetchUserDetails(sessionId: string) {
    try {
      this.logger.log(
        `[fetchUserDetails] -> params : ${JSON.stringify(sessionId)}`,
      );

      // Fetch user details from e-wallet
      this.logger.log(`[fetchUserDetails] -> Fetch user details from E-wallet`);
      const userResponse = await this.authTcpClient
        .send(GET_USER_DETAILS, JSON.stringify({ sessionId, syncData: true }))
        .pipe()
        .toPromise();

      if (userResponse.statusCode !== HttpStatus.OK) {
        this.logger.error(
          `[fetchUserDetails] -> Error in Fetch user details from E-wallet ${JSON.stringify(
            userResponse,
          )}`,
        );
        throw new HttpException(
          userResponse?.message || errorMessage.SOMETHING_WENT_WRONG,
          userResponse.statusCode,
        );
      }

      this.logger.log(
        `[fetchUserDetails] -> Success ✔ in Fetch user details from E-wallet`,
      );
      const userDetails = userResponse.data;
      userDetails._timestamp = Date.now();

      // Check if user is captain or not
      this.logger.log(`[fetchUserDetails] -> Check if user is captain`);

      const isCaptain = await this.clientCaptain
        .send(
          CAPTAIN_DETAIL,
          JSON.stringify({ id: userDetails.id, data: { isFullDetail: true } }),
        )
        .pipe()
        .toPromise();
      if (
        isCaptain &&
        isCaptain.statusCode === HttpStatus.OK &&
        isCaptain.data?.id
      ) {
        userDetails.driverId = isCaptain.data.id;
        const driverInfo = JSON.stringify({
          userId: userDetails.id,
          captainId: isCaptain.data?.id,
          cabId: isCaptain.data?.cab?.id,
        });
        this.redisClient.mset([`driverUser-${userDetails.id}`, driverInfo]);
        this.logger.log(
          `[fetchUserDetails] -> Check if user is captain | User is a captain | Captain: ${userDetails.driverId}`,
        );
      } else {
        this.logger.warn(
          `[fetchUserDetails] -> Check if user is captain | User is not a captain`,
        );
      }

      // Set user details to Redis
      this.logger.log(`[fetchUserDetails] -> Set user details to Redis`);
      const hashKey = createHash('md5').update(sessionId).digest('hex');
      this.redisClient.set(
        `user-${hashKey}`,
        JSON.stringify(userDetails),
        function (err) {
          if (err) {
            Logger.error(
              `[fetchUserDetails] -> Set user details to Redis | Error: ${JSON.stringify(
                err,
              )}`,
            );
          }
        },
      );
      this.logger.log(
        `[fetchUserDetails] -> Set user details to Redis | Success ✔`,
      );

      return ResponseData.success(userDetails);
    } catch (e) {
      this.logger.error(`[fetchUserDetails] -> Error in catch -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getNotifications(
    externalId: string,
    params: PaginationCommonDto & GetNotificationsDto,
  ) {
    this.logger.log(
      `kafka::notifications::${GET_NOTIFICATIONS}::send -> ${JSON.stringify({
        externalId,
        params,
      })}`,
    );
    const info = await this.tripTcpClient
      .send(GET_CUSTOMER_DETAIL, JSON.stringify({ userId: externalId }))
      .pipe()
      .toPromise();
    params.userType = info?.data?.userType;
    return await this.clientNotificationTCP
      .send(GET_NOTIFICATIONS, JSON.stringify({ externalId, params }))
      .pipe()
      .toPromise();
  }

  async updateCustomer(body: UpdateCustomerDto) {
    //update customer info

    this.logger.log(
      `kafka::notifications::${UPSERT_CUSTOMER}::send -> ${JSON.stringify({
        body,
      })}`,
    );
    return await this.tripTcpClient
      .send(UPSERT_CUSTOMER, JSON.stringify({ ...body }))
      .pipe()
      .toPromise();
  }

  async updatePicture(params: UpdatePictureDto) {
    this.logger.log(
      `kafka::admin::${CUSTOMER_UPDATE_PICTURE}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(CUSTOMER_UPDATE_PICTURE, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getBalance(externalId: string) {
    this.logger.log(
      `kafka::notifications::${GET_BALANCE}::send -> ${JSON.stringify({
        externalId,
      })}`,
    );
    return await this.clientPaymentTCP
      .send(GET_BALANCE, JSON.stringify({ externalId: externalId }))
      .pipe()
      .toPromise();
  }

  async validateIban(param: { iban: string; externalId: string }) {
    this.logger.log(
      `kafka::notifications::${VALIDATE_IBAN}::send -> ${JSON.stringify({
        param,
      })}`,
    );
    return await this.clientCaptain
      .send(VALIDATE_IBAN, JSON.stringify({ param }))
      .pipe()
      .toPromise();
  }

  async customerKyc(param: customerKycDto) {
    this.logger.log(
      `kafka::notifications::${CUSTOMER_KYC}::send -> ${JSON.stringify({
        param,
      })}`,
    );
    return await this.authTcpClient
      .send(CUSTOMER_KYC, JSON.stringify({ param }))
      .pipe()
      .toPromise();
  }

  async getIban(param: { iban: string; externalId: string }) {
    this.logger.log(
      `kafka::notifications::${GET_IBAN}::send -> ${JSON.stringify({
        param,
      })}`,
    );
    return await this.clientCaptain
      .send(GET_IBAN, JSON.stringify({ param }))
      .pipe()
      .toPromise();
  }

  async userInfoForCustomerCare(param: { mobileNo: string }) {
    this.logger.log(
      `kafka::notifications::${GET_CUSTOMER_DETAIL}::send -> ${JSON.stringify({
        param,
      })}`,
    );

    const info = await this.tripTcpClient
      .send(GET_CUSTOMER_DETAIL, JSON.stringify({ ...param }))
      .pipe()
      .toPromise();
    info.statusCode = HttpStatus.OK;
    info.isCachedRespose = false;
    info.currentDateTime = new Date();
    if (info.statusCode == HttpStatus.OK && info?.data?.userId) {
      info.data = {
        id: info?.data?.userId || null,
        iqamaNumber: info?.data?.idNumber || null,
        registeredDate: info?.data?.createdAt || null,
        customerName: info?.data?.firstName
          ? `${info?.data?.firstName} ${info?.data?.lastName}`
          : null,
        email: info?.data?.email || null,
        mobile: info?.data?.mobileNo || null,
      };
      info.success = true;
      info.message = 'User fetch success';
    } else {
      info.data = null;
      info.success = false;
      info.message = 'User not found';
      info.errors = ['User not found'];
    }

    return info;
  }
  async kycStatusCheck(userId: string) {
    this.logger.log(
      `kafka::notifications::${GET_CUSTOMER_KYC_STATUS}::send -> ${userId}`,
    );

    return await this.tripTcpClient
      .send(GET_CUSTOMER_KYC_STATUS, JSON.stringify({ userId }))
      .pipe()
      .toPromise();
  }
  async topUpHistoryByUserId(params: ListSearchSortDto) {
    this.logger.log(
      `kafka::notifications::${GET_ALL_USER_TRANSACTIONS}::send -> ${JSON.stringify(
        {
          params,
        },
      )}`,
    );
    return await this.clientPaymentTCP
      .send(GET_ALL_USER_TRANSACTIONS, JSON.stringify(params))
      .pipe()
      .toPromise();
  }
  async HostedPaymentRequest(params: UpdateBalanceDto) {
    this.logger.log(
      `kafka::notifications::${CLICKPAY_HOSTED_TOP_UP}::send -> ${JSON.stringify(
        {
          params,
        },
      )}`,
    );
    return await this.clientPaymentTCP
      .send(CLICKPAY_HOSTED_TOP_UP, JSON.stringify({ ...params }))
      .pipe()
      .toPromise();
  }
  async clickPayCallBack(params: ClickPayCallBackResponseDto) {
    this.logger.log(
      `kafka::notifications::${CLICKPAY_CALLBACK}::send -> ${JSON.stringify({
        params,
      })}`,
    );
    return await this.clientPaymentTCP
      .send(CLICKPAY_CALLBACK, JSON.stringify({ ...params }))
      .pipe()
      .toPromise();
  }
}

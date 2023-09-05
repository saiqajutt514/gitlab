import {
  Injectable,
  Logger,
  HttpStatus,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import { plainToClass } from 'class-transformer';
import axios from 'axios';

//import { CAPTAIN_DETAIL, GET_USER_DETAILS, GET_NOTIFICATIONS, CREATE_CUSTOMER} from '.';

import { errorMessage } from 'src/constants/error-message-constant';
import { WalletApiDto, CarInfoDto } from './dto/walletapi.dto';

import { CustomerDto } from './dto/customer.dto';
import { ChatUserDto } from './dto/chatuser.dto';
import {
  tripMicroServiceConfig,
  chatMicroServiceConfig,
} from 'src/microServicesConfigs';
import {
  customerRequestPatterns,
  UPSERT_CUSTOMER,
  chatUserRequestPatterns,
  UPSERT_CHAT_USER,
  GET_CUSTOMER_DETAIL,
} from 'src/constants/kafka-constant';

import appConfig from 'config/appConfig';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { CarInfoResponseDto } from './dto/carinfo.dto';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { RedisHandler } from 'src/helpers/redis-handler';
import { decode } from 'jsonwebtoken';

import { tripTCPMicroServiceConfig } from 'src/microServicesConfigs/trip.microservice.config';

var jwt = require('jsonwebtoken');

@Injectable()
export class EwalletService implements OnModuleInit {
  private readonly logger = new LoggerHandler(
    EwalletService.name,
  ).getInstance();

  constructor(
    @Inject('CLIENT_TRIP_SERVICE_KAFKA') private clientTrip: ClientKafka,
    @Inject('CLIENT_CHAT_SERVICE_KAFKA') private clientChat: ClientKafka,
    @Inject('CLIENT_TRIP_SERVICE_TCP') private tripTcpClient: ClientProxy,
    private redisHandler: RedisHandler,
  ) {}

  onModuleInit() {}
  async getUserDetail(params: WalletApiDto) {
    try {
      // const apiUrl = `${appConfig().eWalletApiUrl}/private/user-info/customer`;
      // const authCredentials = `${appConfig().eWalletUsername}:${
      //   appConfig().eWalletPassword
      // }`;
      // const authToken = Buffer.from(authCredentials).toString('base64');
      // const apiHeaders = {
      //   sessionId: params.sessionId,
      //   channelId: appConfig().eWalletChannel,
      //   Authorization: `Basic ${authToken}`,
      // };

      // this.logger.log(`[getUserDetail] -> Request URL: ${apiUrl}`);
      // this.logger.log(
      //   `[getUserDetail] -> Request Headers: ${JSON.stringify(apiHeaders)}`,
      // );

      let apiResponse;

      try {
        console.log('jwt area');
        const jwtData = await jwt.verify(
          params.sessionId,
          appConfig().jwtSecretKey,
          function (err, decoded) {
            console.log(err);
            console.log(decoded);
            return decoded?.data;
          },
        );
        if (jwtData?.mobileNo) {
          jwtData.userId = params.userId;
          const userDetailsFromDB = await this.tripTcpClient
            .send('get-customer-detail', JSON.stringify(jwtData))
            .pipe()
            .toPromise();
          if (userDetailsFromDB.statusCode == 200) {
            apiResponse = {
              status: HttpStatus.OK,
              data: {
                ...userDetailsFromDB.data,
                id: {
                  id: userDetailsFromDB?.data?.userId,
                  status: 'A',
                  authStatus: 'A',
                },
              },
            };
          } else {
            this.logger.error('[getUserDetail] -> User not found');
            throw new Error(errorMessage.USER_NOT_EXIST);
          }
        }
      } catch (err) {
        console.log('JWT Exception');
        let sCode = HttpStatus.UNAUTHORIZED;
        let sMessage = 'Unauthorized';
        this.logger.error(
          `exception -> ${JSON.stringify({
            name: err.name,
            message: err.message,
          })}`,
        );
        sCode = HttpStatus.UNAUTHORIZED;

        if (err.name == jwt.JsonWebTokenError.name) {
          sMessage = 'Invalid token';
        } else if (err.name == jwt.TokenExpiredError.name) {
          sMessage = 'Token expired. Please login again';
        } else if (jwt.NotBeforeError.name == err.name) {
          sMessage = err.message;
        }
        //Admin module capabilities checked
        if (err?.status === HttpStatus.FORBIDDEN) {
          sCode = HttpStatus.FORBIDDEN;
          sMessage = err.message;
        }
        return ResponseHandler.error(sCode, sMessage);
      }

      if (
        !apiResponse ||
        apiResponse.status !==
          HttpStatus.OK /*|| apiResponse?.statusCode !== HttpStatus.OK*/
      ) {
        this.logger.error(
          '[getUserDetail] -> Error while getting user details from e-wallet',
        );
        throw new Error(errorMessage.SOMETHING_WENT_WRONG);
      }
      this.logger.log(
        '[getUserDetail] -> Success ✔ while getting user details from e-wallet',
      );
      // console.log(apiResponse)
      const customerData: CustomerDto = plainToClass(
        CustomerDto,
        apiResponse?.data,
        { excludeExtraneousValues: true },
      );
      customerData.userId = apiResponse?.data?.id?.id;
      customerData.userStatus = apiResponse?.data?.id?.status;
      customerData.authStatus = apiResponse?.data?.id?.authStatus;
      customerData.profileImage = apiResponse?.data?.imageUrl;

      // customerData.userId = apiResponse?.data?.userId;
      // customerData.userStatus = apiResponse?.data.userStatus;
      // // customerData.authStatus = apiResponse?.data?.id?.authStatus;
      // customerData.profileImage = apiResponse?.data?.profileImage;

      let driverInfo = JSON.parse(
        await this.redisHandler.getRedisKey(
          `driverUser-${customerData.userId}`,
        ),
      );
      if (driverInfo) {
        customerData.driverId = driverInfo.captainId;
        customerData.userType = 2;
        customerData.cabId = driverInfo.cabId;
      }

      if (params.syncData) {
        this.logger.log(
          '[getUserDetail] -> ------ sending data to trip customer service ------',
        );
        this.clientTrip.emit(UPSERT_CUSTOMER, JSON.stringify(customerData));
        this.logger.log(
          '[getUserDetail] -> ------ completed saving of trip customer service ------',
        );
      }

      const chatUserData: ChatUserDto = plainToClass(
        ChatUserDto,
        apiResponse?.data,
        { excludeExtraneousValues: true },
      );
      chatUserData.userId = apiResponse?.data?.id?.id;
      chatUserData.profileImage = apiResponse?.data?.imageUrl;

      this.logger.log(
        '[getUserDetail] -> ------ sending data to chat service ------',
      );
      this.clientChat.emit(UPSERT_CHAT_USER, JSON.stringify(chatUserData));
      this.logger.log(
        '[getUserDetail] -> ------ completed saving of chat service ------',
      );

      if (params.returnRaw /* || ture apiResponse*/) {
        return ResponseHandler.success(apiResponse?.data);
      } else {
        const otherDetailsJSON = apiResponse?.data?.otherDetails;
        let DobHijri;

        if (otherDetailsJSON) {
          const otherDetails = JSON.parse(otherDetailsJSON);
          DobHijri = otherDetails?.DobHijri;
        }

        return ResponseHandler.success({
          id: String(apiResponse?.data?.id?.id),
          firstName: apiResponse?.data?.firstName,
          lastName: apiResponse?.data?.lastName,
          mobileNo: apiResponse?.data?.mobileNo,
          emailId: apiResponse?.data?.emailId,
          dateOfBirth: apiResponse?.data?.dateOfBirth,
          profileImage: apiResponse?.data?.imageUrl,
          prefferedLanguage: apiResponse?.data?.prefferedLanguage,
          DobHijri: DobHijri || null,
        });
      }
    } catch (err) {
      this.logger.error(`[getUserDetail] -> Error in catch: ${err.message}`);

      if (axios.isAxiosError(err)) {
        this.logger.error(
          `[getUserDetail] -> Error in catch | e-wallet API message: ${JSON.stringify(
            err.response?.data?.message,
          )}`,
        );

        return ResponseHandler.error(
          err.response?.status || HttpStatus.BAD_REQUEST,
          err.response?.data?.message || errorMessage.SOMETHING_WENT_WRONG,
        );
      }

      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCarInfo(params: WalletApiDto & CarInfoDto) {
    try {
      const apiUrl = `${appConfig().eWalletApiUrl}/private/carInfo/getCarInfo`;
      const authCredentails = `${appConfig().eWalletUsername}:${
        appConfig().eWalletPassword
      }`;
      const authToken = Buffer.from(authCredentails).toString('base64');
      const apiHeaders = {
        sessionId: params.sessionId,
        channelId: appConfig().eWalletChannel,
        Authorization: `Basic ${authToken}`,
      };
      const apiParams = { sequenceNumber: params.sequenceNumber };

      this.logger.log(
        '[getCarInfo] Sending data to e-wallet for getCarInfo API:' +
          apiUrl +
          ' for :' +
          params.sequenceNumber,
      );
      this.logger.debug(
        '[getCarInfo] apiHeaders:' + JSON.stringify(apiHeaders),
      );
      this.logger.debug('[getCarInfo] apiParams:' + JSON.stringify(apiParams));

      const apiResponse = await axios.post(apiUrl, apiParams, {
        headers: apiHeaders,
      });
      if (apiResponse && apiResponse.data?.code !== HttpStatus.OK) {
        this.logger.log(
          '[getCarInfo] Response:' + JSON.stringify(apiResponse.data),
        );
        const carInfoDetail: CarInfoResponseDto = plainToClass(
          CarInfoResponseDto,
          apiResponse.data?.vehicleInfo,
          { excludeExtraneousValues: true },
        );
        return ResponseHandler.success(carInfoDetail);
      } else {
        this.logger.error('[getCarInfo] Error Response message:');
        this.logger.error('[getCarInfo] Error Response:');
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }

      // return axios.post(apiUrl, apiParams, { headers: apiHeaders }).then((res) => {
      //   this.logger.log('[getCarInfo] Response:' + JSON.stringify(res.data))
      //   if (res.data?.success === true && res.data?.code === 200) {
      //     const carInfoDetail: CarInfoResponseDto = plainToClass(CarInfoResponseDto, res.data?.vehicleInfo, { excludeExtraneousValues: true })
      //     return ResponseHandler.success(carInfoDetail)
      //   } else {
      //     return ResponseHandler.error(HttpStatus.BAD_REQUEST, res.data?.message || errorMessage.SOMETHING_WENT_WRONG)
      //   }
      // }).catch((err) => {
      //   this.logger.error('[getCarInfo] Error Response message:' + err?.message)
      //   this.logger.error('[getCarInfo] Error Response:' + err?.response)
      //   return ResponseHandler.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG)
      // });
    } catch (err) {
      this.logger.error(
        `[getCarInfo] e-wallet API error: ${JSON.stringify(err.message)}`,
      );
      if (axios.isAxiosError(err)) {
        this.logger.error(
          `[getCarInfo] e-wallet API message: ${JSON.stringify(
            err.response?.data?.message,
          )}`,
        );
        return ResponseHandler.error(
          err.response?.status || HttpStatus.BAD_REQUEST,
          err.response?.data?.message || errorMessage.SOMETHING_WENT_WRONG,
        );
      } else {
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    }
  }
}

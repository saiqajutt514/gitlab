import {
  BadGatewayException,
  HttpStatus,
  Injectable,
  Logger,
  HttpException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ClientKafka, Client, ClientProxy } from '@nestjs/microservices';
import {
  tripKafkaMicroServiceConfig,
  tripTCPMicroServiceConfig,
} from 'src/microServiceConfigs';
import { TripDestinationDto } from './dto/trip-destination.dto';
import {
  CabCalcParams,
  CabIdDto,
  DistanceDto,
  TimeDto,
} from './dto/estimate-cost.dto';
import {
  DeclineReasonDto,
  DriverTripRejectCancelDto,
  RiderTripCancelDto,
} from './dto/trip-cancel-reject.dto';
import { TripScheduleRiderDto } from './dto/trip-schedule-rider.dto';
import { TripStartedBodyDto } from './dto/trip-started.dto';
import {
  ScheduleTripsCreateDTO,
  TripIdParamDto,
  TripsCreateDTO,
  TripUploadPhotoDto,
} from './dto/trips.dto';
import {
  DriverIdDto,
  DriverIdParam,
  RiderIdDto,
  SessionIdDto,
} from './dto/user.dto';
import { CreateEmergencyRequestDto } from './dto/trip-emergency-request.dto';
import {
  KafkaTripRequestPatterns,
  CREATE_TRIP,
  CREATE_SCHEDULE_TRIP,
  CONFIRM_SCHEDULE_TRIP,
  DECLINE_SCHEDULE_TRIP,
  DRIVER_COMPLETED_TRIPS,
  RIDER_COMPLETED_TRIPS,
  GET_ALL_RIDER_TRIPS,
  GET_ALL_DRIVER_TRIPS,
  DRIVER_CANCELLED_TRIPS,
  TRIP_DETAIL_BY_ID,
  DRIVER_REACHED,
  DRIVER_ACCEPTS_TRIP,
  DRIVER_REJECTS_TRIP,
  DRIVER_CANCELS_TRIP,
  RIDER_CANCELS_TRIP,
  TRIP_STARTED,
  TRIP_COMPLETED,
  CHANGE_TRIP_DESTINATION,
  RIDER_CANCELLED_TRIPS,
  TRIP_ESTIMATE_COST,
  GET_RIDER_FUTURE_TRIPS,
  RIDER_RECENT_ADDRESS,
  UPLOAD_TRIP_PHOTO,
  TRIP_DETAIL,
  ACCEPT_TRIP_WITH_ALL_CABS,
  DECLINE_TRIP_WITH_ALL_CABS,
  RIDER_CANCELS_BOOKING,
  CHECK_TRIP_DETAIL,
  ADD_EMERGENCY_REQUEST,
  TRIP_INVOICE_BY_ID,
  GET_LIST_OF_USERS_IN_THIS_ZONE,
} from './kafka-constants';
import { RedisHandler } from 'src/helpers/redis-handler';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { Request } from 'express';

import { errorMessage } from '../../constants/error-message-constant';
import { successMessage } from '../../constants/success-message-constant';

import { UserService } from '../user/user.service';

require('dotenv').config();

@Injectable()
export class TripsService {
  constructor(
    private redisHandler: RedisHandler,
    private userService?: UserService,
  ) {}

  private readonly logger = new LoggerHandler(TripsService.name).getInstance();

  // @Client({
  //   ...tripKafkaMicroServiceConfig,
  //   options: {
  //     ...tripKafkaMicroServiceConfig.options,
  //     consumer: {
  //       groupId: 'trip-consumer-agtrip',
  //     }
  //   }
  // })
  // tripKafkaClient: ClientKafka;

  @Client(tripTCPMicroServiceConfig)
  tripTcpClient: ClientProxy;

  onModuleInit() {
    // KafkaTripRequestPatterns.forEach(pattern => {
    //   this.tripKafkaClient.subscribeToResponseOf(pattern);
    // });
  }

  async getRiderFutureTrips(param: RiderIdDto) {
    return await this.tripTcpClient
      .send(GET_RIDER_FUTURE_TRIPS, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async getRecentAddresses(param: RiderIdDto) {
    return await this.tripTcpClient
      .send(RIDER_RECENT_ADDRESS, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async getAllTripsOfRider(param: RiderIdDto) {
    return await this.tripTcpClient
      .send(GET_ALL_RIDER_TRIPS, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async getAllTripsOfDriver(param: DriverIdDto) {
    return await this.tripTcpClient
      .send(GET_ALL_DRIVER_TRIPS, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async getCancelledTripsByRider(param: RiderIdDto) {
    return await this.tripTcpClient
      .send(RIDER_CANCELLED_TRIPS, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async getCancelledTripsByDriver(param: DriverIdDto) {
    return await this.tripTcpClient
      .send(DRIVER_CANCELLED_TRIPS, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async checkTripExists(param: RiderIdDto & DriverIdParam) {
    try {
      let finalResponse;

      // Check for driver trip exists from REDIS
      // let scanList, scanRecord, scanObject;
      // const tripDriverKey = `*-trip-${param.riderId}`;
      // scanList = await this.redisHandler.getMatchedClients(tripDriverKey);
      // Logger.log(
      //   `tripDriverKey : ${tripDriverKey} | scanList length : ${JSON.stringify(
      //     scanList,
      //   )}`,
      // );
      // if (scanList.length > 0 && scanList[0]) {
      //   scanRecord = await this.redisHandler.getRedisKey(scanList[0]);
      //   scanObject = JSON.parse(scanRecord);
      //   Logger.log(`checking for tripId : ${scanObject?.tripId}`);
      //   if (scanObject?.tripId) {
      //     finalResponse = {
      //       statusCode: HttpStatus.OK,
      //       data: {
      //         tripId: scanObject.tripId,
      //         userType: 'driver',
      //       },
      //     };
      //   }
      // }

      // // Check for rider trip exists from REDIS
      // if (!finalResponse?.statusCode) {
      //   const tripRiderKey = `${param.riderId}-trip-*`;
      //   scanList = await this.redisHandler.getMatchedClients(tripRiderKey);
      //   Logger.log(
      //     `tripRiderKey : ${tripRiderKey} | scanList length : ${JSON.stringify(
      //       scanList,
      //     )}`,
      //   );
      //   if (scanList.length > 0 && scanList[0]) {
      //     scanRecord = await this.redisHandler.getRedisKey(scanList[0]);
      //     scanObject = JSON.parse(scanRecord);
      //     Logger.log(`checking for tripId : ${scanObject?.tripId}`);
      //     if (scanObject?.tripId) {
      //       finalResponse = {
      //         statusCode: HttpStatus.OK,
      //         data: {
      //           tripId: scanObject.tripId,
      //           userType: 'rider',
      //         },
      //       };
      //     }
      //   }
      // }

      if (!finalResponse?.statusCode) {
        finalResponse = await this.tripTcpClient
          .send(CHECK_TRIP_DETAIL, JSON.stringify(param))
          .pipe()
          .toPromise();
      }
      return finalResponse;
    } catch (err) {
      return false;
    }
  }

  async getTripDetailById(param: TripIdParamDto) {
    return await this.tripTcpClient
      .send(TRIP_DETAIL_BY_ID, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async getTripInvoiceById(param: TripIdParamDto) {
    return await this.tripTcpClient
      .send(TRIP_INVOICE_BY_ID, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async getSocketTripDetailById(param: TripIdParamDto & DriverIdParam) {
    return await this.tripTcpClient
      .send(TRIP_DETAIL, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async getCompletedTripsByRider(param: RiderIdDto) {
    return await this.tripTcpClient
      .send(RIDER_COMPLETED_TRIPS, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async getCompletedTripsByDriver(param: DriverIdDto) {
    return await this.tripTcpClient
      .send(DRIVER_COMPLETED_TRIPS, JSON.stringify(param))
      .pipe()
      .toPromise();
  }

  async createTrip(body: TripsCreateDTO, riderId: string) {
    const { addresses } = body;
    const addTypes = addresses.map((address) => address.addressType);
    if (addTypes[0] === addTypes[1]) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Pick up and Drop off address should be different',
      };
    }
    return await this.tripTcpClient
      .send(CREATE_TRIP, JSON.stringify({ ...body, riderId }))
      .pipe()
      .toPromise();
  }

  async createScheduleTip(body: ScheduleTripsCreateDTO, riderId: string) {
    return await this.tripTcpClient
      .send(CREATE_SCHEDULE_TRIP, JSON.stringify({ ...body, riderId }))
      .pipe()
      .toPromise();
  }

  async acceptTripWithAllCabs(tripId: string, riderId: string) {
    return await this.tripTcpClient
      .send(ACCEPT_TRIP_WITH_ALL_CABS, JSON.stringify({ tripId, riderId }))
      .pipe()
      .toPromise();
  }

  async declineTripWithAllCabs(tripId: string, riderId: string) {
    return await this.tripTcpClient
      .send(DECLINE_TRIP_WITH_ALL_CABS, JSON.stringify({ tripId, riderId }))
      .pipe()
      .toPromise();
  }

  async confirmScheduleTip(body: TripScheduleRiderDto) {
    return await this.tripTcpClient
      .send(CONFIRM_SCHEDULE_TRIP, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async declineScheduleTrip(body: TripScheduleRiderDto) {
    return await this.tripTcpClient
      .send(DECLINE_SCHEDULE_TRIP, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async driverReachedAtPickUpPoint(body: TripIdParamDto & DriverIdDto) {
    return await this.tripTcpClient
      .send(DRIVER_REACHED, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async tripAcceptedByDriver(
    body: DriverIdDto & TripIdParamDto & SessionIdDto,
  ) {
    return await this.tripTcpClient
      .send(DRIVER_ACCEPTS_TRIP, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async tripRejectedByDriver(body: TripIdParamDto & DriverTripRejectCancelDto) {
    return await this.tripTcpClient
      .send(DRIVER_REJECTS_TRIP, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async tripCancelledByDriver(
    body: TripIdParamDto & DriverTripRejectCancelDto & SessionIdDto,
  ) {
    return await this.tripTcpClient
      .send(DRIVER_CANCELS_TRIP, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async tripCancelledByRider(
    body: TripIdParamDto & RiderIdDto & RiderTripCancelDto,
  ) {
    return await this.tripTcpClient
      .send(RIDER_CANCELS_TRIP, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async tripReqCancelByRider(body: TripIdParamDto & RiderIdDto) {
    return await this.tripTcpClient
      .send(RIDER_CANCELS_BOOKING, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async tripStartedByDriver(
    body: TripIdParamDto & TripStartedBodyDto & DriverIdDto,
  ) {
    return await this.tripTcpClient
      .send(TRIP_STARTED, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async changeTripDestination(
    body: TripIdParamDto & TripDestinationDto & RiderIdDto & SessionIdDto,
  ) {
    return await this.tripTcpClient
      .send(CHANGE_TRIP_DESTINATION, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async tripCompleted(
    body: TripIdParamDto & DriverIdDto & TripDestinationDto & SessionIdDto,
  ) {
    return await this.tripTcpClient
      .send(TRIP_COMPLETED, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async estimateFareAmount(
    body: CabIdDto & DistanceDto & TimeDto & CabCalcParams,
  ) {
    return await this.tripTcpClient
      .send(TRIP_ESTIMATE_COST, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async syncCustomerDetails(request: Request) {
    try {
      const sessionHeader = request.headers.sessionid;
      const sessionId = sessionHeader as string;

      if (!sessionId) {
        this.logger.error('[syncCustomerDetails] -> No session header found.');
        throw new HttpException(
          errorMessage.UNAUTHORIZED,
          HttpStatus.UNAUTHORIZED,
        );
      }
      this.logger.log(
        `[syncCustomerDetails] For sessionId: -> ${JSON.stringify(sessionId)}`,
      );

      const userDetailsRes: any = await this.userService.fetchUserDetails(
        sessionId,
      );
      if (userDetailsRes && userDetailsRes.statusCode !== HttpStatus.OK) {
        this.logger.error(
          `[AuthMiddleware] -> Error from E-wallet: ${JSON.stringify(
            userDetailsRes,
          )}`,
        );
        throw new HttpException(
          userDetailsRes.message,
          userDetailsRes.statusCode,
        );
      }

      return ResponseHandler({
        statusCode: HttpStatus.OK,
        message: successMessage.CUSTOMER_DETAILS_SYNCED,
      });
    } catch (e) {
      this.logger.error(
        `[syncCustomerDetails] has error: ${JSON.stringify(e.message)}`,
      );
      throw new HttpException(
        e.message || errorMessage.SOMETHING_WENT_WRONG,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async uploadTripPhoto(body: TripIdParamDto & TripUploadPhotoDto) {
    return await this.tripTcpClient
      .send(UPLOAD_TRIP_PHOTO, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async createEmergencyRequest(body: CreateEmergencyRequestDto) {
    this.logger.log(
      `kafka::trip::${ADD_EMERGENCY_REQUEST}::send -> ${JSON.stringify(body)}`,
    );
    try {
      return await this.tripTcpClient
        .send(ADD_EMERGENCY_REQUEST, JSON.stringify(body))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async highDemandZones(userId) {
    try {
      return await this.tripTcpClient
        .send(GET_LIST_OF_USERS_IN_THIS_ZONE, JSON.stringify(userId))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
}

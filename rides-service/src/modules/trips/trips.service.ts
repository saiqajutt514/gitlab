import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { In, IsNull, Raw, Brackets, FindOneOptions, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';

import * as moment from 'moment';

import {
  TripsCreateDTO,
  ScheduleTripsCreateDTO,
  TripsUpdateDTO,
  TripDeclinedDTO,
  TripIdParamDto,
  TripUploadPhotoDto,
  AdminModeDTO,
} from './dto/trips.dto';
import { TripStartedBodyDto } from './dto/trip-started.dto';
import { SaveReviewDto } from './dto/save-review.dto';
import {
  applicableFor,
  PromoCodeDto,
  RevertPromoCodeDto,
} from './dto/promo-code.dto';
import { FindNearestDriversDto } from './dto/find-nearest-drivers.dto';
import { TripScheduleRiderDto } from './dto/trip-schedule-rider.dto';
import {
  DriverIdDto,
  RiderIdDto,
  SessionIdDto,
  AdminIdDto,
} from './dto/user.dto';
import {
  DriverTripRejectCancelDto,
  RiderTripCancelDto,
  AdminTripCancelDto,
} from './dto/trip-cancel-reject.dto';

import {
  PromoCodeAction,
  PromoCodeResponse,
  PromoCodeTopic,
  TransactionStatus,
  TripStatus,
  TripPreviousStatus,
  TripType,
  TripsListingSort,
  SUBSCRIPTION_STATUS,
  TripCreatedBy,
  TripsAction,
  TripUserType,
} from './trips.enum';
import { AddressType } from '../trip_address/trip_address.enum';
import {
  TRIP_IMAGE_BY,
  TRIP_PHOTO_ACTION,
} from '../trip_images/trip_images.enum';
import {
  TripDriverStatus,
  TripDriverRequestedStatus,
} from '../trip_drivers/enum/trip_drivers.enum';
import { ReviewExternalType, UserExternalType } from './enums/driver.enum';

import { ResponseData } from 'src/helpers/responseHandler';
import { errorMessage } from 'src/constants/errorMessage';
import { successMessage } from 'src/constants/successMessage';
import {
  getTimestamp,
  getTimeDifference,
  getIsoDateTime,
  getTotalMinutes,
  getCalculatedTripTime,
} from '../../utils/get-timestamp';
import { getOTP } from 'src/utils/generate-otp';

import { TripsEntity } from './entities/trips.entity';
import { TripsRepository } from './trips.repository';
import {
  DistanceResponseInterface,
  LocationInterface,
  ListSearchSortDto,
  TripChangeDestinationInterface,
  TripDetailFormat,
  StatsParams,
  DriverIdInterface,
  TripDetailDriverInfo,
  TripDetailRiderInfo,
  TripDetailCabInfo,
  AmountCalcParams,
  TripEstimatedCostForAdmin,
  TripAmountCalcParams,
  CabCalcParams,
  CabFareParams,
  TripEstimatedCostForSocket,
  tripFees,
} from './interface/trips.interface';
import {
  RiderTripCompletedEmailDto,
  DriverTripCompletedEmailDto,
} from './dto/email.dto';
import { TripDriversService } from '../trip_drivers/trip_drivers.service';
import { TripDriver } from '../trip_drivers/entities/trip_driver.entity';
import { RemainingChargesRepository } from './remaining-trips.repository';
import { TripAddressRepository } from '../trip_address/trip_address.repository';
import { TripImagesRepository } from '../trip_images/trip_images.repository';
import { CustomerRepository } from '../customer/customer.repository';
import { CustomerService } from '../customer/customer.service';

import {
  socketMicroServiceConfig,
  captainKafkaConfig,
  promoCodesKafkaMicroServiceConfig,
  promoCodesTCPMicroServiceConfig,
  reviewsKafkaConfig,
  notificationKafkaConfig,
  paymentKafkaConfig,
  captainTCPConfig,
  paymentTCPConfig,
  reviewsTCPConfig,
} from 'src/microServicesConfigs';

import {
  captainPatterns,
  CAPTAIN_DETAIL,
  FIND_NEAREST_DRIVERS,
  GET_CAB_TYPE_DETAIL,
  WASL_TRIP_CHECK,
  reviewsPatterns,
  GET_REVIEWS,
  CREATE_REVIEW,
  GET_META_REVIEWS,
  GET_META_REVIEW_BY_EXTERNAL,
  paymentPatterns,
  BLOCK_TRIP_AMOUNT,
  UPDATE_TRIP_AMOUNT,
  RELEASE_TRIP_AMOUNT,
  CONFIRM_TRIP_AMOUNT,
  promoCodePatterns,
  NOTIFY_TRIP_DETAIL,
  SEND_EMAIL_NOTIFICATION,
  SEND_PUSH_NOTIFICATION,
  SEND_SMS_NOTIFICATION,
  GET_USER_SUBSCRIPTION_DETAIL,
  UPDATE_USER_SUBSCRIPTION,
  ADD_SUBSCRIPTION_TRANSACTION,
  DASHBOARD_ACTIVE_DRIVERS,
  CHANGE_DRIVER_AVAILABILITY,
  GET_DRIVER_MODE,
  EMIT_TO_ADMIN_DASHBOARD,
  GET_INVOICE_QR,
  GET_BALANCE,
} from './constants/kafka-constants';
import {
  NEW_TRIP_CREATED,
  TRIP_STATUS_CHANGED,
} from './constants/socket-constants';
import {
  HoldParams,
  HoldConfirmParams,
  HoldUpdateParams,
} from './interface/payment.interface';
import { AwsS3Service } from 'src/helpers/aws-s3-service';
import { TripImagesEntity } from '../trip_images/trip_images.entity';
import {
  getDateBounds,
  getDateOfWeek,
  getDateRange,
  getGraphLabel,
  getPrevBounds,
  matchGraphDate,
  getDayPart,
  formatAMPM,
  formatDate,
} from 'src/helpers/date-functions';
import { LoggerHandler } from 'src/helpers/logger.handler';
import {
  calculateFareDistance,
  fetchLocationDetail,
  getDirectionBasedDistance,
} from 'src/helpers/googleDistanceCalculation';
import {
  getTripNumber,
  setTripNumber,
  getTripInvoiceNumber,
} from 'src/utils/generate-trn';
// import { ReviewsService } from '../reviews/reviews.service';
import { RedisHandler } from 'src/helpers/redis-handler';
import {
  getAmountFormatted,
  getPercentageFormatted,
} from 'src/helpers/amount-formatter';
import { TripDetailSocket } from './dto/trip-detail-socket.dto';
import { plainToClass } from 'class-transformer';
import { PendingTripDriver } from '../trip_drivers/dto/trip_driver.dto';
import { PickType } from '@nestjs/mapped-types';
import { from } from 'rxjs';
import { TripLocationRepository } from './trip_locations.repository';

@Injectable()
export class TripsService implements OnModuleInit {
  private customLogger = new LoggerHandler(TripsService.name).getInstance();
  constructor(
    @InjectRepository(TripsRepository)
    private tripsRepository: TripsRepository,
    @InjectRepository(TripAddressRepository)
    private tripAddressRepository: TripAddressRepository,
    @InjectRepository(TripImagesRepository)
    private tripImagesRepository: TripImagesRepository,
    @InjectRepository(RemainingChargesRepository)
    private remainingChargesRepository: RemainingChargesRepository,
    @InjectRepository(CustomerRepository)
    private customerRepository: CustomerRepository,
    private tripDriversService: TripDriversService,
    private readonly awsS3Service: AwsS3Service,
    private redisHandler: RedisHandler,
    @Inject('CLIENT_REVIEW_SERVICE_TCP') private clientReviewTCP: ClientProxy,
    @Inject('CLIENT_CAPTAIN_SERVICE_KAFKA')
    private clientCaptainKafka: ClientKafka,
    @Inject('CLIENT_CAPTAIN_SERVICE_TCP') private clientCaptainTCP: ClientProxy,
    @Inject('CLIENT_PAYMENT_SERVICE_TCP') private clientPaymentTCP: ClientProxy,
    @Inject('CLIENT_NOTIFY_SERVICE_KAFKA')
    private clientNotification: ClientKafka,
    @Inject('CLIENT_SOCKET_SERVICE_KAFKA') private socketGateway: ClientKafka,

    @Inject('CLIENT_SOCKET_SERVICE_TCP') private clientSocketTCP: ClientProxy,
    @Inject('CLIENT_PROMO_SERVICE_KAFKA') private clientPromoCode: ClientKafka,
    @Inject('CLIENT_PROMO_SERVICE_TCP')
    private promoCodesTcpClient: ClientProxy,
    @InjectRepository(TripLocationRepository)
    private tripLocationRepository: TripLocationRepository,
    // private reviewService: ReviewsService,
    private customerService?: CustomerService,
  ) {
    promoCodePatterns.forEach((pattern) => {
      this.clientPromoCode.subscribeToResponseOf(pattern);
    });
  }

  private readonly ewalletStatusCheck = true; // false/true - Temporary false, Always true

  // @Client({
  //   ...reviewsKafkaConfig,
  //   options: {
  //     ...reviewsKafkaConfig.options,
  //     consumer: {
  //       groupId: 'reviews-consumer-ts-trip',
  //     }
  //   }
  // })
  // clientReviewKafka: ClientKafka;

  // @Client(captainKafkaConfig)
  // clientCaptainKafka: ClientKafka;

  // @Client(promoCodesKafkaMicroServiceConfig)
  // promoCodesKafkaClient: ClientKafka;

  // @Client(promoCodesTCPMicroServiceConfig)
  // promoCodesTcpClient: ClientProxy;

  // @Client(socketMicroServiceConfig)
  // socketGateway: ClientKafka;

  // @Client(notificationKafkaConfig)
  // clientNotification: ClientKafka;

  // @Client(paymentKafkaConfig)
  // paymentGateway: ClientKafka;

  onModuleInit() {
    // promoCodePatterns.forEach(pattern => {
    //   this.promoCodesKafkaClient.subscribeToResponseOf(pattern)
    // });
    // reviewsPatterns.forEach(pattern => {
    //   this.clientReviewKafka.subscribeToResponseOf(pattern)
    // });
    // captainPatterns.forEach(pattern => {
    //   this.clientCaptainKafka.subscribeToResponseOf(pattern);
    // });
    // paymentPatterns.forEach(pattern => {
    //   this.paymentGateway.subscribeToResponseOf(pattern);
    // });
  }

  async findAll(params: ListSearchSortDto) {
    try {
      this.customLogger.log(`[findAll] params: ${JSON.stringify(params)}`);

      const fields = [
        'trips.id',
        'trips.tripNo',
        'trips.createdAt',
        'trips.tripBaseAmount',
        'trips.riderAmount',
        'trips.promoCodeAmount',
        'trips.waitingCharge',
        'trips.taxAmount',
        'trips.promoCode',
        'trips.status',
        'trips.tripType',
        'trips.driverReviewId',
        'trips.riderReviewId',
        'trips.taxPercentage',
        'trips.motAmount',
        'driver.driverId',
        'driver.userId',
        'driver.firstName',
        'driver.lastName',
        'driver.arabicFirstName',
        'driver.arabicLastName',
        'driver.mobileNo',
        'rider.id',
        'rider.userId',
        'rider.firstName',
        'rider.lastName',
        'rider.arabicFirstName',
        'rider.arabicLastName',
        'rider.mobileNo',
        'pickup.address',
        'pickup.addressType',
        'pickup.latitude',
        'pickup.longitude',
        'dropoff.address',
        'dropoff.addressType',
        'dropoff.latitude',
        'dropoff.longitude',
        'destination.address',
        'destination.addressType',
        'destination.latitude',
        'destination.longitude',
      ];
      const tripsQryInstance = this.tripsRepository.createQueryBuilder('trips');
      tripsQryInstance.select(fields);
      tripsQryInstance.innerJoin('trips.rider', 'rider');
      tripsQryInstance.leftJoin('trips.driver', 'driver');
      tripsQryInstance.leftJoin(
        'trips.pickup',
        'pickup',
        'pickup.addressType = :pickupType',
        { pickupType: AddressType.PICK_UP },
      );
      tripsQryInstance.leftJoin(
        'trips.dropoff',
        'dropoff',
        'dropoff.addressType = :dropoffType',
        { dropoffType: AddressType.DROP_OFF },
      );
      tripsQryInstance.leftJoin(
        'trips.destination',
        'destination',
        'destination.addressType = :destinationType',
        { destinationType: AddressType.DESTINATION },
      );
      //Admin Filters
      if (typeof params?.filters?.status === 'number') {
        tripsQryInstance.where('trips.status = :status', {
          status: params?.filters?.status,
        });
      } else {
        tripsQryInstance.where('trips.status IN (:...status)', {
          status: [
            TripStatus.PENDING,
            TripStatus.NO_DRIVER,
            TripStatus.REJECTED_BY_DRIVER,
            TripStatus.ACCEPTED_BY_DRIVER,
            TripStatus.CANCELLED_BY_DRIVER,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.CANCELLED_BY_ADMIN,
            TripStatus.DRIVER_ARRIVED,
            TripStatus.STARTED,
            TripStatus.COMPLETED,
          ],
        });
      }
      if (params?.filters?.tripNo) {
        tripsQryInstance.andWhere('trips.tripNo = :tripNo', {
          tripNo: setTripNumber(params?.filters?.tripNo),
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        tripsQryInstance.andWhere('trips.createdAt >= :fromDate', { fromDate });
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
        tripsQryInstance.andWhere('trips.createdAt <= :toDate', { toDate });
      }
      if (params?.filters?.tripBaseAmount) {
        tripsQryInstance.andWhere('trips.tripBaseAmount = :tripBaseAmount', {
          tripBaseAmount: params?.filters?.tripBaseAmount,
        });
      }
      if (params?.filters?.driverAmount) {
        tripsQryInstance.andWhere('trips.driverAmount = :driverAmount', {
          driverAmount: params?.filters?.driverAmount,
        });
      }
      if (params?.filters?.riderAmount) {
        tripsQryInstance.andWhere('trips.riderAmount = :riderAmount', {
          riderAmount: params?.filters?.riderAmount,
        });
      }
      if (params?.filters?.promoCodeAmount) {
        tripsQryInstance.andWhere('trips.promoCodeAmount = :promoCodeAmount', {
          promoCodeAmount: params?.filters?.promoCodeAmount,
        });
      }
      if (params?.filters?.promoCode) {
        tripsQryInstance.andWhere('trips.promoCode LIKE :promoCode', {
          promoCode: `${params?.filters?.promoCode}%`,
        });
      }
      if (params?.filters?.pickup) {
        tripsQryInstance.andWhere('pickup.address LIKE :pickup', {
          pickup: `${params?.filters?.pickup}%`,
        });
      }
      if (params?.filters?.dropoff) {
        tripsQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('dropoff.address LIKE :dropoff', {
              dropoff: `${params?.filters?.dropoff}%`,
            });
            sqb.orWhere('destination.address LIKE :dropoff', {
              dropoff: `${params?.filters?.dropoff}%`,
            });
          }),
        );
      }
      if (params?.filters?.riderId) {
        tripsQryInstance.andWhere('rider.userId = :riderId', {
          riderId: params?.filters?.riderId,
        });
      }
      if (params?.filters?.riderName) {
        tripsQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('rider.firstName LIKE :riderName', {
              riderName: `${params?.filters?.riderName}%`,
            });
            sqb.orWhere('rider.lastName LIKE :riderName', {
              riderName: `${params?.filters?.riderName}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', rider.firstName, rider.lastName) LIKE :riderName",
              { riderName: `${params?.filters?.riderName}%` },
            );
          }),
        );
      }
      if (params?.filters?.driverId) {
        tripsQryInstance.andWhere('driver.userId = :driverId', {
          driverId: params?.filters?.driverId,
        });
      }
      if (params?.filters?.driverName) {
        tripsQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('driver.firstName LIKE :driverName', {
              driverName: `${params?.filters?.driverName}%`,
            });
            sqb.orWhere('driver.lastName LIKE :driverName', {
              driverName: `${params?.filters?.driverName}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', driver.firstName, driver.lastName) LIKE :driverName",
              { driverName: `${params?.filters?.driverName}%` },
            );
          }),
        );
      }
      if (params?.filters?.riderMobileNo) {
        tripsQryInstance.andWhere('rider.mobileNo = :riderMobileNo', {
          riderMobileNo: params?.filters?.riderMobileNo,
        });
      }
      if (params?.filters?.driverMobileNo) {
        tripsQryInstance.andWhere('driver.mobileNo = :driverMobileNo', {
          driverMobileNo: params?.filters?.driverMobileNo,
        });
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = TripsListingSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          tripsQryInstance.orderBy(sortField, sortOrder);
        }
      }
      tripsQryInstance.skip(params.skip);
      tripsQryInstance.take(params.take);
      const [result, total] = await tripsQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      const driverReviewIds = trips
        .map((data) => data?.driverReviewId)
        .filter((el) => {
          return el !== null;
        });
      const riderReviewIds = trips
        .map((data) => data?.riderReviewId)
        .filter((el) => {
          return el !== null;
        });
      const allReviewIds = driverReviewIds.concat(riderReviewIds);
      let reviewsList = [];
      if (allReviewIds && allReviewIds.length > 0) {
        const { data: reviewData } = await this.clientReviewTCP
          .send(GET_REVIEWS, JSON.stringify(allReviewIds))
          .pipe()
          .toPromise();
        // const { data: reviewData } = await this.reviewService.getReviews(allReviewIds);
        if (reviewData && reviewData.length > 0) {
          reviewsList = reviewData;
        }
      }

      trips.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        // data['taxAmount'] = Number((data.tripBaseAmount * data.taxAmount / 100).toFixed(2));
        if (data.rider) {
          data['rider'][
            'fullName'
          ] = `${data['rider']['firstName']} ${data['rider']['lastName']}`;
          data['rider']['arabicFullName'] = data.rider.arabicFirstName
            ? `${data['rider']['arabicFirstName']} ${data['rider']['arabicLastName']}`
            : '';
          delete data['rider']['firstName'];
          delete data['rider']['lastName'];
          delete data['rider']['arabicFirstName'];
          delete data['rider']['arabicLastName'];

          const riderRatingInfo = reviewsList.filter(
            (rec) => rec.id == data.riderReviewId,
          );
          if (riderRatingInfo && riderRatingInfo.length > 0) {
            data['rider']['riderReview'] = riderRatingInfo[0]['rating'];
          } else {
            data['rider']['riderReview'] = 0;
          }
        } else {
          data['rider'] = {};
        }
        delete data['riderReviewId'];
        if (data.driver) {
          data['driver'][
            'fullName'
          ] = `${data['driver']['firstName']} ${data['driver']['lastName']}`;
          data['driver']['arabicFullName'] = data.driver.arabicFirstName
            ? `${data['driver']['arabicFirstName']} ${data['driver']['arabicLastName']}`
            : '';
          delete data['driver']['firstName'];
          delete data['driver']['lastName'];
          delete data['driver']['arabicFirstName'];
          delete data['driver']['arabicLastName'];

          const driverRatingInfo = reviewsList.filter(
            (rec) => rec.id == data.driverReviewId,
          );
          if (driverRatingInfo && driverRatingInfo.length > 0) {
            data['driver']['driverReview'] = driverRatingInfo[0]['rating'];
          } else {
            data['driver']['driverReview'] = 0;
          }
        } else {
          data['driver'] = {};
        }
        delete data['driverReviewId'];

        if (!data?.pickup) {
          data['pickup'] = {};
        }
        if (!data?.dropoff) {
          if (data?.destination) {
            data['dropoff'] = data?.destination;
          } else {
            data['dropoff'] = {};
          }
        }
        delete data['destination'];
      });

      this.customLogger.log(`[findAll] success`);
      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.customLogger.error(`[findAll] -> error -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAllEmergencyTrips(params: ListSearchSortDto) {
    try {
      this.customLogger.log(
        `[findAllDispatcherTrips] params: ${JSON.stringify(params)}`,
      );
      // TODO: Need to add destination logic after merging "admin-api-feedbacks" branch with master
      const fields = [
        'trips.id',
        'trips.tripNo',
        'trips.createdAt',
        'trips.tripBaseAmount',
        'trips.riderAmount',
        'trips.promoCodeAmount',
        'trips.waitingCharge',
        'trips.taxAmount',
        'trips.promoCode',
        'trips.status',
        'trips.tripType',
        'trips.motAmount',
        'driver.driverId',
        'driver.userId',
        'driver.firstName',
        'driver.lastName',
        'driver.arabicFirstName',
        'driver.arabicLastName',
        'rider.id',
        'rider.userId',
        'rider.firstName',
        'rider.lastName',
        'rider.arabicFirstName',
        'rider.arabicLastName',
        'pickup.address',
        'pickup.addressType',
        'pickup.latitude',
        'pickup.longitude',
        'dropoff.address',
        'dropoff.addressType',
        'dropoff.latitude',
        'dropoff.longitude',
        'destination.address',
        'destination.addressType',
        'destination.latitude',
        'destination.longitude',
      ];
      const tripsQryInstance = this.tripsRepository.createQueryBuilder('trips');
      tripsQryInstance.select(fields);
      tripsQryInstance.innerJoin('trips.rider', 'rider');
      tripsQryInstance.leftJoin('trips.driver', 'driver');
      tripsQryInstance.leftJoin(
        'trips.pickup',
        'pickup',
        'pickup.addressType = :pickupType',
        { pickupType: AddressType.PICK_UP },
      );
      tripsQryInstance.leftJoin(
        'trips.dropoff',
        'dropoff',
        'dropoff.addressType = :dropoffType',
        { dropoffType: AddressType.DROP_OFF },
      );
      tripsQryInstance.leftJoin(
        'trips.destination',
        'destination',
        'destination.addressType = :destinationType',
        { destinationType: AddressType.DESTINATION },
      );

      tripsQryInstance.where('trips.createdType = :createdType', {
        createdType: TripCreatedBy.EMERGENCY_ADMIN,
      });
      //Admin Filters
      if (params?.filters?.status) {
        tripsQryInstance.andWhere('trips.status = :status', {
          status: params?.filters?.status,
        });
      } else {
        tripsQryInstance.andWhere('trips.status IN (:...status)', {
          status: [
            TripStatus.PENDING,
            TripStatus.NO_DRIVER,
            TripStatus.REJECTED_BY_DRIVER,
            TripStatus.ACCEPTED_BY_DRIVER,
            TripStatus.CANCELLED_BY_DRIVER,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.CANCELLED_BY_ADMIN,
            TripStatus.DRIVER_ARRIVED,
            TripStatus.STARTED,
            TripStatus.COMPLETED,
          ],
        });
      }
      if (params?.filters?.tripNo) {
        tripsQryInstance.andWhere('trips.tripNo = :tripNo', {
          tripNo: setTripNumber(params?.filters?.tripNo),
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        tripsQryInstance.andWhere('trips.createdAt >= :fromDate', { fromDate });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setHours(23, 59, 59, 999),
          ),
        );
        tripsQryInstance.andWhere('trips.createdAt <= :toDate', { toDate });
      }
      if (params?.filters?.tripBaseAmount) {
        tripsQryInstance.andWhere('trips.tripBaseAmount = :tripBaseAmount', {
          tripBaseAmount: params?.filters?.tripBaseAmount,
        });
      }
      if (params?.filters?.driverAmount) {
        tripsQryInstance.andWhere('trips.driverAmount = :driverAmount', {
          driverAmount: params?.filters?.driverAmount,
        });
      }
      if (params?.filters?.riderAmount) {
        tripsQryInstance.andWhere('trips.riderAmount = :riderAmount', {
          riderAmount: params?.filters?.riderAmount,
        });
      }
      if (params?.filters?.promoCodeAmount) {
        tripsQryInstance.andWhere('trips.promoCodeAmount = :promoCodeAmount', {
          promoCodeAmount: params?.filters?.promoCodeAmount,
        });
      }
      if (params?.filters?.promoCode) {
        tripsQryInstance.andWhere('trips.promoCode LIKE :promoCode', {
          promoCode: `${params?.filters?.promoCode}%`,
        });
      }
      if (params?.filters?.pickup) {
        tripsQryInstance.andWhere('pickup.address LIKE :pickup', {
          pickup: `${params?.filters?.pickup}%`,
        });
      }
      if (params?.filters?.dropoff) {
        tripsQryInstance.andWhere('dropoff.address LIKE :dropoff', {
          dropoff: `${params?.filters?.dropoff}%`,
        });
      }
      if (params?.filters?.riderId) {
        tripsQryInstance.andWhere('rider.userId = :riderId', {
          riderId: params?.filters?.riderId,
        });
      }
      if (params?.filters?.riderName) {
        tripsQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('rider.firstName LIKE :riderName', {
              riderName: `${params?.filters?.riderName}%`,
            });
            sqb.orWhere('rider.lastName LIKE :riderName', {
              riderName: `${params?.filters?.riderName}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', rider.firstName, rider.lastName) LIKE :riderName",
              { riderName: `${params?.filters?.riderName}%` },
            );
          }),
        );
      }
      if (params?.filters?.driverId) {
        tripsQryInstance.andWhere('driver.userId = :driverId', {
          driverId: params?.filters?.driverId,
        });
      }
      if (params?.filters?.driverName) {
        tripsQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('driver.firstName LIKE :driverName', {
              driverName: `${params?.filters?.driverName}%`,
            });
            sqb.orWhere('driver.lastName LIKE :driverName', {
              driverName: `${params?.filters?.driverName}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', driver.firstName, driver.lastName) LIKE :driverName",
              { driverName: `${params?.filters?.driverName}%` },
            );
          }),
        );
      }
      if (params?.filters?.createdBy) {
        tripsQryInstance.andWhere('trips.createdBy = :createdBy', {
          createdBy: params?.filters?.createdBy,
        });
      }
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = TripsListingSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          tripsQryInstance.orderBy(sortField, sortOrder);
        }
      }
      tripsQryInstance.skip(params.skip);
      tripsQryInstance.take(params.take);
      const [result, total] = await tripsQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      trips.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        if (data.rider) {
          data['rider'][
            'fullName'
          ] = `${data['rider']['firstName']} ${data['rider']['lastName']}`;
          data['rider']['arabicFullName'] = data.rider.arabicFirstName
            ? `${data['rider']['arabicFirstName']} ${data['rider']['arabicLastName']}`
            : '';
          delete data['rider']['firstName'];
          delete data['rider']['lastName'];
          delete data['rider']['arabicFirstName'];
          delete data['rider']['arabicLastName'];
        } else {
          data['rider'] = {};
        }
        if (data.driver) {
          data['driver'][
            'fullName'
          ] = `${data['driver']['firstName']} ${data['driver']['lastName']}`;
          data['driver']['arabicFullName'] = data.driver.arabicFirstName
            ? `${data['driver']['arabicFirstName']} ${data['driver']['arabicLastName']}`
            : '';
          delete data['driver']['firstName'];
          delete data['driver']['lastName'];
          delete data['driver']['arabicFirstName'];
          delete data['driver']['arabicLastName'];
        } else {
          data['driver'] = {};
        }

        if (!data?.pickup) {
          data['pickup'] = {};
        }
        if (!data?.dropoff) {
          if (data?.destination) {
            data['dropoff'] = data?.destination;
          } else {
            data['dropoff'] = {};
          }
        }
      });

      this.customLogger.log(`[findAllDispatcherTrips] success`);
      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.customLogger.error(
        `[findAllDispatcherTrips] -> error -> ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAllDispatcherTrips(params: ListSearchSortDto) {
    try {
      this.customLogger.log(
        `[findAllDispatcherTrips] params: ${JSON.stringify(params)}`,
      );
      // TODO: Need to add destination logic after merging "admin-api-feedbacks" branch with master
      const fields = [
        'trips.id',
        'trips.tripNo',
        'trips.createdAt',
        'trips.tripBaseAmount',
        'trips.riderAmount',
        'trips.promoCodeAmount',
        'trips.waitingCharge',
        'trips.taxAmount',
        'trips.promoCode',
        'trips.status',
        'trips.tripType',
        'trips.motAmount',
        'driver.driverId',
        'driver.userId',
        'driver.firstName',
        'driver.lastName',
        'driver.arabicFirstName',
        'driver.arabicLastName',
        'rider.id',
        'rider.userId',
        'rider.firstName',
        'rider.lastName',
        'rider.arabicFirstName',
        'rider.arabicLastName',
        'pickup.address',
        'pickup.addressType',
        'pickup.latitude',
        'pickup.longitude',
        'dropoff.address',
        'dropoff.addressType',
        'dropoff.latitude',
        'dropoff.longitude',
        'destination.address',
        'destination.addressType',
        'destination.latitude',
        'destination.longitude',
      ];
      const tripsQryInstance = this.tripsRepository.createQueryBuilder('trips');
      tripsQryInstance.select(fields);
      tripsQryInstance.innerJoin('trips.rider', 'rider');
      tripsQryInstance.leftJoin('trips.driver', 'driver');
      tripsQryInstance.leftJoin(
        'trips.pickup',
        'pickup',
        'pickup.addressType = :pickupType',
        { pickupType: AddressType.PICK_UP },
      );
      tripsQryInstance.leftJoin(
        'trips.dropoff',
        'dropoff',
        'dropoff.addressType = :dropoffType',
        { dropoffType: AddressType.DROP_OFF },
      );
      tripsQryInstance.leftJoin(
        'trips.destination',
        'destination',
        'destination.addressType = :destinationType',
        { destinationType: AddressType.DESTINATION },
      );

      //tripsQryInstance.where("trips.createdType = :createdType", { createdType: TripCreatedBy.DISPATCHER_ADMIN });
      tripsQryInstance.where('trips.createdType IN (:...createdType)', {
        createdType: [
          TripCreatedBy.DISPATCHER_ADMIN,
          TripCreatedBy.ADMIN,
          TripCreatedBy.SUB_ADMIN,
        ],
      });

      //Admin Filters
      if (params?.filters?.status) {
        tripsQryInstance.andWhere('trips.status = :status', {
          status: params?.filters?.status,
        });
      } else {
        tripsQryInstance.andWhere('trips.status IN (:...status)', {
          status: [
            TripStatus.PENDING,
            TripStatus.NO_DRIVER,
            TripStatus.REJECTED_BY_DRIVER,
            TripStatus.ACCEPTED_BY_DRIVER,
            TripStatus.CANCELLED_BY_DRIVER,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.CANCELLED_BY_ADMIN,
            TripStatus.DRIVER_ARRIVED,
            TripStatus.STARTED,
            TripStatus.COMPLETED,
          ],
        });
      }
      if (params?.filters?.tripNo) {
        tripsQryInstance.andWhere('trips.tripNo = :tripNo', {
          tripNo: setTripNumber(params?.filters?.tripNo),
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        tripsQryInstance.andWhere('trips.createdAt >= :fromDate', { fromDate });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setHours(23, 59, 59, 999),
          ),
        );
        tripsQryInstance.andWhere('trips.createdAt <= :toDate', { toDate });
      }
      if (params?.filters?.tripBaseAmount) {
        tripsQryInstance.andWhere('trips.tripBaseAmount = :tripBaseAmount', {
          tripBaseAmount: params?.filters?.tripBaseAmount,
        });
      }
      if (params?.filters?.driverAmount) {
        tripsQryInstance.andWhere('trips.driverAmount = :driverAmount', {
          driverAmount: params?.filters?.driverAmount,
        });
      }
      if (params?.filters?.riderAmount) {
        tripsQryInstance.andWhere('trips.riderAmount = :riderAmount', {
          riderAmount: params?.filters?.riderAmount,
        });
      }
      if (params?.filters?.promoCodeAmount) {
        tripsQryInstance.andWhere('trips.promoCodeAmount = :promoCodeAmount', {
          promoCodeAmount: params?.filters?.promoCodeAmount,
        });
      }
      if (params?.filters?.promoCode) {
        tripsQryInstance.andWhere('trips.promoCode LIKE :promoCode', {
          promoCode: `${params?.filters?.promoCode}%`,
        });
      }
      if (params?.filters?.pickup) {
        tripsQryInstance.andWhere('pickup.address LIKE :pickup', {
          pickup: `${params?.filters?.pickup}%`,
        });
      }
      if (params?.filters?.dropoff) {
        tripsQryInstance.andWhere('dropoff.address LIKE :dropoff', {
          dropoff: `${params?.filters?.dropoff}%`,
        });
      }
      if (params?.filters?.riderId) {
        tripsQryInstance.andWhere('rider.userId = :riderId', {
          riderId: params?.filters?.riderId,
        });
      }
      if (params?.filters?.riderName) {
        tripsQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('rider.firstName LIKE :riderName', {
              riderName: `${params?.filters?.riderName}%`,
            });
            sqb.orWhere('rider.lastName LIKE :riderName', {
              riderName: `${params?.filters?.riderName}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', rider.firstName, rider.lastName) LIKE :riderName",
              { riderName: `${params?.filters?.riderName}%` },
            );
          }),
        );
      }
      if (params?.filters?.driverId) {
        tripsQryInstance.andWhere('driver.userId = :driverId', {
          driverId: params?.filters?.driverId,
        });
      }
      if (params?.filters?.driverName) {
        tripsQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('driver.firstName LIKE :driverName', {
              driverName: `${params?.filters?.driverName}%`,
            });
            sqb.orWhere('driver.lastName LIKE :driverName', {
              driverName: `${params?.filters?.driverName}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', driver.firstName, driver.lastName) LIKE :driverName",
              { driverName: `${params?.filters?.driverName}%` },
            );
          }),
        );
      }
      if (params?.filters?.createdBy) {
        tripsQryInstance.andWhere('trips.createdBy = :createdBy', {
          createdBy: params?.filters?.createdBy,
        });
      }
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = TripsListingSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          tripsQryInstance.orderBy(sortField, sortOrder);
        }
      }
      tripsQryInstance.skip(params.skip);
      tripsQryInstance.take(params.take);
      const [result, total] = await tripsQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      trips.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        if (data.rider) {
          data['rider'][
            'fullName'
          ] = `${data['rider']['firstName']} ${data['rider']['lastName']}`;
          data['rider']['arabicFullName'] = data.rider.arabicFirstName
            ? `${data['rider']['arabicFirstName']} ${data['rider']['arabicLastName']}`
            : '';
          delete data['rider']['firstName'];
          delete data['rider']['lastName'];
          delete data['rider']['arabicFirstName'];
          delete data['rider']['arabicLastName'];
        } else {
          data['rider'] = {};
        }
        if (data.driver) {
          data['driver'][
            'fullName'
          ] = `${data['driver']['firstName']} ${data['driver']['lastName']}`;
          data['driver']['arabicFullName'] = data.driver.arabicFirstName
            ? `${data['driver']['arabicFirstName']} ${data['driver']['arabicLastName']}`
            : '';
          delete data['driver']['firstName'];
          delete data['driver']['lastName'];
          delete data['driver']['arabicFirstName'];
          delete data['driver']['arabicLastName'];
        } else {
          data['driver'] = {};
        }

        if (!data?.pickup) {
          data['pickup'] = {};
        }
        if (!data?.dropoff) {
          if (data?.destination) {
            data['dropoff'] = data?.destination;
          } else {
            data['dropoff'] = {};
          }
        }
      });

      this.customLogger.log(`[findAllDispatcherTrips] success`);
      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.customLogger.error(
        `[findAllDispatcherTrips] -> error -> ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAllIncompleteTrips(params: ListSearchSortDto) {
    try {
      this.customLogger.log(
        `[findAllIncompleteTrips] params: ${JSON.stringify(params)}`,
      );
      // TODO: Need to add destination logic after merging "admin-api-feedbacks" branch with master
      const fields = [
        'trips.id',
        'trips.tripNo',
        'trips.createdAt',
        'trips.tripBaseAmount',
        'trips.riderAmount',
        'trips.promoCodeAmount',
        'trips.waitingCharge',
        'trips.taxAmount',
        'trips.promoCode',
        'trips.status',
        'trips.tripType',
        'trips.motAmount',
        'driver.driverId',
        'driver.userId',
        'driver.firstName',
        'driver.lastName',
        'driver.arabicFirstName',
        'driver.arabicLastName',
        'rider.id',
        'rider.userId',
        'rider.firstName',
        'rider.lastName',
        'rider.arabicFirstName',
        'rider.arabicLastName',
        'pickup.address',
        'pickup.addressType',
        'pickup.latitude',
        'pickup.longitude',
        'dropoff.address',
        'dropoff.addressType',
        'dropoff.latitude',
        'dropoff.longitude',
        'destination.address',
        'destination.addressType',
        'destination.latitude',
        'destination.longitude',
      ];
      const tripsQryInstance = this.tripsRepository.createQueryBuilder('trips');
      tripsQryInstance.select(fields);
      tripsQryInstance.innerJoin('trips.rider', 'rider');
      tripsQryInstance.leftJoin('trips.driver', 'driver');
      tripsQryInstance.leftJoin(
        'trips.pickup',
        'pickup',
        'pickup.addressType = :pickupType',
        { pickupType: AddressType.PICK_UP },
      );
      tripsQryInstance.leftJoin(
        'trips.dropoff',
        'dropoff',
        'dropoff.addressType = :dropoffType',
        { dropoffType: AddressType.DROP_OFF },
      );
      tripsQryInstance.leftJoin(
        'trips.destination',
        'destination',
        'destination.addressType = :destinationType',
        { destinationType: AddressType.DESTINATION },
      );
      //Admin Filters
      tripsQryInstance.where('trips.status IN (:...status)', {
        status: [TripStatus.EXPIRED, TripStatus.NO_DRIVER],
      });
      if (params?.filters?.tripNo) {
        tripsQryInstance.andWhere('trips.tripNo = :tripNo', {
          tripNo: setTripNumber(params?.filters?.tripNo),
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        tripsQryInstance.andWhere('trips.createdAt >= :fromDate', { fromDate });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setHours(23, 59, 59, 999),
          ),
        );
        tripsQryInstance.andWhere('trips.createdAt <= :toDate', { toDate });
      }
      if (params?.filters?.tripBaseAmount) {
        tripsQryInstance.andWhere('trips.tripBaseAmount = :tripBaseAmount', {
          tripBaseAmount: params?.filters?.tripBaseAmount,
        });
      }
      if (params?.filters?.driverAmount) {
        tripsQryInstance.andWhere('trips.driverAmount = :driverAmount', {
          driverAmount: params?.filters?.driverAmount,
        });
      }
      if (params?.filters?.riderAmount) {
        tripsQryInstance.andWhere('trips.riderAmount = :riderAmount', {
          riderAmount: params?.filters?.riderAmount,
        });
      }
      if (params?.filters?.promoCodeAmount) {
        tripsQryInstance.andWhere('trips.promoCodeAmount = :promoCodeAmount', {
          promoCodeAmount: params?.filters?.promoCodeAmount,
        });
      }
      if (params?.filters?.promoCode) {
        tripsQryInstance.andWhere('trips.promoCode LIKE :promoCode', {
          promoCode: `${params?.filters?.promoCode}%`,
        });
      }
      if (params?.filters?.pickup) {
        tripsQryInstance.andWhere('pickup.address LIKE :pickup', {
          pickup: `${params?.filters?.pickup}%`,
        });
      }
      if (params?.filters?.dropoff) {
        tripsQryInstance.andWhere('dropoff.address LIKE :dropoff', {
          dropoff: `${params?.filters?.dropoff}%`,
        });
      }
      if (params?.filters?.riderId) {
        tripsQryInstance.andWhere('rider.userId = :riderId', {
          riderId: params?.filters?.riderId,
        });
      }
      if (params?.filters?.riderName) {
        tripsQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('rider.firstName LIKE :riderName', {
              riderName: `${params?.filters?.riderName}%`,
            });
            sqb.orWhere('rider.lastName LIKE :riderName', {
              riderName: `${params?.filters?.riderName}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', rider.firstName, rider.lastName) LIKE :riderName",
              { riderName: `${params?.filters?.riderName}%` },
            );
          }),
        );
      }
      if (params?.filters?.driverId) {
        tripsQryInstance.andWhere('driver.userId = :driverId', {
          driverId: params?.filters?.driverId,
        });
      }
      if (params?.filters?.driverName) {
        tripsQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('driver.firstName LIKE :driverName', {
              driverName: `${params?.filters?.driverName}%`,
            });
            sqb.orWhere('driver.lastName LIKE :driverName', {
              driverName: `${params?.filters?.driverName}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', driver.firstName, driver.lastName) LIKE :driverName",
              { driverName: `${params?.filters?.driverName}%` },
            );
          }),
        );
      }
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = TripsListingSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          tripsQryInstance.orderBy(sortField, sortOrder);
        }
      }
      tripsQryInstance.skip(params.skip);
      tripsQryInstance.take(params.take);
      const [result, total] = await tripsQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      trips.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        if (data.rider) {
          data['rider'][
            'fullName'
          ] = `${data['rider']['firstName']} ${data['rider']['lastName']}`;
          data['rider']['arabicFullName'] = data.rider.arabicFirstName
            ? `${data['rider']['arabicFirstName']} ${data['rider']['arabicLastName']}`
            : '';
          delete data['rider']['firstName'];
          delete data['rider']['lastName'];
          delete data['rider']['arabicFirstName'];
          delete data['rider']['arabicLastName'];
        } else {
          data['rider'] = {};
        }
        if (data.driver) {
          data['driver'][
            'fullName'
          ] = `${data['driver']['firstName']} ${data['driver']['lastName']}`;
          data['driver']['arabicFullName'] = data.driver.arabicFirstName
            ? `${data['driver']['arabicFirstName']} ${data['driver']['arabicLastName']}`
            : '';
          delete data['driver']['firstName'];
          delete data['driver']['lastName'];
          delete data['driver']['arabicFirstName'];
          delete data['driver']['arabicLastName'];
        } else {
          data['driver'] = {};
        }

        if (!data?.pickup) {
          data['pickup'] = {};
        }
        if (!data?.dropoff) {
          if (data?.destination) {
            data['dropoff'] = data?.destination;
          } else {
            data['dropoff'] = {};
          }
        }
      });

      this.customLogger.log(`[findAllIncompleteTrips] success`);
      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.customLogger.error(
        `[findAllIncompleteTrips] -> error -> ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createTrip(data: TripsCreateDTO & CabCalcParams) {
    try {
      const { riderId, cabId } = data;
      this.customLogger.log(`[createTrip] riderId => ${riderId}`);

      await this.checkRiderHasTripRunning(riderId, true);

      const cabType = await this.checkIsValidCab(cabId);
      if (cabType?.statusCode && cabType.statusCode == HttpStatus.NOT_FOUND) {
        return cabType;
      }
      this.customLogger.log(
        `[createTrip] Cab Validated Successfully | ${cabId}`,
      );

      const createdTrip = await this.create(data);
      this.customLogger.log(
        `[createTrip] Immediate Trip Created Successfully | tripId => ${createdTrip.id}`,
      );

      return ResponseData.success(HttpStatus.CREATED, {
        id: createdTrip.id,
        message: successMessage.TRIP.CREATE,
      });
    } catch (error) {
      this.customLogger.error(
        `[createTrip] Some Error Occurred in catch | ${error.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async acceptTripWithAllCabs(data: TripIdParamDto & RiderIdDto) {
    try {
      const { tripId, riderId } = data;

      this.customLogger.log(
        `[acceptTripWithAllCabs] tripId => ${tripId} | riderId => ${riderId}`,
      );

      const trip = await this.getTripById(tripId, {
        select: ['id', 'status', 'riderId', 'tripExpiredAt'],
      });

      this.checkIsRiderAuthorized(trip.riderId, riderId, trip.id);

      this.checkIsTripActionAllowed(trip.id, trip.status);

      if (trip.tripExpiredAt) {
        this.customLogger.error(
          `[acceptTripWithAllCabs] ${errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED} | tripExpiredAt: ${trip.tripExpiredAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED);
      }

      if (trip.status !== TripStatus.NO_DRIVER) {
        throw new Error(errorMessage.SOMETHING_WENT_WRONG);
      }

      await this.tripsRepository.update(
        { id: trip.id },
        {
          cabId: null,
        },
      );
      this.customLogger.log(`[update] Success ✔ | trip: ${trip.id}`);

      this.emitTripsToKafka(trip.id);

      return ResponseData.success(HttpStatus.OK, {
        id: trip.id,
        message: 'Accept Success',
      });
    } catch (error) {
      this.customLogger.error(
        `[acceptTripWithAllCabs] Some Error Occurred in catch | ${error.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async declineTripWithAllCabs(data: TripIdParamDto & RiderIdDto) {
    try {
      const { tripId, riderId } = data;

      this.customLogger.log(
        `[declineTripWithAllCabs] tripId => ${tripId} | riderId => ${riderId}`,
      );

      const trip = await this.getTripById(tripId, {
        select: ['id', 'status', 'riderId', 'tripExpiredAt'],
        relations: ['drivers'],
      });

      this.checkIsRiderAuthorized(trip.riderId, riderId, trip.id);

      this.checkIsTripActionAllowed(trip.id, trip.status);

      if (trip.tripExpiredAt) {
        this.customLogger.error(
          `[declineTripWithAllCabs] ${errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED} | tripExpiredAt: ${trip.tripExpiredAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED);
      }

      if (trip.status !== TripStatus.NO_DRIVER) {
        throw new Error(errorMessage.SOMETHING_WENT_WRONG);
      }

      await this.tripsRepository.update(
        { id: trip.id },
        {
          status: TripStatus.EXPIRED,
          tripExpiredAt: getTimestamp(),
        },
      );
      this.customLogger.log(`[update] Success ✔ | trip: ${trip.id}`);

      this.notifyTripDetailAndSendNotification(trip, 'trip_expired');

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged();

      return ResponseData.success(HttpStatus.OK, {
        id: trip.id,
        message: 'Decline Success',
      });
    } catch (error) {
      this.customLogger.error(
        `[declineTripWithAllCabs] Some Error Occurred in catch | ${error.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createScheduleTrip(data: ScheduleTripsCreateDTO) {
    try {
      const { riderId, cabId, riderScheduledAt } = data;
      this.customLogger.log(`[createScheduleTrip] riderId => ${riderId}`);

      await this.checkRiderHasTripRunning(riderId);

      const cabType = await this.checkIsValidCab(cabId);
      if (cabType?.statusCode && cabType.statusCode == HttpStatus.NOT_FOUND) {
        return cabType;
      }
      this.customLogger.log(
        `[createScheduleTrip] Cab Validated Successfully | ${cabId}`,
      );

      const SCHEDULE_TRIP_TIME_RANGE = await this.redisHandler.getRedisKey(
        'SETTING_SCHEDULE_TRIP_TIME_RANGE',
      );
      this.customLogger.log(
        `[createScheduleTrip] Schedule trip time range from redis | ${SCHEDULE_TRIP_TIME_RANGE}`,
      );

      const {
        start: schedule_time_range_starts_at,
        end: schedule_time_range_ends_at,
      } = JSON.parse(
        SCHEDULE_TRIP_TIME_RANGE || '{"start":"09:00","end":"20:00"}',
      );

      // Counts total minutes from current timestamp's hours and minutes
      const totalMinutes = getTotalMinutes(
        moment(getTimestamp()).format('HH:mm'),
      );

      // Checks if request to create scheduled trip is within given time limit
      if (
        !(
          getTotalMinutes(schedule_time_range_starts_at) <= totalMinutes &&
          totalMinutes <= getTotalMinutes(schedule_time_range_ends_at)
        )
      ) {
        this.customLogger.error(
          `[createScheduleTrip] ${errorMessage.TRIP.SCHEDULE_TRIP_TIME_RANGE_ERROR}`,
        );
        throw new HttpException(
          errorMessage.TRIP.SCHEDULE_TRIP_TIME_RANGE_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }

      const SCHEDULED_TRIP_MIN_TIME = await this.redisHandler.getRedisKey(
        'SETTING_SCHEDULED_TRIP_MIN_TIME',
      );
      this.customLogger.log(
        `[createScheduleTrip] Schedule trip min time from redis | ${SCHEDULED_TRIP_MIN_TIME}`,
      );

      const currentDate = new Date();
      currentDate.setMinutes(
        currentDate.getMinutes() + Number(SCHEDULED_TRIP_MIN_TIME),
      );

      this.customLogger.log(
        `[createScheduleTrip] riderScheduledAt | ${new Date(riderScheduledAt)}`,
      );
      this.customLogger.log(
        `[createScheduleTrip] currentDate | ${new Date(currentDate)}`,
      );

      if (new Date(riderScheduledAt) < currentDate) {
        this.customLogger.error(
          `[createScheduleTrip] ${errorMessage.TRIP.TRIP_SCHEDULE_TIME_ERROR}`,
        );
        throw new HttpException(
          errorMessage.TRIP.TRIP_SCHEDULE_TIME_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedData = {
        ...data,
        tripType: TripType.SCHEDULED,
      };
      const createdScheduledTrip = await this.create(updatedData);
      this.customLogger.log(
        `[createScheduleTrip] Schedule Trip Created Successfully | tripId => ${createdScheduledTrip.id}`,
      );

      return ResponseData.success(HttpStatus.OK, {
        id: createdScheduledTrip.id,
        message: successMessage.TRIP.CREATE_SCHEDULE,
      });
    } catch (error) {
      this.customLogger.error(
        `[createScheduleTrip] Some Error Occurred in catch | ${error.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async expireTripAndPendingDriver(trip: TripsEntity) {
    // making older no_drivers status trip expire
    await this.tripsRepository.update(trip.id, {
      status: TripStatus.EXPIRED,
      tripExpiredAt: getTimestamp(),
    });

    // Updates admin dashboard stats as trip status changed
    await this.notifyAdminDashboardAsTripStatusChanged();

    // making all pending requested drivers expire
    const pendingDriver = trip.drivers.find(
      (tripDriver: TripDriver) =>
        tripDriver.status === TripDriverStatus.PENDING,
    );

    if (pendingDriver) {
      await this.tripDriversService.update(pendingDriver.id, {
        status: TripDriverStatus.EXPIRED,
      });
    }
  }

  async checkRiderHasTripRunning(riderId: string, isImmediate = false) {
    this.customLogger.log(`[checkRiderHasTripRunning] riderId => ${riderId}`);

    // Previous running trips
    const trips = await this.tripsRepository.find({
      riderId,
      completed: false,
      tripCancelledAt: IsNull(),
      tripExpiredAt: IsNull(),
      status: Not(In([TripStatus.BOOKING_CANCELLED])),
    });

    // Previous running immediate trip
    const previousImmediateTrip = trips.find(
      (trip: TripsEntity) => trip.tripType === TripType.IMMEDIATELY,
    );

    // Previous running scheduled trip
    const previousScheduledTrip = trips.find(
      (trip: TripsEntity) => trip.tripType === TripType.SCHEDULED,
    );

    if (previousImmediateTrip || previousScheduledTrip) {
      // For current scheduled trip
      if (!isImmediate) {
        if (previousImmediateTrip) {
          /*
            If previous immediate trip's status is no driver 
            then expire that trip and allow to create new scheduled trip
          */
          if (previousImmediateTrip.status === TripStatus.NO_DRIVER) {
            await this.expireTripAndPendingDriver(previousImmediateTrip);
          } else {
            this.customLogger.error(
              `[checkRiderHasTripRunning] ${errorMessage.TRIP.IMMEDIATE_TRIP_RUNNING_ALREADY} | trip: ${previousImmediateTrip.id}`,
            );
            throw new HttpException(
              errorMessage.TRIP.IMMEDIATE_TRIP_RUNNING_ALREADY,
              HttpStatus.NOT_FOUND,
            );
          }
        }

        if (previousScheduledTrip) {
          /*
            If previous scheduled trip's status is no driver 
            then expire that trip and allow to create new scheduled trip
          */
          if (previousScheduledTrip.status === TripStatus.NO_DRIVER) {
            await this.expireTripAndPendingDriver(previousScheduledTrip);
          } else {
            this.customLogger.error(
              `[checkRiderHasTripRunning] ${errorMessage.TRIP.SCHEDULED_TRIP_PRESENT_ALREADY} | trip: ${previousScheduledTrip.id}`,
            );
            throw new HttpException(
              errorMessage.TRIP.SCHEDULED_TRIP_PRESENT_ALREADY,
              HttpStatus.NOT_FOUND,
            );
          }
        }

        // For current immediate trip
      } else {
        if (previousImmediateTrip) {
          const pendingStatus = [TripStatus.PENDING, TripStatus.NO_DRIVER];

          /*
            If previous immediate trip's status is pending or no driver 
            then expire that trip and allow to create new immediate trip 
          */
          if (pendingStatus.includes(previousImmediateTrip.status)) {
            await this.expireTripAndPendingDriver(previousImmediateTrip);
          } else {
            this.customLogger.error(
              `[checkRiderHasTripRunning] ${errorMessage.TRIP.IMMEDIATE_TRIP_RUNNING_ALREADY} | trip: ${previousImmediateTrip.id}`,
            );
            throw new HttpException(
              errorMessage.TRIP.IMMEDIATE_TRIP_RUNNING_ALREADY,
              HttpStatus.NOT_FOUND,
            );
          }
        }
        if (previousScheduledTrip) {
          /*
            If previous scheduled trip's status is no driver 
            then expire that trip and allow to create new immediate trip
          */
          if (previousScheduledTrip.status === TripStatus.NO_DRIVER) {
            await this.expireTripAndPendingDriver(previousScheduledTrip);

            // Checks if previous scheduled trip is just booked only or not
          } else if (
            previousScheduledTrip.status === TripStatus.PENDING &&
            previousScheduledTrip.previousStatus ===
              TripPreviousStatus.IN_PROGRESS
          ) {
            // Allow rider to create immediate trip if scheduled trip is booked only
            /* 
              If previous scheduled trip is in progress then it will not allow to create new immediate trip
            */
          } else {
            this.customLogger.error(
              `[checkRiderHasTripRunning] ${errorMessage.TRIP.SCHEDULED_TRIP_RUNNING_ALREADY} | trip: ${previousScheduledTrip.id}`,
            );
            throw new HttpException(
              errorMessage.TRIP.SCHEDULED_TRIP_RUNNING_ALREADY,
              HttpStatus.NOT_FOUND,
            );
          }
        }
      }
    }

    return;
  }

  async checkIsValidCab(cabId: string) {
    try {
      let cabRedis = await this.redisHandler.getRedisKey(`cab-type-${cabId}`);
      let cabResp;
      if (!cabRedis) {
        this.customLogger.debug(
          '[checkIsValidCab] get cab detail > kafka::' + cabId,
        );
        cabResp = await this.clientCaptainTCP
          .send(GET_CAB_TYPE_DETAIL, JSON.stringify({ id: cabId }))
          .pipe()
          .toPromise();
        // cabResp = { statusCode: HttpStatus.OK, data: {} };
      } else {
        this.customLogger.debug(
          '[checkIsValidCab] get cab detail > redis::' + cabId,
        );
        cabResp = { statusCode: HttpStatus.OK, data: JSON.parse(cabRedis) };
      }
      return cabResp.data;
    } catch (e) {
      this.customLogger.error(
        `[checkIsValidCab] Cab validation has some error | cabId: ${cabId} | ${e.message}`,
      );
    }
  }

  checkIsDriverAuthorized(
    tripDriver: string,
    driverId: string,
    tripId: string,
  ) {
    this.customLogger.log(
      `[checkIsDriverAuthorized] Driver Authorization check | TripId: ${tripId} | DriverId: ${driverId}`,
    );

    if (tripDriver !== driverId) {
      this.customLogger.error(
        `[checkIsDriverAuthorized] Driver Authorization error | Trip-Driver: ${tripDriver} | DriverId: ${driverId}`,
      );
      throw new Error(errorMessage.UNAUTHORIZED_ACTION);
    }
    return;
  }

  checkIsRiderAuthorized(tripRider: string, riderId: string, tripId: string) {
    this.customLogger.log(
      `[checkIsRiderAuthorized] Rider Authorization check | TripId: ${tripId} | RiderId: ${riderId}`,
    );

    if (tripRider !== riderId) {
      this.customLogger.error(
        `[checkIsRiderAuthorized] Rider Authorization error | Trip-Rider: ${tripRider} | RiderId: ${riderId}`,
      );
      throw new Error(errorMessage.UNAUTHORIZED_ACTION);
    }
    return;
  }

  checkIsTripActionAllowed(tripId: string, status: TripStatus) {
    this.customLogger.log(
      `[checkIsTripActionAllowed] Booking request status check | TripId: ${tripId} | Status: ${status}`,
    );

    if (status === TripStatus.BOOKING_CANCELLED) {
      this.customLogger.error(
        `[checkIsTripActionAllowed] ${errorMessage.TRIP.BOOKING_ALREADY_CANCELLED}`,
      );
      throw new Error(errorMessage.TRIP.BOOKING_ALREADY_CANCELLED);
    }
    return;
  }

  async getTripById(
    id: string,
    conditions = {} as FindOneOptions<TripsEntity>,
    query = {},
  ) {
    this.customLogger.log(`[getTripById] id: ${id}`);

    const trip = await this.tripsRepository.findOne(
      { id, ...query },
      conditions,
    );
    if (!trip) {
      this.customLogger.error(
        `[getTripById] ${errorMessage.TRIP.TRIP_NOT_FOUND} | id: ${id}`,
      );
      throw new Error(errorMessage.TRIP.TRIP_NOT_FOUND);
    }

    this.customLogger.log(`[getTripById] Success | id: ${id}`);
    return trip;
  }

  async getRecentAddresses(params: RiderIdDto) {
    try {
      const { riderId } = params;
      this.customLogger.log(`[getRecentAddresses] rider: ${riderId}`);

      const recentAddressesLimit =
        (await this.redisHandler.getRedisKey(
          'SETTING_RECENT_ADDRESSES_LIMIT',
        )) || 2;

      const recentAddresses = await this.tripsRepository
        .createQueryBuilder('trips')
        .where('trips.riderId = :riderId', { riderId })
        .andWhere('trips.completed = :completed', { completed: true })
        .andWhere('trips.tripFinishedAt IS NOT NULL')
        .orderBy('trips.createdAt', 'DESC')
        .leftJoinAndSelect(
          'trips.addresses',
          'addresses',
          'addresses.addressType = :addressType',
          { addressType: AddressType.DROP_OFF },
        )
        .select([
          'addresses.id AS id',
          'addresses.address AS address',
          'addresses.addressType AS addressType',
          'addresses.latitude AS latitude',
          'addresses.longitude AS longitude',
          'addresses.cityNameInArabic AS cityNameInArabic',
          'addresses.createdAt AS createdAt',
        ])
        .distinctOn(['addresses'])
        .limit(recentAddressesLimit)
        .getRawMany();

      this.customLogger.log(`[getRecentAddresses] Success | rider: ${riderId}`);
      return ResponseData.success(HttpStatus.OK, { recentAddresses });
    } catch (e) {
      this.customLogger.error(
        `[getRecentAddresses] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getFutureTrips(params: RiderIdDto) {
    try {
      const { riderId } = params;
      this.customLogger.log(`[getFutureTrips] rider: ${riderId}`);

      const futureTrips = await this.tripsRepository
        .createQueryBuilder('trips')
        .select(['trips.id', 'trips.tripType'])
        .innerJoinAndSelect('trips.addresses', 'addresses')
        .where('trips.riderId = :riderId', { riderId })
        .andWhere('trips.tripType = :tripType', {
          tripType: TripType.SCHEDULED,
        })
        .andWhere('trips.status = :status', { status: TripStatus.PENDING })
        .getMany();

      this.customLogger.log(`[getFutureTrips] Success | rider: ${riderId}`);
      return ResponseData.success(HttpStatus.OK, { futureTrips });
    } catch (e) {
      this.customLogger.error(
        `[getFutureTrips] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getReviews(
    trips: TripsEntity[],
    reviewIds: string[],
    reviewType: ReviewExternalType,
  ) {
    this.customLogger.log(
      `[getReviews] reviewIds: ${reviewIds} | reviewType: ${reviewType}`,
    );

    try {
      const { data } = await this.clientReviewTCP
        .send(GET_REVIEWS, JSON.stringify(reviewIds))
        .pipe()
        .toPromise();

      this.customLogger.debug('getReviewsRes: ' + JSON.stringify(data));

      if (data && data.length) {
        for (const trip of trips) {
          const review = data.find((i) => {
            return (
              i.id ===
              (reviewType === ReviewExternalType.Rider
                ? trip.riderReviewId
                : trip.driverReviewId)
            );
          });
          if (review) {
            trip[
              ReviewExternalType.Rider ? 'riderReview' : 'driverReview'
            ] = review;
          }
        }
      }

      this.customLogger.log(
        `[getReviews] Success | reviewIds: ${reviewIds} | reviewType: ${reviewType}`,
      );
      return trips;
    } catch (e) {
      this.customLogger.error(
        `[getReviews] Some Error Occurred in catch | ${e.message}`,
      );

      return trips;
    }
  }

  async getCompletedTripsByRider(params: RiderIdDto) {
    const { riderId } = params;
    try {
      this.customLogger.log(`[getCompletedTripsByRider] rider: ${riderId}`);

      let completedTrips = await this.tripsRepository
        .createQueryBuilder('trips')
        .select([
          'trips.id',
          'trips.riderId',
          'trips.driverId',
          'trips.tripType',
          'trips.tripFinishedAt',
          'trips.riderReviewId',
          'trips.driverAmount',
          'trips.riderAmount',
        ])
        .innerJoinAndSelect('trips.addresses', 'addresses')
        .leftJoinAndSelect('trips.images', 'images')
        .where('trips.riderId = :riderId', { riderId })
        .andWhere('trips.status = :status', { status: TripStatus.COMPLETED })
        .andWhere('trips.tripFinishedAt IS NOT NULL')
        .andWhere('trips.completed = :completed', { completed: true })
        .getMany();

      if (completedTrips?.length) {
        // get aws image urls
        completedTrips = await this.getTripImagesUrlFromAWS(completedTrips);

        // get reviews
        const reviewIds = completedTrips
          .map((trip: TripsEntity) => trip.riderReviewId)
          .filter(Boolean);
        if (reviewIds.length) {
          completedTrips = await this.getReviews(
            completedTrips,
            reviewIds,
            ReviewExternalType.Rider,
          );
        }
      }

      this.customLogger.log(
        `[getCompletedTripsByRider] Success | rider: ${riderId}`,
      );
      return ResponseData.success(HttpStatus.OK, { completedTrips });
    } catch (e) {
      this.customLogger.error(
        `[getCompletedTripsByRider] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCompletedTripsByDriver(params: DriverIdDto) {
    try {
      const { driverId } = params;
      this.customLogger.log(
        `[getCompletedTripsByDriver] driverId: ${driverId}`,
      );

      let completedTrips = await this.tripsRepository
        .createQueryBuilder('trips')
        .select([
          'trips.id',
          'trips.riderId',
          'trips.driverId',
          'trips.tripType',
          'trips.tripFinishedAt',
          'trips.driverReviewId',
          'trips.driverAmount',
          'trips.riderAmount',
        ])
        .innerJoinAndSelect('trips.addresses', 'addresses')
        .leftJoinAndSelect('trips.images', 'images')
        .where('trips.driverId = :driverId', { driverId })
        .andWhere('trips.status = :status', { status: TripStatus.COMPLETED })
        .andWhere('trips.tripFinishedAt IS NOT NULL')
        .andWhere('trips.completed = :completed', { completed: true })
        .getMany();

      if (completedTrips?.length) {
        // get aws image urls
        completedTrips = await this.getTripImagesUrlFromAWS(completedTrips);

        // get reviews
        const reviewIds = completedTrips
          .map((trip: TripsEntity) => trip.driverReviewId)
          .filter(Boolean);
        if (reviewIds.length) {
          completedTrips = await this.getReviews(
            completedTrips,
            reviewIds,
            ReviewExternalType.Captain,
          );
        }
      }

      this.customLogger.log(
        `[getCompletedTripsByDriver] Success | driverId: ${driverId}`,
      );
      return ResponseData.success(HttpStatus.OK, { completedTrips });
    } catch (e) {
      this.customLogger.error(
        `[getCompletedTripsByDriver] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAllTripsByRider(params: RiderIdDto) {
    try {
      const { riderId } = params;
      this.customLogger.log(`[getAllTripsByRider] riderId: ${riderId}`);

      const fields = [
        'trips.id',
        'trips.riderId',
        'trips.driverId',
        'trips.cabId',
        'trips.tripType',
        'trips.status',
        'trips.transactionStatus',
        'trips.tripStartedAt',
        'trips.createdAt',
        'trips.tripFinishedAt',
        'trips.tripDistance',
        'trips.riderReviewId',
        'trips.driverReviewId',
        'trips.tripBaseAmount',
        'trips.riderAmount',
        'trips.motAmount',
        'driver.firstName',
        'driver.lastName',
        'driver.arabicFirstName',
        'driver.arabicLastName',
        'driver.mobileNo',
        'driver.profileImage',
      ];
      let trips = await this.tripsRepository
        .createQueryBuilder('trips')
        .select(fields)
        .innerJoinAndSelect('trips.addresses', 'addresses')
        .leftJoinAndSelect(
          'trips.images',
          'images',
          'images.imageBy = :imageBy',
          { imageBy: TRIP_IMAGE_BY.RIDER },
        )
        .leftJoin('trips.driver', 'driver')
        .where('trips.riderId = :riderId', { riderId })
        .andWhere('trips.status IN (:statusIds)', {
          statusIds: [
            TripStatus.ACCEPTED_BY_DRIVER,
            TripStatus.CANCELLED_BY_DRIVER,
            TripStatus.DRIVER_ARRIVED,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.STARTED,
            TripStatus.COMPLETED,
          ],
        })
        .orderBy({
          'trips.createdAt': 'DESC',
          'images.createdAt': 'DESC',
        })
        .getMany();

      if (trips?.length) {
        // get aws image urls
        trips = await this.getTripImagesUrlFromAWS(trips, 1);

        // get rider reviews
        const riderReviewIds = trips
          .map((trip: TripsEntity) => trip.riderReviewId)
          .filter(Boolean);
        if (riderReviewIds.length) {
          trips = await this.getReviews(
            trips,
            riderReviewIds,
            ReviewExternalType.Rider,
          );
        }

        // get driver reviews
        const driverReviewIds = trips
          .map((trip: TripsEntity) => trip.driverReviewId)
          .filter(Boolean);
        if (driverReviewIds.length) {
          trips = await this.getReviews(
            trips,
            driverReviewIds,
            ReviewExternalType.Captain,
          );
        }

        this.customLogger.log(
          '[getAllTripsByRider] riderReviewIds: ' +
            JSON.stringify(riderReviewIds),
        );
        this.customLogger.log(
          '[getAllTripsByRider] driverReviewIds: ' +
            JSON.stringify(driverReviewIds),
        );

        // get trip cab types
        trips = await this.getTripCabTypes(trips);

        // get trip driver full name
        trips = this.getTripDriverFullName(trips);
      }

      this.customLogger.log(
        `[getAllTripsByRider] Success | riderId: ${riderId}`,
      );
      return ResponseData.success(HttpStatus.OK, { trips });
    } catch (e) {
      this.customLogger.error(
        `[getAllTripsByRider] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAllTripsByDriver(params: DriverIdDto) {
    try {
      const { driverId } = params;
      this.customLogger.log(`[getAllTripsByDriver] driverId: ${driverId}`);

      const fields = [
        'trips.id',
        'trips.riderId',
        'trips.driverId',
        'trips.cabId',
        'trips.tripType',
        'trips.status',
        'trips.transactionStatus',
        'trips.tripStartedAt',
        'trips.createdAt',
        'trips.tripFinishedAt',
        'trips.tripDistance',
        'trips.riderReviewId',
        'trips.driverReviewId',
        'trips.driverAmount',
        'trips.riderAmount',
        'trips.motAmount',
        'rider.firstName',
        'rider.lastName',
        'rider.arabicFirstName',
        'rider.arabicLastName',
        'rider.mobileNo',
        'rider.profileImage',
      ];
      let trips = await this.tripsRepository
        .createQueryBuilder('trips')
        .select(fields)
        .innerJoinAndSelect('trips.addresses', 'addresses')
        .leftJoinAndSelect(
          'trips.images',
          'images',
          'images.imageBy = :imageBy',
          { imageBy: TRIP_IMAGE_BY.DRIVER },
        )
        .leftJoin('trips.rider', 'rider')
        .where('trips.driverId = :driverId', { driverId })
        .andWhere('trips.status IN (:statusIds)', {
          statusIds: [
            TripStatus.ACCEPTED_BY_DRIVER,
            TripStatus.CANCELLED_BY_DRIVER,
            TripStatus.DRIVER_ARRIVED,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.STARTED,
            TripStatus.COMPLETED,
          ],
        })
        .orderBy({
          'trips.createdAt': 'DESC',
          'images.createdAt': 'DESC',
        })
        .getMany();

      if (trips?.length) {
        // get aws image urls
        trips = await this.getTripImagesUrlFromAWS(trips, 1);

        // get rider reviews
        const riderReviewIds = trips
          .map((trip: TripsEntity) => trip.riderReviewId)
          .filter(Boolean);
        if (riderReviewIds.length) {
          trips = await this.getReviews(
            trips,
            riderReviewIds,
            ReviewExternalType.Rider,
          );
        }

        // get driver reviews
        const driverReviewIds = trips
          .map((trip: TripsEntity) => trip.driverReviewId)
          .filter(Boolean);
        if (driverReviewIds.length) {
          trips = await this.getReviews(
            trips,
            driverReviewIds,
            ReviewExternalType.Captain,
          );
        }

        this.customLogger.log(
          '[getAllTripsByDriver] riderReviewIds: ' +
            JSON.stringify(riderReviewIds),
        );
        this.customLogger.log(
          '[getAllTripsByDriver] driverReviewIds: ' +
            JSON.stringify(driverReviewIds),
        );

        // get trip cab types
        trips = await this.getTripCabTypes(trips);

        // get trip driver full name
        trips = this.getTripRiderFullName(trips);
      }

      const moneyArray = trips.map((trip) => trip.driverAmount);
      const totalEarnings = moneyArray?.length
        ? moneyArray.reduce((a, b) => a + b)
        : 0;

      this.customLogger.log(
        `[getAllTripsByDriver] Success | driverId: ${driverId}`,
      );
      return ResponseData.success(HttpStatus.OK, { trips, totalEarnings });
    } catch (e) {
      this.customLogger.error(
        `[getAllTripsByDriver] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCancelledTripsByRider(params: RiderIdDto) {
    try {
      const { riderId } = params;
      this.customLogger.log(`[getCancelledTripsByRider] riderId: ${riderId}`);

      const cancelledTrips = await this.tripsRepository
        .createQueryBuilder('trips')
        .select([
          'trips.id',
          'trips.riderId',
          'trips.driverId',
          'trips.tripType',
          'trips.status',
          'trips.driverAmount',
          'trips.riderAmount',
        ])
        .innerJoinAndSelect('trips.addresses', 'addresses')
        .where('trips.riderId = :riderId', { riderId })
        .andWhere('trips.cancelledBy = :riderId', { riderId })
        .andWhere('trips.status = :cancelStatus', {
          cancelStatus: TripStatus.CANCELLED_BY_RIDER,
        })
        .andWhere('trips.tripCancelledAt IS NOT NULL')
        .getMany();

      this.customLogger.log(
        `[getCancelledTripsByRider] Success | riderId: ${riderId}`,
      );
      return ResponseData.success(HttpStatus.OK, { cancelledTrips });
    } catch (e) {
      this.customLogger.error(
        `[getCancelledTripsByRider] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCancelledTripsByDriver(params: DriverIdDto) {
    try {
      const { driverId } = params;
      this.customLogger.log(
        `[getCancelledTripsByDriver] driverId: ${driverId}`,
      );

      const cancelledTrips = await this.tripsRepository
        .createQueryBuilder('trips')
        .select([
          'trips.id',
          'trips.riderId',
          'trips.driverId',
          'trips.tripType',
          'trips.status',
          'trips.driverAmount',
          'trips.riderAmount',
        ])
        .innerJoinAndSelect('trips.addresses', 'addresses')
        .where('trips.driverId = :driverId', { driverId })
        .andWhere('trips.cancelledBy = :driverId', { driverId })
        .andWhere('trips.status = :cancelStatus', {
          cancelStatus: TripStatus.CANCELLED_BY_DRIVER,
        })
        .andWhere('trips.tripCancelledAt IS NOT NULL')
        .getMany();

      this.customLogger.log(
        `[getCancelledTripsByDriver] Success | driverId: ${driverId}`,
      );
      return ResponseData.success(HttpStatus.OK, { cancelledTrips });
    } catch (e) {
      this.customLogger.error(
        `[getCancelledTripsByDriver] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async checkTripDetails(params: RiderIdDto & DriverIdInterface) {
    try {
      const { riderId, driverId } = params;
      const runningStatus = [
        TripStatus.ACCEPTED_BY_DRIVER,
        TripStatus.REJECTED_BY_DRIVER,
        TripStatus.DRIVER_ARRIVED,
        TripStatus.STARTED,
      ];
      const existedTrip = await this.tripsRepository.findOne({
        select: ['id', 'riderId', 'driverId'],
        where: [
          {
            riderId,
            status: In(runningStatus),
          },
          {
            driverId,
            status: In(runningStatus),
          },
        ],
      });
      if (!existedTrip?.id) {
        throw new Error(errorMessage.TRIP.TRIP_NOT_FOUND);
      }
      const response = {
        tripId: existedTrip.id,
        userType: existedTrip.driverId === driverId ? 'driver' : 'rider',
      };
      this.customLogger.log(
        `[checkTripDetails] Trip found ${JSON.stringify(response)}`,
      );
      return ResponseData.success(HttpStatus.OK, response);
    } catch (e) {
      this.customLogger.error(
        `[checkTripDetails] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getTripInvoice(params: TripIdParamDto & AdminModeDTO) {
    try {
      const { tripId } = params;
      this.customLogger.log(`[getTripInvoice] tripId: ${tripId}`);
      const tripFields = [
        'trips.tripNo',
        'trips.transactionStatus',
        'trips.createdAt',
        'trips.tripBaseAmount',
        'trips.taxAmount',
        'trips.promoCodeAmount',
        'trips.riderAmount',
        'trips.promoCode',
        'trips.processingFee',
        'trips.waslFee',
        'trips.taxPercentage',
        'trips.zatcaQR',
        'trips.riderId',
        'rider.firstName',
        'rider.lastName',
        'rider.arabicFirstName',
        'rider.arabicLastName',
      ];
      const tripInvoice = await this.tripsRepository
        .createQueryBuilder('trips')
        .select(tripFields)
        .leftJoin('trips.rider', 'rider')
        .where('trips.id = :tripId', { tripId })
        .getOne();
      if (!tripInvoice) {
        this.customLogger.error(
          `[getTripDetails] ${errorMessage.TRIP.TRIP_NOT_FOUND} | tripId: ${tripId}`,
        );
        if (tripInvoice.rider) {
          tripInvoice['rider'][
            'fullName'
          ] = `${tripInvoice['rider']['firstName']} ${tripInvoice['rider']['lastName']}`;
          tripInvoice['rider']['arabicFullName'] = tripInvoice.rider
            .arabicFirstName
            ? `${tripInvoice['rider']['arabicFirstName']} ${tripInvoice['rider']['arabicLastName']}`
            : '';
        }
        throw new Error(errorMessage.TRIP.TRIP_NOT_FOUND);
      }
      tripInvoice['invoiceNo'] = getTripInvoiceNumber(tripInvoice.tripNo);
      return ResponseData.success(HttpStatus.OK, tripInvoice);
    } catch (e) {
      this.customLogger.error(
        `[getTripInvoice] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async getTripDetails(params: TripIdParamDto & AdminModeDTO) {
    try {
      const { tripId, adminMode } = params;
      this.customLogger.log(`[getTripDetails] tripId: ${tripId}`);

      const tripFields = [
        'trips.id',
        'trips.tripNo',
        'trips.tripType',
        'trips.riderId',
        'trips.driverId',
        'trips.status',
        'trips.transactionStatus',
        'trips.createdAt',
        'trips.tripStartedAt',
        'trips.tripFinishedAt',
        'trips.estimatedTripTime',
        'trips.tripTime',
        'trips.tripDistance',
        'trips.tripDistanceCovered',
        'trips.estimatedBaseAmount',
        'trips.tripBaseAmount',
        'trips.taxAmount',
        'trips.waitingCharge',
        'trips.promoCodeAmount',
        'trips.driverAmount',
        'trips.riderAmount',
        'trips.promoCode',
        'trips.riderReviewId',
        'trips.driverReviewId',
        'trips.cabId',
        'trips.processingFee',
        'trips.waslFee',
        'trips.taxPercentage',
        'trips.motAmount',
        'trips.baseFare',
        'trips.costPerMin',
        'trips.costPerKm',
        'trips.driverAssignedAt',
        'trips.driverReachedAt',
        'trips.tripStartedAt',
        'trips.tripOtp',
        'trips.zatcaQR',
        'driver.id',
        'driver.userId',
        'driver.firstName',
        'driver.lastName',
        'driver.arabicFirstName',
        'driver.arabicLastName',
        'driver.mobileNo',
        'driver.dateOfBirth',
        'driver.profileImage',
        'driver.totalTrips',
        'driver.tripsCancelled',
        'driver.tripsDeclined',
        'rider.id',
        'rider.userId',
        'rider.firstName',
        'rider.lastName',
        'rider.arabicFirstName',
        'rider.arabicLastName',
        'rider.mobileNo',
        'rider.dateOfBirth',
        'rider.profileImage',
        'rider.totalRides',
        'rider.ridesCancelled',
        'locations.latitude',
        'locations.longitude',
      ];
      let trip = await this.tripsRepository
        .createQueryBuilder('trips')
        .select(tripFields)
        .leftJoin('trips.driver', 'driver')
        .leftJoin('trips.rider', 'rider')
        .leftJoinAndSelect('trips.images', 'images')
        .innerJoinAndSelect('trips.addresses', 'addresses')
        .leftJoin(
          'trips.locations',
          'locations',
          'locations.userType = :locUserType',
          { locUserType: TripUserType.DRIVER },
        )
        .where('trips.id = :tripId', { tripId })
        .orderBy('images.createdAt', 'DESC')
        .orderBy('locations.createdAt', 'ASC')
        .getOne();

      if (!trip) {
        this.customLogger.error(
          `[getTripDetails] ${errorMessage.TRIP.TRIP_NOT_FOUND} | tripId: ${tripId}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_NOT_FOUND);
      }

      const earningPercentage = (trip.driverAmount * 100) / trip.riderAmount;
      // trip['earningPercentage'] = earningPercentage >= 0 ? Number(earningPercentage.toFixed(2)) : null
      trip['earningPercentage'] =
        earningPercentage >= 0
          ? getPercentageFormatted(earningPercentage)
          : null;
      // trip['taxAmount'] = Number((trip.tripBaseAmount * trip.taxAmount / 100).toFixed(2));

      if (trip?.images?.length) {
        // get aws image urls
        const [tripWithImages] = await this.getTripImagesUrlFromAWS([trip], 2);
        trip = tripWithImages;
      }
      if (!trip.locations?.length) {
        trip['locations'] = await this.getTripLocations(tripId, 'driver');
      }

      if (trip.rider) {
        trip['rider'][
          'fullName'
        ] = `${trip['rider']['firstName']} ${trip['rider']['lastName']}`;
        trip['rider']['arabicFullName'] = trip.rider.arabicFirstName
          ? `${trip['rider']['arabicFirstName']} ${trip['rider']['arabicLastName']}`
          : '';
      }
      if (trip.driver) {
        trip['driver'][
          'fullName'
        ] = `${trip['driver']['firstName']} ${trip['driver']['lastName']}`;
        trip['driver']['arabicFullName'] = trip.driver.arabicFirstName
          ? `${trip['driver']['arabicFirstName']} ${trip['driver']['arabicLastName']}`
          : '';
      }
      let reviewIds = [];
      if (trip.riderReviewId) {
        reviewIds = reviewIds.concat(trip.riderReviewId);
      }
      if (trip.driverReviewId) {
        reviewIds = reviewIds.concat(trip.driverReviewId);
      }
      trip['driverReview'] = {};
      trip['riderReview'] = {};
      this.customLogger.debug(
        '[getTripDetails] reviewIds: ' + JSON.stringify(reviewIds),
      );
      if (reviewIds.length) {
        this.customLogger.debug(`[getTripDetails] reviewIds: ${reviewIds}`);
        const { data } = await this.clientReviewTCP
          .send(GET_REVIEWS, JSON.stringify(reviewIds))
          .pipe()
          .toPromise();
        // const { data } = await this.reviewService.getReviews(reviewIds);
        this.customLogger.debug(
          '[getTripDetails] getReviewsRes: ' + JSON.stringify(data),
        );
        if (data && data.length) {
          const driverReview = data.find((i) => {
            return i.id === trip.driverReviewId;
          });
          const riderReview = data.find((i) => {
            return i.id === trip.riderReviewId;
          });
          if (driverReview) {
            trip['driverReview'] = driverReview;
          }
          if (riderReview) {
            trip['riderReview'] = riderReview;
          }
        }
      }
      // TODO: For Admin, we need to skip this

      const [tripWithCab] = await this.getTripCabTypes([trip]);
      trip['cab'] = tripWithCab['cab'] || {};

      //TODO: For Mobile, we need skip this
      if (trip?.driverId && trip.driver) {
        const captainId = await this.getDriversCaptainID(trip.driverId);

        const tripDriverResponse: any = await this.clientCaptainTCP
          .send(
            CAPTAIN_DETAIL,
            JSON.stringify({
              id: captainId,
              data: {
                isFullDetail: true,
                isReviewDetail: true,
                isRatingDetail: true,
              },
            }),
          )
          .pipe()
          .toPromise();
        if (
          tripDriverResponse &&
          tripDriverResponse.statusCode == HttpStatus.OK
        ) {
          trip['driver']['driverNationalId'] =
            tripDriverResponse?.data?.driverNationalId;
          trip['driver']['carPlateNo'] = tripDriverResponse?.data?.carPlateNo;
          trip['driver']['carSequenceNo'] =
            tripDriverResponse?.data?.carSequenceNo;
          trip['driver']['carLicenceType'] =
            tripDriverResponse?.data?.carLicenceType;
          trip['driver']['drivingModes'] =
            tripDriverResponse?.data?.drivingModes;
          trip['driver']['driverModeSwitch'] =
            tripDriverResponse?.data?.driverModeSwitch;
          trip['driver']['approved'] = tripDriverResponse?.data?.approved;
          trip['driver']['overallRating'] =
            tripDriverResponse?.data?.overallRating;
          trip['driver']['overallReviews'] =
            tripDriverResponse?.data?.overallReviews;
          trip['driver']['ratingCounts'] =
            tripDriverResponse?.data?.ratingCounts;
        }
      }
      // Rider rating and reviews
      const { data: customerReview } = await this.clientReviewTCP
        .send(
          GET_META_REVIEW_BY_EXTERNAL,
          JSON.stringify({
            externalId: trip?.riderId,
            externalType: ReviewExternalType.Rider,
          }),
        )
        .pipe()
        .toPromise();
      // const { data: customerReview } = await this.reviewService.getMetaReviewByExternal({ externalId: trip?.riderId, externalType: ReviewExternalType.Rider })
      trip['rider']['overallRating'] = customerReview?.overallRating || 0;
      trip['rider']['overallReviews'] = customerReview?.overallReviews || 0;

      this.customLogger.log(`[getTripDetails] Success | tripId: ${tripId}`);

      const tripDetails: any = trip;
      if (tripDetails?.tripNo) {
        tripDetails['tripNo'] = getTripNumber(tripDetails['tripNo']);
      } else {
        tripDetails['tripNo'] = '';
      }
      if (!trip.driver) {
        tripDetails['driver'] = {};
      }

      tripDetails.totalTripDistanceAmt = getAmountFormatted(
        +tripDetails.costPerKm *
          (tripDetails?.tripDistanceCovered || tripDetails?.tripDistance),
      );
      tripDetails.totalTripTimeAmt = getAmountFormatted(
        +tripDetails.costPerMin *
          (tripDetails?.tripTime || tripDetails?.estimatedTripTime),
      );

      if (adminMode === true) {
        const pickupAddress = trip.addresses.find(
          (address) => address.addressType === AddressType.PICK_UP,
        );
        const dropoffAddress = trip.addresses.find(
          (address) => address.addressType === AddressType.DROP_OFF,
        );
        const destinationAddress = trip.addresses.find(
          (address) => address.addressType === AddressType.DESTINATION,
        );
        trip.addresses = [];
        trip.addresses.push(pickupAddress);
        if (dropoffAddress) {
          trip.addresses.push(dropoffAddress);
        } else if (destinationAddress) {
          trip.addresses.push(destinationAddress);
        }
      }

      return ResponseData.success(HttpStatus.OK, { trip: tripDetails });
    } catch (e) {
      this.customLogger.error(
        `[getTripDetails] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async driverReachedAtPickUpPoint(data: TripIdParamDto & DriverIdDto) {
    try {
      const { tripId, driverId } = data;
      this.customLogger.log(
        `[driverReachedAtPickUpPoint] tripId: ${tripId} | driverId: ${driverId}`,
      );

      const trip = await this.getTripById(tripId, {
        select: ['id', 'status', 'tripNo', 'riderId', 'driverId'],
      });

      this.checkIsDriverAuthorized(trip.driverId, driverId, trip.id);

      const captainId = await this.getDriversCaptainID(driverId);

      this.checkIsTripActionAllowed(trip.id, trip.status);

      if (trip.status === TripStatus.DRIVER_ARRIVED) {
        this.customLogger.error(
          `[driverReachedAtPickUpPoint] ${errorMessage.TRIP.DRIVER_ALREADY_ARRIVED} | Trip-Status: ${trip.status}`,
        );
        throw new Error(errorMessage.TRIP.DRIVER_ALREADY_ARRIVED);
      }

      if (trip.status !== TripStatus.ACCEPTED_BY_DRIVER) {
        this.customLogger.error(
          `[driverReachedAtPickUpPoint] ${errorMessage.TRIP.TRIP_SHOULD_ACCEPTED_TO_PICKUP_CUSTOMER} | Trip-Status: ${trip.status}`,
        );
        throw new Error(
          errorMessage.TRIP.TRIP_SHOULD_ACCEPTED_TO_PICKUP_CUSTOMER,
        );
      }

      await this.tripsRepository.update(
        { id: tripId },
        { status: TripStatus.DRIVER_ARRIVED, driverReachedAt: getTimestamp() },
      );
      this.customLogger.log(
        `[driverReachedAtPickUpPoint] Record updated to trip`,
      );

      // notify trip details
      this.notifyTripDetail(tripId, 'driver_reached');

      // send notifications
      this.sendNotifications('driver_reached', trip, trip?.driverId);

      this.customLogger.log(
        `[driverReachedAtPickUpPoint] Success | tripId: ${tripId} | driverId: ${driverId}`,
      );

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged();

      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.DRIVER_ARRIVED,
      });
    } catch (e) {
      this.customLogger.error(
        `[driverReachedAtPickUpPoint] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyTripOtp(tripOtp: number, paramOtp: number) {
    if (tripOtp !== Number(paramOtp)) {
      this.customLogger.error(
        `[verifyTripOtp] ${
          errorMessage.TRIP.INVALID_TRIP_OTP
        } | Trip-OTP: ${tripOtp} | Input-OTP: ${Number(paramOtp)}`,
      );
      throw new Error(errorMessage.TRIP.INVALID_TRIP_OTP);
    }

    this.customLogger.log(`[verifyTripOtp] OTP verified ✔`);
    return;
  }

  async tripStarted(params: TripIdParamDto & TripStartedBodyDto & DriverIdDto) {
    try {
      const { tripId, tripOtp, driverId } = params;
      this.customLogger.log(
        `[tripStarted] tripId: ${tripId} | driverId: ${driverId}`,
      );

      const trip = await this.getTripById(tripId, {
        select: [
          'id',
          'status',
          'tripNo',
          'riderId',
          'driverId',
          'tripVerified',
          'tripOtp',
          'driverReachedAt',
          'cabId',
        ],
      });

      this.checkIsDriverAuthorized(trip.driverId, driverId, trip.id);

      const captainId = await this.getDriversCaptainID(driverId);

      this.checkIsTripActionAllowed(trip.id, trip.status);

      if (trip.status === TripStatus.STARTED) {
        this.customLogger.error(
          `[tripStarted] ${errorMessage.TRIP.TRIP_HAS_BEEN_STARTED} | tripId: ${tripId} | Trip-status: ${trip.status}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_STARTED);
      }

      if (trip.status !== TripStatus.DRIVER_ARRIVED) {
        this.customLogger.error(
          `[tripStarted] ${errorMessage.TRIP.DRIVER_DID_NOT_ARRIVED} | tripId: ${tripId} | Trip-status: ${trip.status}`,
        );
        throw new Error(errorMessage.TRIP.DRIVER_DID_NOT_ARRIVED);
      }

      if (!trip.tripVerified) {
        await this.verifyTripOtp(trip.tripOtp, tripOtp);
      }

      const waitTime =
        this.calculateWaitingTime(trip.driverReachedAt, trip.id) || 0;
      let waitingCharge = 0;
      let DRIVER_WAITING_TIME_LIMIT = await this.redisHandler.getRedisKey(
        'SETTING_DRIVER_WAITING_TIME_LIMIT',
      );
      let WAITING_CHARGE_PER_MINUTE = await this.getWaitingChargePerMinute(
        trip.cabId,
      );

      // to calculate waiting cost
      if (waitTime > DRIVER_WAITING_TIME_LIMIT) {
        waitingCharge =
          (waitTime - DRIVER_WAITING_TIME_LIMIT) * WAITING_CHARGE_PER_MINUTE;
      }
      await this.tripsRepository.update(
        { id: tripId },
        {
          status: TripStatus.STARTED,
          waitingCharge,
          tripStartedAt: getTimestamp(),
          tripVerified: true,
        },
      );
      this.customLogger.log(
        `[tripStarted] Trip record updated ✔ | tripId: ${tripId} | driverId: ${driverId}`,
      );

      // notify trip details
      this.notifyTripDetail(tripId, 'trip_started');

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged();

      this.customLogger.log(
        `[tripStarted] Success ✔ | tripId: ${tripId} | driverId: ${driverId}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.TRIP_HAS_STARTED,
      });
    } catch (e) {
      this.customLogger.error(
        `[tripStarted] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async create(data: TripsCreateDTO & CabCalcParams) {
    this.customLogger.log(`[create]`);

    let driverId = null;
    if (data?.driverId) {
      driverId = data.driverId;
      const { data: customerDetail } = await this.customerService.findOne({
        driverId,
      });
      if (customerDetail?.id) {
        driverId = customerDetail.userId;
      }
      delete data['driverId'];
    }

    const { country = '', city = '' } = data;
    if (data?.country) {
      delete data['country'];
    }
    if (data?.city) {
      delete data['city'];
    }
    const trip = this.tripsRepository.create(data);

    // Calculate distance & estimate-time from google
    const originAddress = trip.addresses.find(
      (address) => address.addressType === AddressType.PICK_UP,
    );
    const destinationAddress = trip.addresses.find(
      (address) => address.addressType === AddressType.DESTINATION,
    );

    const { distance, time } = await calculateFareDistance(
      { latitude: originAddress.latitude, longitude: originAddress.longitude },
      {
        latitude: destinationAddress.latitude,
        longitude: destinationAddress.longitude,
      },
    );

    // distance & time
    trip.tripDistance = distance;
    trip.estimatedTripTime = time;

    // Cab detail charges adding in trip
    const {
      baseFare,
      costPerKm,
      costPerMin,
      fareMultiplier,
    } = await this.getCabChargeConfig(trip.cabId, { country, city });

    trip.baseFare = baseFare;
    trip.costPerKm = costPerKm;
    trip.costPerMin = costPerMin;
    trip.fareMultiplier = fareMultiplier;

    const tripBaseAmount = await this.estimateFareAmount(trip.cabId, {
      distance,
      time,
      baseFare,
      costPerMin,
      costPerKm,
      fareMultiplier,
    });
    // MOT(Ministry of Transportation) applicable
    const motAmount = await this.getMOTAmount();
    trip.motAmount = motAmount;

    // const processingFee = await this.getTripProcessingFee();

    // trip.processingFee = processingFee;

    const waslFee = await this.getTripWaslFee();
    trip.waslFee = waslFee;

    trip.estimatedBaseAmount = tripBaseAmount;
    trip.tripBaseAmount = tripBaseAmount;
    trip.driverAmount = tripBaseAmount;
    trip.promoCodeAmount = 0;

    trip.taxPercentage = await this.getTripTaxPercentage();
    trip.transactionFee =
      getAmountFormatted(tripBaseAmount / 100) *
      Number(await this.getTripBankFeePercentage());
    // const tripFees = await this.getTripFeeSum();

    trip.taxAmount = await this.calculateTaxAmount(
      tripBaseAmount,
      trip.taxPercentage,
      trip.transactionFee,
    );

    const tripInstance = await this.tripsRepository.save(trip);

    let riderAmount = await this.calculateFareAmountWithTax(tripInstance.id);
    this.customLogger.log(
      `[tripService][create] rider amount while creating trip ${riderAmount}`,
    );

    // const transactionFee =
    //   (riderAmount / 100) * Number(await this.getTripBankFeePercentage());

    // riderAmount += transactionFee;

     // riderAmount += transactionFee;
    await this.update(tripInstance.id, { riderAmount });
    // rider Wallet balance check

    

    const {data: riderWallet} = await this.clientPaymentTCP
      .send(GET_BALANCE, JSON.stringify({ externalId: trip.riderId }))
      .pipe()
      .toPromise();
    // const remainingBalance = riderWallet?.balance < 0 ? riderWallet?.balance : 0;
    //TODO GET RIDER BALANCE
    //check Auth amount is not less than trip cost + if wallet balance negative

    if (riderAmount > riderWallet?.balance) {
      this.customLogger.error(
        `[tripService][create]sum of rider amount and remaning charges are greater than auth TOTAL AMOUNT: ${
          riderAmount } and BALANCE AMOUNT : ${riderWallet?.balance}`,
      );
      await this.update(tripInstance.id, {
        tripExpiredAt: getTimestamp(),
        status: TripStatus.EXPIRED,
        riderAmount
      });
      throw new Error(errorMessage.TRIP.RIDER_HAS_INSUFFICIENT_BALANCE);
    }

    await this.update(tripInstance.id, { riderAmount });

    // update rider stats
    const { data: customerDetail } = await this.customerService.findOne({
      userId: Number(trip.riderId),
    });
    if (customerDetail?.id) {
      if (data.tripType === TripType.SCHEDULED) {
        this.customerService.updateCustomer(customerDetail.id, {
          upcomingRides: customerDetail.upcomingRides + 1,
          isRider: true,
        });
      } else if (!customerDetail?.isRider) {
        this.customerService.updateCustomer(customerDetail.id, {
          isRider: true,
        });
      }
    }

    ///temp

    // driverId = '966220000001';
    ///temp end

    // If admin choosen specific driver
    if (driverId) {
      let DRIVER_DECLINE_TIME_LIMIT = await this.redisHandler.getRedisKey(
        'SETTING_DRIVER_DECLINE_TIME_LIMIT',
      );
      const retData = await this.tripDriversService.create({
        driverId,
        trip,
        // expiredAt: getTimestamp(Number(DRIVER_DECLINE_TIME_LIMIT || 2)),
         expiredAt: getTimestamp(Number(30)),
      });
      // notify trip details
      this.notifyTripDetail(trip.id, 'trip_request', {
        driverId,
        tripExpireTime: retData.expiredAt,
      });
      // send notifications
      this.sendNotifications('trip_request', trip, driverId, {
        tripExpireTime: retData.expiredAt,
      });
    } else {
      await this.emitTripsToKafka(tripInstance.id);
    }

    // Updates admin dashboard stats as new trip created
    await this.notifyAdminDashboardAsNewTripCreated();

    return trip;
  }

  async update(id: string, data: TripsUpdateDTO) {
    this.customLogger.log(`[update] | trip: ${id}`);

    await this.getTripById(id, { select: ['id'] });
    await this.tripsRepository.update({ id }, data);
    this.customLogger.log(`[update] Success ✔ | trip: ${id}`);

    return ResponseData.success(HttpStatus.OK, {
      id,
      message: successMessage.TRIP.RECORD_UPDATED,
    });
  }

  async notifyRidersForScheduledTrips() {
    try {
      this.customLogger.log(`[notifyRidersForScheduledTrips]`);

      const currentDate = new Date();
      const rideScheduleAt = new Date();

      const NOTIFY_TIME_SCHEDULED_TRIP = await this.redisHandler.getRedisKey(
        'SETTING_NOTIFY_TIME_SCHEDULED_TRIP',
      );
      this.customLogger.log(
        `[notifyRidersForScheduledTrips] notify time for schedule trip | ${NOTIFY_TIME_SCHEDULED_TRIP}`,
      );

      rideScheduleAt.setMinutes(
        currentDate.getMinutes() + Number(NOTIFY_TIME_SCHEDULED_TRIP),
      );
      this.customLogger.log(
        `[notifyRidersForScheduledTrips] currentDate | ${currentDate}`,
      );
      this.customLogger.log(
        `[notifyRidersForScheduledTrips] rideScheduleAt | ${rideScheduleAt}`,
      );

      const trips = await this.tripsRepository
        .createQueryBuilder('trips')
        .select([
          'trips.id',
          'trips.tripNo',
          'trips.riderId',
          'trips.driverId',
          'trips.riderScheduledAt',
        ])
        .where({
          status: TripStatus.PENDING,
          previousStatus: TripPreviousStatus.IN_PROGRESS,
          tripType: TripType.SCHEDULED,
          riderNotifiedAt: null,
          completed: false,
          riderScheduledAt: Raw(
            (alias) =>
              `${alias} <= :rideScheduleAt AND ${alias} > :currentDate`,
            {
              rideScheduleAt: rideScheduleAt,
              currentDate: currentDate,
            },
          ),
        })
        .getMany();
      this.customLogger.log(
        `[notifyRidersForScheduledTrips] Trips find success ✔ | tripsCount: ${trips.length}`,
      );

      if (trips?.length > 0) {
        for (const singleTrip of trips) {
          // Save timestamp when rider gets notified for scheduled trip confirmation
          const data: TripsUpdateDTO = {
            riderNotifiedAt: getTimestamp(),
          };
          await this.update(singleTrip.id, data);

          this.notifyRiderScheduleTrip(singleTrip);
        }
      }
      return trips;
    } catch (e) {
      this.customLogger.error(
        `[notifyRidersForScheduledTrips] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async processScheduledTrips() {
    try {
      this.customLogger.log(`[processScheduledTrips]`);

      const currentDate = new Date();
      const rideScheduleAt = new Date();

      /*
        It will find scheduled trips which can be processed within 5 mins from current time, 
        above function will execute on every 5 mins, so adding 5 mins to set range 
      */
      rideScheduleAt.setMinutes(currentDate.getMinutes() + 5);

      this.customLogger.log(
        `[processScheduledTrips] currentDate | ${currentDate}`,
      );
      this.customLogger.log(
        `[processScheduledTrips] rideScheduleAt | ${rideScheduleAt}`,
      );

      const trips = await this.tripsRepository
        .createQueryBuilder('trips')
        .select([
          'trips.id',
          'trips.tripNo',
          'trips.riderId',
          'trips.driverId',
          'trips.riderScheduledAt',
        ])
        .where({
          status: TripStatus.PENDING,
          previousStatus: TripPreviousStatus.IN_PROGRESS,
          tripType: TripType.SCHEDULED,
          completed: false,
          riderScheduledAt: Raw(
            (alias) =>
              `${alias} < :rideScheduleAt AND ${alias} >= :currentDate`,
            {
              rideScheduleAt: rideScheduleAt,
              currentDate: currentDate,
            },
          ),
        })
        .getMany();

      this.customLogger.log(
        `[processScheduledTrips] Trips find success ✔ | tripsCount: ${trips.length}`,
      );

      if (trips?.length) {
        for (const trip of trips) {
          // update rider stats
          const { data: customerDetail } = await this.customerService.findOne({
            userId: Number(trip.riderId),
          });
          if (customerDetail) {
            const upcomingRides = customerDetail.upcomingRides - 1;
            await this.customerService.updateCustomer(customerDetail.id, {
              upcomingRides: upcomingRides > 0 ? upcomingRides : 0,
            });
          }

          await this.checkIfScheduledTripCanBeProcessed(trip);
        }
      }
    } catch (e) {
      this.customLogger.error(
        `[processScheduledTrips] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  /*
    As soon as scheduled trip process time comes in it will check following conditions:
    1. Rider's current trip is in progress
    2. Rider's driver mode on
    If either condition gets true then it will notify rider for condition violation 
    and cancel that scheduled trip and terminate it from being processed
  */
  async checkIfScheduledTripCanBeProcessed(scheduledTrip: TripsEntity) {
    // Finds rider running trip
    const runningTrip = await this.tripsRepository.findOne({
      id: Not(scheduledTrip.id),
      riderId: scheduledTrip.riderId,
      completed: false,
      tripCancelledAt: IsNull(),
      tripExpiredAt: IsNull(),
      status: Not(In([TripStatus.NO_DRIVER])),
    });

    this.customLogger.log(
      `[checkIfScheduledTripCanBeProcessed] runningTrip: ${runningTrip?.id}`,
    );

    if (runningTrip) {
      await this.tripsRepository.update(scheduledTrip.id, {
        status: TripStatus.EXPIRED,
        tripExpiredAt: getTimestamp(),
      });

      this.notifyTripDetail(
        scheduledTrip.id,
        'scheduled_trip_cancelled_as_current_trip_is_in_progress',
      );
      this.sendNotifications(
        'scheduled_trip_cancelled_as_current_trip_is_in_progress',
        scheduledTrip,
        null,
      );

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged();

      return;
    }

    const captainResponse = await this.clientCaptainTCP
      .send(
        GET_DRIVER_MODE,
        JSON.stringify({ userId: String(scheduledTrip.riderId) }),
      )
      .pipe()
      .toPromise();
    this.customLogger.log(
      `[checkIfScheduledTripCanBeProcessed] Captain response > ${JSON.stringify(
        captainResponse,
      )}`,
    );

    if (captainResponse && captainResponse.statusCode == HttpStatus.OK) {
      if (captainResponse.data) {
        const { driverModeSwitch } = captainResponse.data;
        if (driverModeSwitch && driverModeSwitch === true) {
          await this.tripsRepository.update(scheduledTrip.id, {
            status: TripStatus.EXPIRED,
            tripExpiredAt: getTimestamp(),
          });

          this.notifyTripDetail(
            scheduledTrip.id,
            'scheduled_trip_cancelled_as_driver_mode_is_on',
          );
          this.sendNotifications(
            'scheduled_trip_cancelled_as_driver_mode_is_on',
            scheduledTrip,
            null,
          );

          // Updates admin dashboard stats as trip status changed
          await this.notifyAdminDashboardAsTripStatusChanged();

          return;
        }
      }
    } else {
      this.customLogger.error(
        `[checkIfScheduledTripCanBeProcessed] ${GET_DRIVER_MODE} has error`,
      );
      this.notifyTripDetail(
        scheduledTrip.id,
        'error_while_processing_scheduled_trip',
      );
      return;
    }

    this.customLogger.log(
      `[checkIfScheduledTripCanBeProcessed] Following scheduled trip will be processed | tripId: ${scheduledTrip.id}`,
    );

    // Proceed for scheduled trip processing
    this.processTripFromKafka(scheduledTrip.id);
  }

  async getPreviousChargeRecord(riderId: string) {
    this.customLogger.log(`[getPreviousChargeRecord] | riderId: ${riderId}`);

    const record = await this.remainingChargesRepository.findOne({ riderId });

    this.customLogger.log(
      `[getPreviousChargeRecord] | record: ${JSON.stringify(record)}`,
    );
    return record;
  }

  async removePreviousChargeRecord(riderId: string) {
    try {
      this.customLogger.log(
        `[removePreviousChargeRecord] | riderId: ${riderId}`,
      );

      await this.remainingChargesRepository.delete({ riderId });

      this.customLogger.log(
        `[removePreviousChargeRecord] | Deleted ✔ | ${successMessage.TRIP.PREVIOUS_CHARGES_COVERED} | riderId: ${riderId}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.PREVIOUS_CHARGES_COVERED,
      });
    } catch (e) {
      this.customLogger.error(
        `[removePreviousChargeRecord] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async tripCompleted(params: TripChangeDestinationInterface & SessionIdDto) {
    try {
      const {
        tripId,
        driverId,
        sessionId,
        address,
        cityNameInArabic,
        latitude,
        longitude,
      } = params;
      this.customLogger.log(
        `[tripCompleted] | tripId: ${tripId} | driverId: ${driverId}`,
      );

      const trip = await this.getTripById(tripId, {
        relations: ['addresses'],
        select: [
          'id',
          'tripBaseAmount',
          'tripNo',
          'riderId',
          'driverId',
          'tripCancelledAt',
          'tripFinishedAt',
          'tripTime',
          'tripDistanceCovered',
          'tripStartedAt',
          'completed',
          'cabId',
          'riderAmount',
          'driverAmount',
          'status',
          'taxPercentage',
          'taxAmount',
          'motAmount',
          'baseFare',
          'costPerKm',
          'costPerMin',
          'fareMultiplier',
          'processingFee',
          'waslFee',
          'waitingCharge',
          'transactionFee',
          'promoCodeAmount'
        ],
      });

      this.checkIsDriverAuthorized(trip.driverId, driverId, trip.id);

      const captainId = await this.getDriversCaptainID(driverId);

      this.checkIsTripActionAllowed(trip.id, trip.status);

      if (!!trip.tripCancelledAt) {
        this.customLogger.error(
          `[tripCompleted] | ${errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED} | tripCancelledAt: ${trip.tripCancelledAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED);
      }

      if (trip.completed) {
        this.customLogger.error(
          `[tripCompleted] | ${errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED} | completed: ${trip.completed}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED);
      }

      if (!trip.tripStartedAt) {
        this.customLogger.error(
          `[tripCompleted] | Trip completed Error | tripId: ${tripId} | driverId: ${driverId} | riderId: ${trip.riderId}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_NOT_STARTED);
      }

      // Calculate distance & estimate-time from google
      const originAddress = trip.addresses.find(
        (address) => address.addressType === AddressType.PICK_UP,
      );
      /*const { distance: tripDistanceCovered } = await calculateFareDistance(
        { latitude: originAddress.latitude, longitude: originAddress.longitude },
        { latitude: latitude, longitude: longitude }
      )*/
      let driverLocations = await this.getTripLocations(tripId, 'driver');
      const { distance: tripDistanceCovered } = await getDirectionBasedDistance(
        {
          latitude: originAddress.latitude,
          longitude: originAddress.longitude,
        },
        { latitude, longitude },
        // driverLocations,
      );
      this.customLogger.log(
        `[tripCompleted] | Trip's distance covered | tripDistanceCovered: ${tripDistanceCovered}`,
      );

      const tripDropOffAddress = this.tripAddressRepository.create({
        address,
        cityNameInArabic,
        latitude,
        longitude,
        addressType: AddressType.DROP_OFF,
        trip,
      });
      await this.tripAddressRepository.save(tripDropOffAddress);
      this.customLogger.log(
        `[tripCompleted] | Trip's drop off address saved successfully ✔ | tripId: ${tripId}`,
      );

      // const tripTime = Math.floor((new Date(getTimestamp()).getTime() - new Date(trip.tripStartedAt).getTime()) / 60000)
      const tripTime = getCalculatedTripTime(
        trip.tripStartedAt,
        new Date(getTimestamp()),
      );
      this.customLogger.log(
        `[tripCompleted] | Trip's total time | ${tripTime}`,
      );
      // update trip base amount
      const tripBaseAmount = await this.estimateFareAmount(trip.cabId, {
        distance: tripDistanceCovered,
        time: tripTime,
        baseFare: trip.baseFare,
        costPerKm: trip.costPerKm,
        costPerMin: trip.costPerMin,
        fareMultiplier: trip.fareMultiplier,
      }); // dist.distance
      this.customLogger.log(
        `[tripCompleted] | Trip's base amount | new: ${tripBaseAmount} | old: ${trip.tripBaseAmount}`,
      );
      const tripWaitingCharges: number = trip?.waitingCharge || 0;
      const tripFees = await this.getTripFeeSum();

      const transactionFee =
        getAmountFormatted((tripBaseAmount + tripWaitingCharges) / 100) *
        Number(await this.getTripBankFeePercentage());
      const taxAmount = await this.calculateTaxAmount(
        tripBaseAmount + tripWaitingCharges,
        trip.taxPercentage,
        transactionFee,
      );
      this.customLogger.log(
        `[tripCompleted] | Trip's tax amount | new: ${taxAmount} | old: ${trip.taxAmount}`,
      );

      const withdrawalFee = await this.ibanTransferFee();

      await this.update(trip.id, { tripBaseAmount, taxAmount, withdrawalFee });
      this.customLogger.log(
        `[tripCompleted] | Updated base amount Success | tripId: ${tripId}`,
      );

      // calculate rider amount
      let riderAmount = await this.calculateFareAmountWithTax(tripId);

      // const bankFee =
      //   (riderAmount / 100) * Number(await this.getTripBankFeePercentage());

      this.customLogger.log(
        `[tripCompleted] | Trip's rider amount | riderAmount: ${riderAmount}`,
      );

      // update the blocked amount
      const updatePaymentParams: HoldUpdateParams = {
        amount: getAmountFormatted(tripBaseAmount + tripWaitingCharges),
        senderFee: getAmountFormatted(tripFees + transactionFee),
        senderTax: getAmountFormatted(taxAmount),
        tripId,
        receiverFee: trip.waslFee,
        motFee: trip.motAmount,
      };

      await this.updateTripPayment(updatePaymentParams);

      const zatcaQR = await this.clientPaymentTCP
        .send(
          GET_INVOICE_QR,
          JSON.stringify({
            data: {
              invoiceTotal: `${riderAmount}`,
              vatTotal: `${taxAmount}`,
            },
          }),
        )
        .pipe()
        .toPromise();
      // confirm the trip amount
      this.customLogger.log(
        `[tripCompleted] | zatcaQR ${JSON.stringify(zatcaQR)}`,
      );
      let paidFlag = false;
      this.customLogger.log(`[tripCompleted] | Confirm payment to e-wallet`);
      paidFlag = await this.confirmTripPayment(tripId, trip.promoCodeAmount); 
      

      await this.removePreviousChargeRecord(trip.riderId);

      const data: TripsUpdateDTO = {
        status: TripStatus.COMPLETED,
        transactionStatus: TransactionStatus.DEDUCTED,
        completed: true,
        paid: paidFlag,
        tripTime,
        tripDistanceCovered,
        driverAmount: getAmountFormatted(tripBaseAmount + tripWaitingCharges),
        tripBaseAmount,
        riderAmount,
        riderPaidAt: getTimestamp(),
        tripFinishedAt: getTimestamp(),
        zatcaQR: zatcaQR?.data?.QR,
      };
      await this.update(tripId, data);
      this.customLogger.log(
        `[tripCompleted] | Record updated Success ✔ | tripId: ${tripId}`,
      );

      this.updateTripLocations(tripId);

      // update rider stats
      const { data: customerDetail } = await this.customerService.findOne({
        userId: Number(trip.riderId),
      });
      await this.customerService.updateCustomer(customerDetail.id, {
        totalRides: customerDetail.totalRides + 1,
        totalSpent: getAmountFormatted(customerDetail.totalSpent + riderAmount),
      });
      this.customLogger.log(
        `[tripCompleted] | Record updated successfully for Rider ✔ | Rider: ${trip.riderId} | totalRides: ${customerDetail.totalRides}`,
      );

      // update driver stats
      this.clientCaptainKafka.emit(
        CHANGE_DRIVER_AVAILABILITY,
        JSON.stringify({ id: captainId, status: false }),
      );

      const { data: driverDetail } = await this.customerService.findOne({
        driverId: captainId,
      });
      await this.customerService.updateCustomer(driverDetail.id, {
        totalTrips: driverDetail.totalTrips + 1,
        totalEarned: getAmountFormatted(
          driverDetail.totalEarned + (tripBaseAmount + tripWaitingCharges),
        ),
      });
      this.customLogger.log(
        `[tripCompleted] | Record updated successfully for Driver ✔ | Driver: ${trip.driverId} | totalTrips: ${driverDetail.totalTrips}`,
      );

      // --------- START ----- Deduct Remaining Due Amount for subscription from driver wallet
      if (false) {
        //(paidFlag)
        this.customLogger.log(
          `[tripCompleted] | Deduct due subscription payment from driver | Driver: ${driverDetail.userId}`,
        );
        const subscription = await this.clientPaymentTCP
          .send(
            GET_USER_SUBSCRIPTION_DETAIL,
            JSON.stringify({
              userId: driverDetail.userId,
              status: SUBSCRIPTION_STATUS.ACTIVE,
            }),
          )
          .pipe()
          .toPromise();
        this.customLogger.log(subscription, 'subscription');

        if (
          subscription &&
          subscription.statusCode === HttpStatus.OK &&
          subscription?.data?.dueAmount > 0
        ) {
          const dueAmount: number = subscription?.data?.dueAmount;
          const driverAmount: number = trip.driverAmount;
          const amountToDeduct: number =
            dueAmount <= driverAmount ? dueAmount : driverAmount;

          this.customLogger.log(
            `[tripCompleted] | Deduct due subscription payment from driver | dueAmount: ${dueAmount} | driverAmount: ${driverAmount} | amountToDeduct: ${amountToDeduct}`,
          );

          const payload = {
            customerId: driverDetail.userId,
            amount: amountToDeduct,
            fee: 0, // TODO add fee
            tax: 0, // TODO add tax
          };

          const subTransaction = await this.clientPaymentTCP
            .send(ADD_SUBSCRIPTION_TRANSACTION, JSON.stringify(payload))
            .pipe()
            .toPromise();
          this.customLogger.debug(
            JSON.stringify(subTransaction.data),
            'subTransaction',
          );

          if (subTransaction && subTransaction.statusCode === HttpStatus.OK) {
            this.customLogger.log(
              `[tripCompleted] | Deduct due subscription payment from driver Success ✔ | Driver: ${driverDetail.userId}`,
            );
            await this.clientPaymentTCP
              .send(
                UPDATE_USER_SUBSCRIPTION,
                JSON.stringify({
                  id: subscription.data.id,
                  data: {
                    paidAmount: subscription.data.paidAmount + amountToDeduct,
                    dueAmount: subscription.data.dueAmount - amountToDeduct,
                  },
                }),
              )
              .pipe()
              .toPromise();
          } else {
            this.customLogger.error(
              `[tripCompleted] | Deduct due subscription payment from driver Error | Driver: ${driverDetail.userId}`,
            );
          }
        }
      }
      // --------- END ----- Deduct Remaining Amt for subscription from driver wallet

      // notify trip details
      this.notifyTripDetail(tripId, 'trip_completed');

      // send notifications
      const tripUpdated = await this.getTripById(tripId, {
        relations: ['addresses'],
        select: [
          'id',
          'tripBaseAmount',
          'tripNo',
          'riderId',
          'driverId',
          'tripCancelledAt',
          'tripFinishedAt',
          'tripTime',
          'tripDistanceCovered',
          'tripStartedAt',
          'completed',
          'cabId',
          'riderAmount',
          'driverAmount',
          'status',
          'taxPercentage',
          'taxAmount',
          'baseFare',
          'costPerKm',
          'costPerMin',
        ],
      });

      this.sendNotifications(
        'trip_completed',
        tripUpdated,
        tripUpdated?.driverId,
      );

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged(TripStatus.COMPLETED);

      this.customLogger.log(
        `Trip Completed has success for tripId: ${tripId} `,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.TRIP_COMPLETED,
      });
    } catch (e) {
      this.customLogger.error(
        `[tripCompleted] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async tripCancelledByRider(
    tripCancelDto: RiderTripCancelDto & TripIdParamDto & RiderIdDto,
  ) {
    try {
      const { tripId, declinedReason, riderId, dropAddress } = tripCancelDto;
      this.customLogger.log(`[tripCancelledByRider] riderId: ${riderId}`);
      this.customLogger.log(
        `[tripCancelledByRider] dropAddress: ${JSON.stringify(dropAddress)}`,
      );

      const trip = await this.getTripById(tripId, {
        relations: ['addresses', 'drivers'],
        select: [
          'id',
          'tripNo',
          'riderId',
          'driverId',
          'tripExpiredAt',
          'completed',
          'tripCancelledAt',
          'promoCode',
          'tripStartedAt',
          'taxAmount',
          'waitingCharge',
          'status',
          'driverAssignedAt',
          'tripBaseAmount',
          'cabId',
          'baseFare',
          'costPerKm',
          'costPerMin',
          'fareMultiplier',
          'motAmount',
          'processingFee',
          'waslFee',
        ],
      });

      this.checkIsRiderAuthorized(trip.riderId, riderId, trip.id);

      // Validations
      this.checkIsTripActionAllowed(trip.id, trip.status);

      if (!!trip.tripExpiredAt) {
        this.customLogger.error(
          `[tripCancelledByRider] ${errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED} | tripExpiredAt" ${trip.tripExpiredAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED);
      }
      if (!!trip.tripCancelledAt) {
        this.customLogger.error(
          `[tripCancelledByRider] ${errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED} | tripCancelledAt" ${trip.tripCancelledAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED);
      }
      if (trip.completed) {
        this.customLogger.error(
          `[tripCancelledByRider] ${errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED} | completed" ${trip.completed}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED);
      }

      if (!!trip.tripStartedAt) {
        if (!dropAddress) {
          throw new Error(errorMessage.TRIP.TRIP_RIDER_DROP_LOCATION_NOT_FOUND);
        }
        if (dropAddress && !dropAddress?.latitude) {
          throw new Error(
            errorMessage.TRIP.TRIP_RIDER_DROP_LOCATION_NOT_FOUND_LAT,
          );
        }
        if (dropAddress && !dropAddress?.longitude) {
          throw new Error(
            errorMessage.TRIP.TRIP_RIDER_DROP_LOCATION_NOT_FOUND_LONG,
          );
        }

        // actual time travelled (trip start to current time)
        // const tripTime = Math.floor((new Date(getTimestamp()).getTime() - new Date(trip.tripStartedAt).getTime()) / 60000)
        const time_travelled = getCalculatedTripTime(
          trip.tripStartedAt,
          new Date(getTimestamp()),
        );

        // Calculate distance & estimate-time from google
        const originAddress = trip.addresses.find(
          (address) => address.addressType === AddressType.PICK_UP,
        );

        /*const { distance: distanceTravelled, time: tripTime } = await calculateFareDistance(
          { latitude: originAddress.latitude, longitude: originAddress.longitude },
          { latitude: dropAddress.latitude, longitude: dropAddress.longitude }
        );*/
        let driverLocations = await this.getTripLocations(tripId, 'driver');
        const {
          distance: distanceTravelled,
          time: tripTime,
        } = await getDirectionBasedDistance(
          {
            latitude: originAddress.latitude,
            longitude: originAddress.longitude,
          },
          { latitude: dropAddress.latitude, longitude: dropAddress.longitude },
          driverLocations,
        );

        const tripBaseAmount = await this.estimateFareAmount(trip.cabId, {
          distance: distanceTravelled,
          time: time_travelled,
          baseFare: trip.baseFare,
          costPerKm: trip.costPerKm,
          costPerMin: trip.costPerMin,
          fareMultiplier: trip.fareMultiplier,
        });
        const waitingRecord = await this.getPreviousChargeRecord(trip.riderId);

        const tripFees = await this.getTripFeeSum();
        const transactionFee =
          getAmountFormatted(tripBaseAmount / 100) *
          Number(await this.getTripBankFeePercentage());
        const taxAmount = await this.calculateTaxAmount(
          tripBaseAmount,
          trip.taxPercentage,
          transactionFee,
        );

        const riderAmount = await this.calculateFareAmountWithTax(trip.id, {
          tripBaseAmount,
          taxAmount,
        });

        // update the amount and then confirm it
        let paidFlag = false;
        let txStatus = TransactionStatus.DEDUCTED;
        const updatePaymentParams: HoldUpdateParams = {
          amount: tripBaseAmount,
          senderFee: tripFees,
          senderTax: getAmountFormatted(taxAmount),
          tripId: tripId,
          motFee: trip.motAmount,
          receiverFee: trip.waslFee,
        };
        await this.updateTripPayment(updatePaymentParams);

        // confirm the trip amount
        this.customLogger.log(
          `[tripCancelledByRider] | Confirm payment to e-wallet`,
        );
        paidFlag = await this.confirmTripPayment(tripId);

        if (!!waitingRecord?.id) {
          try {
            await this.removePreviousChargeRecord(trip.riderId);
          } catch (e) {
            this.customLogger.error(
              `[tripCancelledByRider] Previous charges removal Error | riderId: ${trip.riderId}`,
            );
          }
        }

        const data: TripsUpdateDTO = {
          status: TripStatus.CANCELLED_BY_RIDER,
          transactionStatus: txStatus,
          riderAmount,
          driverAmount: tripBaseAmount,
          cancelledBy: riderId,
          cancelledReason: declinedReason,
          paid: paidFlag,
          riderPaidAt: getTimestamp(),
          tripCancelledAt: getTimestamp(),
          tripBaseAmount,
          estimatedBaseAmount: tripBaseAmount,
          taxAmount,
          estimatedTripTime: tripTime,
          tripTime: time_travelled,
          tripDistance: distanceTravelled,
          tripDistanceCovered: distanceTravelled,
        };
        await this.update(tripId, data);
        this.customLogger.log(
          `[tripCancelledByRider] Record updated to trip | Trip: ${tripId}`,
        );

        this.updateTripLocations(tripId);
      } else {
        let data: TripsUpdateDTO = {
          status: TripStatus.CANCELLED_BY_RIDER,
          transactionStatus: TransactionStatus.RELEASED,
          riderAmount: 0,
          driverAmount: 0,
          cancelledBy: riderId,
          cancelledReason: declinedReason,
          tripCancelledAt: getTimestamp(),
          motAmount: 0,
        };
        if (!!trip.driverAssignedAt) {
          // const cancelled_time = Math.floor((new Date(getTimestamp()).getTime() - new Date(trip.driverAssignedAt).getTime()) / 60000)
          const cancelled_time = getCalculatedTripTime(
            trip.driverAssignedAt,
            new Date(getTimestamp()),
          );
          let RIDER_CANCEL_TIME_LIMIT = await this.redisHandler.getRedisKey(
            'SETTING_RIDER_CANCEL_TIME_LIMIT',
          );
          if (cancelled_time < RIDER_CANCEL_TIME_LIMIT) {
            // Cancellation time with-in allowed limit, release the blocked amount
            this.customLogger.log(
              `[tripCancelledByRider] No cancellation charges as Rider cancelled within ${RIDER_CANCEL_TIME_LIMIT} minutes`,
            );
            await this.releaseTripPayment(tripId);
          } else {
            // Cancellation time crossed allowed limit, charge rider with baseFare(compulsory)+tax(optional)
            this.customLogger.log(
              `[tripCancelledByRider] Cancellation charges applicable as Rider cancelled after ${RIDER_CANCEL_TIME_LIMIT} minutes`,
            );
            let RIDER_CANCEL_AMOUNT_WITH_TAX = await this.redisHandler.getRedisKey(
              'SETTING_RIDER_CANCEL_AMOUNT_WITH_TAX',
            );
            let senderTax = 0;
            let cancelAmount = trip.baseFare;
            const transactionFee =
              getAmountFormatted(cancelAmount / 100) *
              Number(await this.getTripBankFeePercentage());
            if (RIDER_CANCEL_AMOUNT_WITH_TAX === '1') {
              let tripTax = await this.getTripTaxPercentage();
              senderTax = await this.calculateTaxAmount(
                cancelAmount,
                tripTax,
                transactionFee,
              );
              this.customLogger.log(
                `[tripCancelledByRider] | ${senderTax} Tax to be included`,
              );
            }

            this.customLogger.log(
              `[tripCancelledByRider] | Re-calculate Rider amount new: ${
                cancelAmount + senderTax
              } | old: ${trip.tripBaseAmount}`,
            );
            const senderFee = transactionFee; // trip.processingFee + trip.waslFee;
            // Updating the cancellation amount for rider
            const updatePaymentParams: HoldUpdateParams = {
              amount: cancelAmount,
              senderTax,
              senderFee,
              tripId,
              receiverFee: trip.waslFee,
              motFee: trip.motAmount,
            };
            await this.updateTripPayment(updatePaymentParams);

            // Confirm the cancellation amount transaction for rider
            const paidFlag = await this.confirmTripPayment(tripId);

            // Update trips table
            data = {
              ...data,
              transactionStatus: TransactionStatus.DEDUCTED,
              riderAmount: cancelAmount + senderTax + trip.motAmount,
              driverAmount: cancelAmount,
              paid: paidFlag,
              tripBaseAmount: cancelAmount,
              taxAmount: senderTax,
              motAmount: trip.motAmount,
            };
          }
          this.updateTripLocations(tripId);
        } else {
          this.customLogger.log(`[tripCancelledByRider] No driver assigned`);
        }
        await this.update(tripId, data);
        this.customLogger.log(
          `[tripCancelledByRider] Record updated to trip | Trip: ${tripId}`,
        );
      }

      // Revert promo-code if applied
      if (!!trip.promoCode) {
        try {
          await this.promoCodeAction(
            { promoCode: trip.promoCode, userId: trip.riderId },
            PromoCodeAction.REVERT,
          );
          await this.tripsRepository.update(tripId, {
            promoCode: null,
            promoCodeAmount: 0,
          });
        } catch (e) {
          this.customLogger.error(
            `[tripCancelledByRider] Promo-code end point err: Promo-code = ${trip.promoCode}`,
          );
        }
      }

      // update driver stats
      const captainId = await this.getDriversCaptainID(trip.driverId);
      this.clientCaptainKafka.emit(
        CHANGE_DRIVER_AVAILABILITY,
        JSON.stringify({ id: captainId, status: false }),
      );

      // update rider stats
      const { data: customerDetail } = await this.customerService.findOne({
        userId: Number(riderId),
      });
      await this.customerService.updateCustomer(customerDetail.id, {
        ridesCancelled: customerDetail.ridesCancelled + 1,
      });
      this.customLogger.log(
        `[tripCancelledByRider] | Record updated successfully for Rider ✔ | Rider: ${trip.riderId} | ridesCancelled: ${customerDetail.ridesCancelled}`,
      );

      // notify trip details
      this.notifyTripDetail(tripId, 'rider_cancelled');
      // send notifications
      this.sendNotifications('rider_cancelled', trip, trip?.driverId);

      this.customLogger.log(
        `[tripCancelledByRider] Success ✔ | riderId: ${riderId}`,
      );

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged(
        TripStatus.CANCELLED_BY_RIDER,
      );

      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.TRIP_CANCELLED_BY_RIDER,
      });
    } catch (e) {
      this.customLogger.error(
        `[tripCancelledByRider] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  calculateWaitingTime(driverReachedAt: Date, tripId: string) {
    this.customLogger.log(`[calculateWaitingTime] | trip: ${tripId}`);

    // const diffInMili = new Date(getTimestamp()).getTime() - new Date(driverReachedAt).getTime()
    // const diffInMinutes = Math.floor(diffInMili / 60000)
    const diffInMinutes = getCalculatedTripTime(
      driverReachedAt,
      new Date(getTimestamp()),
    );

    this.customLogger.log(
      `[calculateWaitingTime] Success ✔ | time-in-minutes: ${diffInMinutes}`,
    );
    return diffInMinutes;
  }

  async estimateFareAmount(
    cabId: string,
    params: TripAmountCalcParams & CabCalcParams & CabFareParams & tripFees,
  ) {
    try {
      const {
        time,
        distance,
        baseFare,
        costPerKm,
        costPerMin,
        fareMultiplier = 1,
      } = params;
      this.customLogger.log(
        `[estimateFareAmount] | cabId: ${cabId} | params: ${JSON.stringify(
          params,
        )}`,
      );

      let cabCharge: CabFareParams;

      if (params?.country) {
        this.customLogger.log(`[estimateFareAmount] case: country,city`);
        cabCharge = await this.getCabChargeConfig(cabId, {
          country: params.country,
          city: params.city,
        });
      } else if (baseFare > 0) {
        this.customLogger.log(`[estimateFareAmount] case: custom-values`);
        cabCharge = { cabId, baseFare, costPerKm, costPerMin, fareMultiplier };
      } else {
        this.customLogger.log(`[estimateFareAmount] case: cab-type`);
        cabCharge = await this.getCabChargeConfig(cabId, {});
      }

      if (!!cabCharge?.cabId) {
        let fareAmount =
          +cabCharge.baseFare +
          +cabCharge.costPerKm * distance +
          +cabCharge.costPerMin * time;
        // multiplier rate apply here i.e 2x,..etc
        fareAmount = fareAmount * cabCharge.fareMultiplier;
        fareAmount = getAmountFormatted(fareAmount);

        this.customLogger.log(
          `[tripService][estimateFareAmount] ${cabCharge.baseFare}+(${cabCharge.costPerKm}*${distance})+(${cabCharge.costPerMin}*${time}) | ${cabCharge.fareMultiplier}x | =====> ${fareAmount}`,
        );
        // MOT(Ministry of Transportation) applicable
        // const processingFee = await this.getTripProcessingFee();
        // const waslFee = await this.getTripWaslFee();
        return fareAmount; //+ Number(processingFee) + Number(waslFee);
      } else {
        this.customLogger.error(
          '[estimateFareAmount] Cab not Found for id: ',
          cabId,
        );
        throw new Error(errorMessage.SOMETHING_WENT_WRONG);
      }
    } catch (err) {
      this.customLogger.error(
        '[estimateFareAmount] Error in catch: ',
        err.message,
      );
      throw new Error(err?.message || errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async calculateFareAmountWithTax(
    tripId: string,
    extraParams?: AmountCalcParams,
  ) {
    this.customLogger.log(`[calculateFareAmountWithTax] | tripId: ${tripId}`);

    const trip = await this.getTripById(tripId, {
      select: [
        'id',
        'riderId',
        'taxAmount',
        'tripBaseAmount',
        'promoCodeAmount',
        'waitingCharge',
        'motAmount',
        'waslFee',
        'processingFee',
        'transactionFee',
      ],
    });

    const tripBaseAmount = extraParams?.tripBaseAmount || trip.tripBaseAmount;
    const taxAmount = extraParams?.taxAmount || trip.taxAmount;
    const promoCodeAmount =
      extraParams?.promoCodeAmount || trip.promoCodeAmount;
    const transactionFee = extraParams?.transactionFee || trip.transactionFee;
    // const motAmount = extraParams?.motAmount || trip.motAmount;
    // const processingFee = extraParams?.processingFee || trip.processingFee;
    // const waslFee = extraParams?.waslFee || trip.waslFee;

    const waitingCharge = trip.waitingCharge || 0;
    // const previousChargeRecord = await this.getPreviousChargeRecord(
    //   trip.riderId,
    // );

    let totalAmount =
      tripBaseAmount +
      taxAmount +
      waitingCharge +
      transactionFee -
      promoCodeAmount; //+
    // motAmount //+
    // processingFee +
    // waslFee;
    // + (previousChargeRecord ? previousChargeRecord.remainingCharge : 0);
    totalAmount = getAmountFormatted(totalAmount);

    this.customLogger.log(
      `[calculateFareAmountWithTax] | totalAmount: ${totalAmount}`,
    );
    return totalAmount;
  }

  async calculateTaxAmount(baseAmount: number, tax?: number, fees?: number) {
    let tripTax = tax;
    if (!tripTax) {
      tripTax = await this.getTripTaxPercentage();
    }
    fees = fees || 0;
    let taxAmount = getAmountFormatted(((baseAmount + fees) * tripTax) / 100);
    this.customLogger.log(`[calculateTaxAmount] | taxAmount: ${taxAmount}`);
    return taxAmount;
  }

  async getWaitingChargePerMinute(cabId?: string, charge?: number) {
    let chargePerMin = charge;
    this.customLogger.log(
      `[getWaitingChargePerMinute] from input | ${chargePerMin}`,
    );
    if (cabId && !chargePerMin) {
      const cabRedis = await this.redisHandler.getRedisKey(`cab-type-${cabId}`);
      chargePerMin = cabRedis?.data?.waitChargePerMin;
      this.customLogger.log(
        `[getWaitingChargePerMinute] from cab detail | ${chargePerMin}`,
      );
    }
    if (!chargePerMin) {
      chargePerMin = await this.redisHandler.getRedisKey(
        'SETTING_WAITING_CHARGE_PER_MINUTE',
      );
      this.customLogger.log(
        `[getWaitingChargePerMinute] from admin setting | ${chargePerMin}`,
      );
    }
    return getAmountFormatted(chargePerMin);
  }

  async getCabChargeConfig(cabId: string, params: CabCalcParams) {
    let cabCharge;
    let fareMultiplier = 1;
    const country = params.country || '';
    const city = params.city || '';
    if (country !== '') {
      const dayIndex = new Date().getDay();
      const keysToCheck = [
        `${country}-${city}-${dayIndex}`,
        `${country}--${dayIndex}`,
        `${country}-${city}`,
        `${country}`,
      ];
      this.customLogger.log(
        `[getCabChargeConfig] input data :: ${JSON.stringify(keysToCheck)}`,
      );
      for (let keyIndex = 0; keyIndex < keysToCheck.length; keyIndex++) {
        const chargeExist = await this.redisHandler.hget(
          `cab-charge-${cabId}`,
          keysToCheck[keyIndex],
        );
        if (chargeExist) {
          cabCharge = JSON.parse(chargeExist);
          this.customLogger.log(
            `[getCabChargeConfig] Cab charge found with ${keysToCheck[keyIndex]} | ${chargeExist}`,
          );
          break;
        }
      }

      // Multiply factor checking
      const fareMultiplierKey = `fare-multiplier-${city}-*`;
      const fareMultiplierList = await this.redisHandler.getMatchedClients(
        fareMultiplierKey,
      );
      if (fareMultiplierList.length) {
        const fareMultiplierRedis = await this.redisHandler.mget(
          fareMultiplierList,
        );
        fareMultiplierList.forEach((fareRowKey, rowIndex) => {
          const fareData = JSON.parse(fareMultiplierRedis[rowIndex]);
          this.customLogger.debug(`fare multiplier rate check | ${fareRowKey}`);
          if (fareData) {
            const currentTime = new Date();
            const fromTime = new Date(
              getIsoDateTime(new Date(fareData.fromDate)),
            );
            const toTime = new Date(getIsoDateTime(new Date(fareData.toDate)));
            this.customLogger.debug(
              `(${fareData.fromDate} <= ${currentTime} && ${fareData.toDate} >= ${currentTime})`,
            );
            if (fromTime < currentTime && toTime > currentTime) {
              this.customLogger.debug(
                `fare multiplier rate matched for ${fareRowKey} with ${fareData.multiplyRate}x`,
              );
              fareMultiplier = Number(fareData.multiplyRate || 1);
            }
          }
        });
      }
    }
    const cabRedis = await this.redisHandler.getRedisKey(`cab-type-${cabId}`);
    const cabDetail = cabRedis ? JSON.parse(cabRedis) : {};
    this.customLogger.log(
      `[getCabChargeConfig] Cab type details | ${JSON.stringify(cabDetail)}`,
    );
    const cabConfig: CabFareParams = {
      cabId: cabCharge?.cab?.id || cabDetail.id,
      baseFare: cabCharge?.passengerBaseFare || cabDetail.passengerBaseFare,
      costPerMin:
        cabCharge?.passengerCostPerMin || cabDetail.passengerCostPerMin,
      costPerKm: cabCharge?.passengerCostPerKm || cabDetail.passengerCostPerKm,
      fareMultiplier,
    };
    return cabConfig;
  }

  async getMOTAmount() {
    return 0; // (await this.redisHandler.getRedisKey('SETTING_MOT_AMOUNT')) || 0.5;
  }

  async getInstantTransferFee() {
    return (await this.redisHandler.getRedisKey('INSTANT_TRANSFER_FEE')) || 0.3;
  }

  async canReview(
    externalId: string,
    externalType: ReviewExternalType,
    driverId: string = null,
  ): Promise<string | boolean> {
    this.customLogger.log(
      `[canReview] | driverId: ${driverId} | externalId: ${externalId} | externalType: ${externalType}`,
    );

    const tripQueryInstance = this.tripsRepository
      .createQueryBuilder('trips')
      .select([
        'trips.id',
        'trips.driverId',
        'trips.driverReviewId',
        'trips.riderId',
        'trips.riderReviewId',
        'trips.createdAt',
      ])
      .where('trips.status = :status', { status: TripStatus.COMPLETED })
      .orderBy('trips.createdAt', 'DESC');

    if (externalType === ReviewExternalType.Captain) {
      tripQueryInstance.andWhere('trips.driverId = :driverId', { driverId });
    } else {
      tripQueryInstance.andWhere('trips.riderId = :externalId', { externalId });
    }

    const trip = await tripQueryInstance.getOne();

    const reviewId =
      externalType === ReviewExternalType.Captain
        ? trip?.driverReviewId
        : trip?.riderReviewId;

    if (trip?.id && !reviewId) {
      this.customLogger.log(
        `[canReview] Success ✔ | tripId: ${trip.id} | externalId: ${externalId} | externalType: ${externalType}`,
      );
      return trip.id;
    } else {
      this.customLogger.error(
        `[canReview] ${errorMessage.TRIP.REVIEW_DROPPED_ALREADY} | tripId: ${trip?.id} | reviewId: ${reviewId} | externalId: ${externalId} | externalType: ${externalType}`,
      );
      return '';
    }
  }

  async saveReview(data: SaveReviewDto & TripIdParamDto & DriverIdInterface) {
    try {
      const { tripId } = data;
      this.customLogger.log(`[saveReview] | data: ${JSON.stringify(data)}`);
      this.customLogger.log(
        `[saveReview] | tripId: ${tripId} | externalId: ${data.externalId} | externalType: ${data.externalType}`,
      );

      const trip = await this.getTripById(tripId, {
        select: [
          'id',
          'status',
          'tripNo',
          'riderId',
          'driverId',
          'completed',
          'tripBaseAmount',
          'driverAmount',
          'riderAmount',
          'taxAmount',
        ],
      });

      let driverUserId;
      const driverId = data.driverId || trip.driverId;
      if (driverId) {
        driverUserId = driverId;
        //   const driverDetails = await this.customerService.findOne({ driverId })
        //   if (driverDetails?.statusCode === HttpStatus.OK && driverDetails?.data?.userId) {
        //     driverUserId = driverDetails?.data?.userId
        //   } else {
        //     this.customLogger.error(`[saveReview] Driver not found | Driver: ${driverId}`)
        //     throw new Error(errorMessage.CAPTAIN.CAPTAIN_NOT_FOUND)
        //   }
      }

      if (trip.status !== TripStatus.COMPLETED || !trip.completed) {
        this.customLogger.error(
          `[saveReview] | ${errorMessage.TRIP.DROP_REVIEW_AFTER_COMPLETING_TRIP} | status: ${trip.status} | completed: ${trip.completed}`,
        );
        throw new Error(errorMessage.TRIP.DROP_REVIEW_AFTER_COMPLETING_TRIP);
      }

      if (data.externalType === ReviewExternalType.Rider) {
        if (trip.riderId !== data.externalId) {
          this.customLogger.error(
            `[saveReview] | ${errorMessage.TRIP.REVIEW_ACTION_NOT_ALLOWED} | riderId: ${trip.riderId} | externalId: ${data.externalId}`,
          );
          throw new Error(errorMessage.TRIP.REVIEW_ACTION_NOT_ALLOWED);
        }
      } else {
        if (driverUserId !== data.externalId) {
          this.customLogger.error(
            `[saveReview] | ${errorMessage.TRIP.REVIEW_ACTION_NOT_ALLOWED} | driverId: ${trip.driverId} | externalId: ${driverId}`,
          );
          throw new Error(errorMessage.TRIP.REVIEW_ACTION_NOT_ALLOWED);
        }
      }

      const reviewId =
        data.externalType === ReviewExternalType.Captain
          ? trip?.driverReviewId
          : trip?.riderReviewId;
      if (reviewId) {
        this.customLogger.error(
          `[saveReview] ${errorMessage.TRIP.REVIEW_DROPPED_ALREADY} | tripId: ${trip?.id} | reviewId: ${reviewId} | externalId: ${data.externalId}`,
        );
        throw new Error(errorMessage.TRIP.REVIEW_DROPPED_ALREADY);
      }
      // TODO: WASL API calling
      // const waslRes = await this.waslTripRegister(trip.id, data.rating)
      // if (!waslRes.success) {
      //   this.customLogger.error(`[saveReview] | WASL Error while registering trip, tripId: ${tripId}`)
      // }
      if (data.externalType === ReviewExternalType.Rider) {
        data.externalIdFor = driverUserId;
        data.externalIdBy = data.externalId;
      } else {
        data.externalIdFor = trip.riderId;
        data.externalIdBy = data.externalId;
      }
      const saveReviewRes = await this.clientReviewTCP
        .send(CREATE_REVIEW, JSON.stringify(data))
        .pipe()
        .toPromise();
      // const saveReviewRes = await this.reviewService.createReview(data);
      this.customLogger.debug(JSON.stringify(saveReviewRes), 'saveReviewRes');

      const { data: reviewData } = saveReviewRes;
      if (data.externalType === ReviewExternalType.Rider) {
        await this.tripsRepository.update(
          { id: tripId },
          { riderReviewId: reviewData.id },
        );
        // send notifications
        this.sendNotifications('trip_completed_by_rider', trip, trip?.driverId);
      } else {
        await this.tripsRepository.update(
          { id: tripId },
          { driverReviewId: reviewData.id },
        );
        // send notifications
        this.sendNotifications(
          'trip_completed_by_driver',
          trip,
          trip?.driverId,
        );
      }

      this.customLogger.log(
        `[saveReview] Success ✔ | tripId: ${tripId} | externalId: ${data.externalId} | externalType: ${data.externalType}`,
      );
      return ResponseData.success(HttpStatus.CREATED, {
        message: successMessage.TRIP.REVIEW_SAVED,
      });
    } catch (e) {
      this.customLogger.error(
        `[saveReview] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async changeTripDestination(
    reqBody: TripChangeDestinationInterface & SessionIdDto,
  ) {
    const {
      tripId,
      address,
      latitude,
      longitude,
      cityNameInArabic,
      riderId,
      sessionId,
    } = reqBody;
    try {
      this.customLogger.log(
        `In Change Destination for -------tripId: ${tripId}------ riderId: ${riderId}`,
      );

      const trip = await this.getTripById(tripId, {
        select: [
          'id',
          'tripNo',
          'riderId',
          'driverId',
          'tripCancelledAt',
          'completed',
          'tripStartedAt',
          'cabId',
          'changedDestination',
          'riderAmount',
          'taxPercentage',
          'baseFare',
          'costPerKm',
          'costPerMin',
          'fareMultiplier',
          'motAmount',
          'changedDestinationCount',
          'processingFee',
          'waslFee',
        ],
        relations: ['addresses'],
      });

      this.checkIsRiderAuthorized(trip.riderId, riderId, trip.id);

      if (!!trip.tripCancelledAt) {
        this.customLogger.error(
          `Trip has already been cancelled ---- tripId: ${tripId}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED);
      }
      if (trip.completed) {
        this.customLogger.error(
          `Trip has already been completed ---- tripId: ${tripId}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED);
      }
      // if (trip.changedDestination) {
      //   this.customLogger.error(`Trip Destination has already been changed ---- tripId: ${tripId} riderId: ${riderId}`);
      //   throw new Error(errorMessage.TRIP.TRIP_DESTINATION_CAN_NOT_CHANGED)
      // }
      let CHANGE_DESTINATION_LIMIT_FOR =
        (await this.redisHandler.getRedisKey(
          'SETTING_CHANGE_DESTINATION_LIMIT_FOR_RIDER',
        )) || 1;
      if (trip.changedDestinationCount >= CHANGE_DESTINATION_LIMIT_FOR) {
        this.customLogger.error(
          `Destination change limit crossed ---- tripId: ${tripId} | Max: ${CHANGE_DESTINATION_LIMIT_FOR} | Done:${trip.changedDestinationCount}`,
        );
        throw new Error(
          `You can change destination upto ${CHANGE_DESTINATION_LIMIT_FOR} times only`,
        );
      }
      if (!trip.tripStartedAt) {
        this.customLogger.error('Error while updating destination: ', tripId);
        throw new Error(errorMessage.TRIP.TRIP_NOT_STARTED);
      }

      // Calculate distance & estimate-time from google
      const originAddress = trip.addresses.find(
        (address) => address.addressType === AddressType.PICK_UP,
      );
      /*const { distance: tripDistance, time } = await calculateFareDistance(
        { latitude: originAddress.latitude, longitude: originAddress.longitude },
        { latitude: latitude, longitude: longitude }
      )*/
      let driverLocations = await this.getTripLocations(tripId, 'driver');
      const { distance: tripDistance, time } = await getDirectionBasedDistance(
        {
          latitude: originAddress.latitude,
          longitude: originAddress.longitude,
        },
        { latitude, longitude },
        driverLocations,
      );

      // Save changed location to redis for data purpose
      // const driverClientKey = `driverClient-${trip.driverId}`;
      // const driverIdVal = await this.redisHandler.getRedisKey(driverClientKey) || '';
      let driverLoc = JSON.parse(
        await this.redisHandler.getRedisKey(`location-${trip.driverId}-driver`),
      );
      const locKey = `tripDestinations-${tripId}`;
      this.redisHandler.client.rpush(
        locKey,
        JSON.stringify({
          current: {
            latitude: driverLoc?.lat || originAddress.latitude,
            longitude: driverLoc?.lon || originAddress.longitude,
          },
          destination: { latitude, longitude },
        }),
        function (err) {
          Logger.debug(
            'changeTripDestination::' +
              locKey +
              '::' +
              trip.changedDestinationCount +
              ' | error > ' +
              JSON.stringify(err),
          );
        },
      );

      // if addresses entry exist for CHANGED_DESTINATION then update, otherwise insert
      const changedAddress = trip.addresses.find(
        (address) => address.addressType === AddressType.CHANGED_DESTINATION,
      );
      if (changedAddress?.id) {
        this.tripAddressRepository.update(
          { id: changedAddress.id },
          { address, cityNameInArabic, latitude, longitude },
        );
      } else {
        const tripChangedAddress = this.tripAddressRepository.create({
          address,
          cityNameInArabic,
          latitude,
          longitude,
          addressType: AddressType.CHANGED_DESTINATION,
          trip,
        });
        await this.tripAddressRepository.save(tripChangedAddress);
      }

      const tripBaseAmount = await this.estimateFareAmount(trip.cabId, {
        distance: tripDistance,
        time,
        baseFare: trip.baseFare,
        costPerKm: trip.costPerKm,
        costPerMin: trip.costPerMin,
        fareMultiplier: trip.fareMultiplier,
      });
      const tripFees = await this.getTripFeeSum();
      const taxAmount = await this.calculateTaxAmount(
        tripBaseAmount,
        trip.taxPercentage,
        tripFees,
      );
      const riderAmount = await this.calculateFareAmountWithTax(trip.id, {
        tripBaseAmount,
        taxAmount,
      });

      // update blocked amount
      this.customLogger.log(
        `[changeTripDestination] | Recalculate rider amount and update to e-wallet | new: ${tripBaseAmount} | old: ${trip.tripBaseAmount}`,
      );
      const senderTax = getAmountFormatted(taxAmount);
      const updatePaymentParams: HoldUpdateParams = {
        amount: tripBaseAmount,
        senderTax,
        senderFee: tripFees,
        tripId: tripId,
        receiverFee: trip.waslFee,
        motFee: trip.motAmount,
      };
      await this.updateTripPayment(updatePaymentParams);

      await this.update(tripId, {
        changedDestination: true,
        changedDestinationCount: () => 'changedDestinationCount+1',
        riderAmount,
        tripBaseAmount,
        taxAmount,
        estimatedBaseAmount: tripBaseAmount,
        driverAmount: tripBaseAmount,
        tripDistance,
        estimatedTripTime: time,
        tripTime: time,
      });
      // notify trip details
      this.notifyTripDetail(tripId, 'rider_updated_destination');

      // send notifications
      trip.riderAmount = riderAmount; //notify latest amount to rider
      this.sendNotifications('rider_updated_destination', trip, trip?.driverId);

      this.customLogger.log(
        `Trip Destination change has --------success------ tripId: ${tripId}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.TRIP_DESTINATION_CHANGED_BY_RIDER,
      });
    } catch (err) {
      this.customLogger.error(
        'Error while updating destination: ',
        tripId,
        err.message,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async tripReqCancelByRider(tripReqCancelDto: TripIdParamDto & RiderIdDto) {
    try {
      const { tripId, riderId } = tripReqCancelDto;
      this.customLogger.log(`[tripReqCancelByRider] | tripId: ${tripId}`);

      const trip = await this.getTripById(tripId, {
        select: [
          'id',
          'tripNo',
          'riderId',
          'driverId',
          'status',
          'tripCancelledAt',
          'completed',
          'driverAssignedAt',
          'tripType',
        ],
      });

      this.checkIsRiderAuthorized(trip.riderId, riderId, trip.id);

      // Validations
      this.checkIsTripActionAllowed(trip.id, trip.status);

      const allowedTripStatus = [
        TripStatus.PENDING,
        TripStatus.REJECTED_BY_DRIVER,
      ];
      if (!allowedTripStatus.includes(trip.status)) {
        this.customLogger.error(
          `[tripReqCancelByRider] ${errorMessage.TRIP.BOOKING_CANT_BE_CANCELLED}`,
        );
        throw new Error(errorMessage.TRIP.BOOKING_CANT_BE_CANCELLED);
      }
      if (trip.tripType !== TripType.IMMEDIATELY) {
        this.customLogger.error(
          `[tripReqCancelByRider] Scheduled trip :: ${errorMessage.TRIP.BOOKING_CANT_BE_CANCELLED}`,
        );
        throw new Error(errorMessage.TRIP.BOOKING_CANT_BE_CANCELLED);
      }
      const data: TripsUpdateDTO = {
        status: TripStatus.BOOKING_CANCELLED,
        riderAmount: 0,
        driverAmount: 0,
        motAmount: 0,
      };
      await this.update(tripId, data);
      this.customLogger.log(
        `[tripReqCancelByRider] | Booking Request cancelled | status: ${'BOOKING_CANCELLED'}`,
      );

      this.customLogger.log(
        `[tripReqCancelByRider] Success ✔ | tripId: ${tripId} | riderId: ${riderId}`,
      );

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged();

      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.BOOKING_CANCELLED,
      });
    } catch (e) {
      this.customLogger.error(
        `[tripReqCancelByRider] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async processTripCancelledByDriver(tripId: string, tripType?: number) {
    const data: TripsUpdateDTO = {
      status: TripStatus.PENDING,
    };
    await this.update(tripId, data);
    this.processTripFromKafka(tripId);
  }

  async emitTripsToKafka(tripId: string, tripType?: number) {
    this.customLogger.log('In event emission');
    // when trip create emit this to kafka (TODO::replace this logic with @joy api)
    const pendingImmediateTrip = await this.tripsRepository.findOne({
      id: tripId,
      tripType: tripType ?? TripType.IMMEDIATELY,
      completed: false,
      driverId: null,
      status: In([
        TripStatus.PENDING,
        TripStatus.REJECTED_BY_DRIVER,
        TripStatus.NO_DRIVER,
      ]),
      tripCancelledAt: null,
      driverAssignedAt: null,
    });
    if (pendingImmediateTrip) {
      this.customLogger.log(`emit trip process | tripId: ${tripId}`);
      this.processTripFromKafka(tripId);
      return;
    } else {
      this.customLogger.log(`nothing to process | tripId: ${tripId}`);
      return;
    }
  }

  async notifyTripDetailAndSendNotification(trip: TripsEntity, action = '') {
    if (action) {
      // notify trip details
      this.notifyTripDetail(trip.id, action);
      // send notifications
      this.sendNotifications(action, trip, null);
    }
    return;
  }

  findMinimumRequestedDriverCount(tripDrivers: TripDriver[]) {
    return Math.min.apply(
      Math,
      tripDrivers.map(function (d) {
        return d.driverRequested;
      }),
    );
  }

  findTotalTripRequestsCount(tripDrivers: TripDriver[]) {
    return tripDrivers.reduce((a, b) => a + (b['driverRequested'] || 0), 0);
  }

  async findRequestsCountAndSettingLimit(tripId: string) {
    const trip: TripsEntity = await this.getTripById(tripId);

    let maxTripRequestsLimit;
    let maxDriversRequestLimit;
    let totalTripRequests;
    let totalDriversRequested;

    const requestedStatus = await this.findTripDriverRequestedStatus(tripId);

    if (requestedStatus === TripDriverRequestedStatus.TRIP_INITIATE) {
      totalDriversRequested = trip.drivers.filter(
        (tripDriver: TripDriver) =>
          tripDriver.requestedStatus === requestedStatus,
      ).length;

      const MAX_DRIVERS_REQUEST_LIMIT_FOR_PENDING_TRIP = await this.redisHandler.getRedisKey(
        'SETTING_MAX_DRIVERS_REQUEST_LIMIT_FOR_PENDING_TRIP',
      );

      if (!MAX_DRIVERS_REQUEST_LIMIT_FOR_PENDING_TRIP) {
        this.customLogger.error(
          '[findRequestsCountAndSettingLimit] redis :: SETTING_MAX_DRIVERS_REQUEST_LIMIT_FOR_PENDING_TRIP got null',
        );
      }
      maxDriversRequestLimit = MAX_DRIVERS_REQUEST_LIMIT_FOR_PENDING_TRIP;
    } else if (
      requestedStatus === TripDriverRequestedStatus.TRIP_CANCELLED_BY_DRIVER
    ) {
      totalTripRequests = trip.cancelledByDriver;

      totalDriversRequested = trip.drivers.filter(
        (tripDriver: TripDriver) =>
          tripDriver.requestedStatus === requestedStatus &&
          [TripDriverStatus.EXPIRED, TripDriverStatus.DECLINED].includes(
            tripDriver.status,
          ) &&
          tripDriver.driverGroupId === trip.cancelledByDriver,
      ).length;

      const MAX_TRIP_REQUESTS_LIMIT_FOR_CANCELLED_TRIP = await this.redisHandler.getRedisKey(
        'SETTING_MAX_TRIP_REQUESTS_LIMIT_FOR_CANCELLED_TRIP',
      );

      if (!MAX_TRIP_REQUESTS_LIMIT_FOR_CANCELLED_TRIP) {
        this.customLogger.error(
          '[findRequestsCountAndSettingLimit] redis :: SETTING_MAX_TRIP_REQUESTS_LIMIT_FOR_CANCELLED_TRIP got null',
        );
      }

      const MAX_DRIVERS_REQUEST_LIMIT_FOR_CANCELLED_TRIP = await this.redisHandler.getRedisKey(
        'SETTING_MAX_DRIVERS_REQUEST_LIMIT_FOR_CANCELLED_TRIP',
      );

      if (!MAX_DRIVERS_REQUEST_LIMIT_FOR_CANCELLED_TRIP) {
        this.customLogger.error(
          '[findRequestsCountAndSettingLimit] redis :: SETTING_MAX_DRIVERS_REQUEST_LIMIT_FOR_CANCELLED_TRIP got null',
        );
      }
      maxTripRequestsLimit = MAX_TRIP_REQUESTS_LIMIT_FOR_CANCELLED_TRIP;

      maxDriversRequestLimit = MAX_DRIVERS_REQUEST_LIMIT_FOR_CANCELLED_TRIP;
    } else if (
      requestedStatus === TripDriverRequestedStatus.TRIP_REJECTED_BY_DRIVER
    ) {
      totalTripRequests = trip.drivers.filter(
        (tripDriver: TripDriver) =>
          tripDriver.status === TripDriverStatus.DECLINED,
      ).length;

      const MAX_TRIP_REQUESTS_LIMIT_FOR_REJECTED_TRIP = await this.redisHandler.getRedisKey(
        'SETTING_MAX_TRIP_REQUESTS_LIMIT_FOR_REJECTED_TRIP',
      );

      if (!MAX_TRIP_REQUESTS_LIMIT_FOR_REJECTED_TRIP) {
        this.customLogger.error(
          '[findRequestsCountAndSettingLimit] redis :: SETTING_MAX_TRIP_REQUESTS_LIMIT_FOR_REJECTED_TRIP got null',
        );
      }
      maxTripRequestsLimit = MAX_TRIP_REQUESTS_LIMIT_FOR_REJECTED_TRIP;
    }

    return {
      totalTripRequests,
      totalDriversRequested,
      maxTripRequestsLimit,
      maxDriversRequestLimit,
    };
  }

  async findTripDriverRequestedStatus(tripId: string) {
    const trip: TripsEntity = await this.getTripById(tripId);

    // Gives state of trip when driver was requested
    let requestedStatus;

    if (
      trip.status === TripStatus.PENDING &&
      trip.previousStatus === TripPreviousStatus.IN_PROGRESS
    ) {
      requestedStatus = TripDriverRequestedStatus.TRIP_INITIATE;
    } else if (
      trip.status === TripStatus.PENDING &&
      [TripPreviousStatus.DRIVER_CANCELLED_BEFORE_ARRIVED].includes(
        trip.previousStatus,
      )
    ) {
      requestedStatus = TripDriverRequestedStatus.TRIP_CANCELLED_BY_DRIVER;
    } else if (trip.status === TripStatus.REJECTED_BY_DRIVER) {
      requestedStatus = TripDriverRequestedStatus.TRIP_REJECTED_BY_DRIVER;
    }

    this.customLogger.log(
      `[findTripDriverRequestedStatus] requestedStatus: ${requestedStatus}`,
    );
    return requestedStatus;
  }

  async findDriverGroupId(tripId: string) {
    this.customLogger.log(`[findDriverGroupId] tripId: ${tripId}`);

    const trip: TripsEntity = await this.getTripById(tripId);

    let driverGroupId;

    const requestedStatus = await this.findTripDriverRequestedStatus(tripId);

    if (
      requestedStatus === TripDriverRequestedStatus.TRIP_CANCELLED_BY_DRIVER
    ) {
      driverGroupId = trip.cancelledByDriver;
    }
    return driverGroupId;
  }

  async findDriversToSendRequestTo(tripId: string) {
    this.customLogger.log(`[findDriversToSendRequestTo] tripId: ${tripId}`);

    const trip: TripsEntity = await this.getTripById(tripId);

    const pickUpAddress = trip.addresses.find(
      (address) => address.addressType === AddressType.PICK_UP,
    );

    let TRIP_DRIVER_SEARCH_RADIUS = await this.redisHandler.getRedisKey(
      'SETTING_TRIP_DRIVER_SEARCH_RADIUS',
    );

    if (!TRIP_DRIVER_SEARCH_RADIUS) {
      this.customLogger.error(
        '[findDriversToSendRequestTo] redis :: SETTING_TRIP_DRIVER_SEARCH_RADIUS got null',
      );
    }

    let TRIP_DRIVER_SEARCH_LIMIT = await this.redisHandler.getRedisKey(
      'SETTING_TRIP_DRIVER_SEARCH_LIMIT',
    );

    if (!TRIP_DRIVER_SEARCH_LIMIT) {
      this.customLogger.error(
        '[findDriversToSendRequestTo] redis :: SETTING_TRIP_DRIVER_SEARCH_LIMIT got null',
      );
    }

    // Total drivers to exclude
    let driversToExclude = [];

    const alreadyRequestedDriverIds = trip.drivers.map(
      (tripDriver: TripDriver) => tripDriver.driverId,
    );
    this.customLogger.log(
      'alreadyRequestedDrivers: ' + JSON.stringify(alreadyRequestedDriverIds),
    );

    driversToExclude = driversToExclude.concat(alreadyRequestedDriverIds);

    const pendingRecords: PendingTripDriver[] = await this.tripDriversService.findAll(
      {
        select: ['id', 'driverId'],
        where: {
          status: TripDriverStatus.PENDING,
        },
      },
    );

    const pendingTripDriverIds = pendingRecords.map(
      (driver) => driver.driverId,
    );
    this.customLogger.log(
      'pendingTripDrivers: ' + JSON.stringify(pendingTripDriverIds),
    );

    driversToExclude = driversToExclude.concat(pendingTripDriverIds);

    let driversList = { drivers: [], car_types: [] };

    // Process the trip in initial state
    if (
      trip.status === TripStatus.PENDING &&
      trip.previousStatus === TripPreviousStatus.IN_PROGRESS
    ) {
      this.customLogger.log(
        `[findDriversToSendRequestTo] Process the trip in initial state`,
      );

      // const driversToExclude = trip.drivers
      //   .filter((tripDriver: TripDriver) => [TripDriverStatus.EXPIRED].includes(tripDriver.status))
      //   .map((tripDriver: TripDriver) => tripDriver.driverId);
      // console.log("[findDriversToSendRequestTo] driversToExclude: ", driversToExclude)
      this.customLogger.log(
        `[findDriversToSendRequestTo] driversToExclude: ` +
          JSON.stringify(driversToExclude),
      );

      driversList = await this.findNearestDrivers({
        latitude: pickUpAddress.latitude,
        longitude: pickUpAddress.longitude,
        excludeList: driversToExclude || [],
        radius: TRIP_DRIVER_SEARCH_RADIUS,
        limit: TRIP_DRIVER_SEARCH_LIMIT,
        cabId: trip.cabId,
      });
    } else if (
      (trip.status === TripStatus.PENDING &&
        [TripPreviousStatus.DRIVER_CANCELLED_BEFORE_ARRIVED].includes(
          trip.previousStatus,
        )) ||
      trip.status === TripStatus.REJECTED_BY_DRIVER
    ) {
      /*
        Re-process the trip
        1) Cancelled by driver before arrived at picked up point
        2) Rejected by driver
      */
      this.customLogger.log(
        `[findDriversToSendRequestTo] Re-process the trip cancelled/rejected by driver`,
      );

      // Declined or cancelled drivers
      // const declinedAndCancelledDrivers = trip.drivers
      //   .filter((tripDriver: TripDriver) => [TripDriverStatus.DECLINED, TripDriverStatus.CANCELLED].includes(tripDriver.status))
      //   .map((tripDriver: TripDriver) => tripDriver.driverId);
      // console.log("[findDriversToSendRequestTo] declinedAndCancelledDrivers: ", declinedAndCancelledDrivers)
      // // this.customLogger.log(`[findDriversToSendRequestTo] declinedAndCancelledDrivers: ` + JSON.stringify(declinedAndCancelledDrivers));
      // driversToExclude = driversToExclude.concat(declinedAndCancelledDrivers);
      // // Expired drivers
      // const expiredDrivers = trip.drivers
      //   .filter((tripDriver: TripDriver) => [TripDriverStatus.EXPIRED].includes(tripDriver.status));
      // console.log("[findDriversToSendRequestTo] expiredDrivers: ", expiredDrivers)
      // // this.customLogger.log(`[findDriversToSendRequestTo] expiredDrivers: ` + JSON.stringify(expiredDrivers));
      // if(expiredDrivers.length) {
      //   const minRequestedExpiredDriverCount = this.findMinimumRequestedDriverCount(expiredDrivers);
      //   console.log("[findDriversToSendRequestTo] minRequestedExpiredDriverCount: ", minRequestedExpiredDriverCount)
      //   // this.customLogger.log(`[findDriversToSendRequestTo] minRequestedExpiredDriverCount: ` + JSON.stringify(minRequestedExpiredDriverCount));
      //   // Highest requested expired drivers
      //   const expiredDriversToExclude = expiredDrivers
      //     .filter((expiredDriver) => expiredDriver.driverRequested > minRequestedExpiredDriverCount)
      //     .map((tripDriver: TripDriver) => tripDriver.driverId);
      //   console.log("[findDriversToSendRequestTo] expiredDriversToExclude: ", expiredDriversToExclude)
      //   // this.customLogger.log(`[findDriversToSendRequestTo] expiredDriversToExclude: ` + JSON.stringify(expiredDriversToExclude));
      //   driversToExclude = driversToExclude.concat(expiredDriversToExclude);
      // }
      // console.log("[findDriversToSendRequestTo] Total drivers to exclude: ", driversToExclude)
      this.customLogger.log(
        `[findDriversToSendRequestTo] Total drivers to exclude: ` +
          JSON.stringify(driversToExclude),
      );
      driversList = await this.findNearestDrivers({
        latitude: pickUpAddress.latitude,
        longitude: pickUpAddress.longitude,
        excludeList: driversToExclude || [],
        radius: TRIP_DRIVER_SEARCH_RADIUS,
        limit: TRIP_DRIVER_SEARCH_LIMIT,
        cabId: trip.cabId,
      });
      // this.customLogger.log(`[findDriversToSendRequestTo] Drivers found with excluded cancelled and declined drivers -> ` + JSON.stringify(driversList));
      // if(
      //   (driversList.drivers && !driversList.drivers.length)
      // ) {
      //   // If no nearest drivers are found, include cancelled and declined drivers if trip was not cancelled after started
      //   driversToExclude = driversToExclude.filter((item) => !declinedAndCancelledDrivers.includes(item));
      //   this.customLogger.log(`[findDriversToSendRequestTo] Included declined and cancelled drivers, now driversToExclude: ` + JSON.stringify(driversToExclude));
      //   driversList = await this.findNearestDrivers({
      //     latitude: pickUpAddress.latitude,
      //     longitude: pickUpAddress.longitude,
      //     excludeList: driversToExclude || [],
      //     radius: TRIP_DRIVER_SEARCH_RADIUS,
      //     limit: TRIP_DRIVER_SEARCH_LIMIT,
      //     cabId: trip.cabId
      //   });
      //   this.customLogger.log(`[findDriversToSendRequestTo] Drivers found with included cancelled and declined drivers -> ` + JSON.stringify(driversList));
      // }
    }
    return driversList;
  }

  async processTripFromKafka(tripId: string) {
    try {
      this.customLogger.log(
        `In Process emit from prev function for tripId: ${tripId}`,
      );
      const trip: TripsEntity = await this.getTripById(tripId);

      // const pickUpAddress = trip.addresses.find(address => address.addressType === AddressType.PICK_UP)

      // const alreadyRequestedDriverIds = trip.drivers.map((tripDriver: TripDriver) => tripDriver.driverId)
      // this.customLogger.log(alreadyRequestedDriverIds, "alreadyRequestedDrivers");

      const {
        totalTripRequests,
        totalDriversRequested,
        maxTripRequestsLimit,
        maxDriversRequestLimit,
      } = await this.findRequestsCountAndSettingLimit(tripId);

      const requestedStatus = await this.findTripDriverRequestedStatus(tripId);

      this.customLogger.log(
        `[processTripFromKafka] total trip requests: ${totalTripRequests} | max trip requests limit: ${maxTripRequestsLimit}`,
      );
      this.customLogger.log(
        `[processTripFromKafka] total drivers requested: ${totalDriversRequested} | max drivers request limit: ${maxDriversRequestLimit}`,
      );

      const initialTripStatus = [
        TripStatus.PENDING,
        TripStatus.REJECTED_BY_DRIVER,
      ];

      // Cancel trip if requests exceeds max trip requests limit or drivers request limit in particular trip state
      if (
        (requestedStatus === TripDriverRequestedStatus.TRIP_INITIATE &&
          totalDriversRequested >= Number(maxDriversRequestLimit || 5)) ||
        (requestedStatus ===
          TripDriverRequestedStatus.TRIP_CANCELLED_BY_DRIVER &&
          (totalTripRequests >= Number(maxTripRequestsLimit || 3) ||
            totalDriversRequested >= Number(maxDriversRequestLimit || 3))) ||
        (requestedStatus ===
          TripDriverRequestedStatus.TRIP_REJECTED_BY_DRIVER &&
          totalTripRequests >= Number(maxTripRequestsLimit || 3))
      ) {
        if (
          initialTripStatus.includes(trip.status) &&
          trip.cabId &&
          trip.previousStatus === TripPreviousStatus.IN_PROGRESS
        ) {
          // const data: TripsUpdateDTO = {
          //   status: TripStatus.NO_DRIVER,
          // };
          // await this.update(trip.id, data);
        const TripsUpdate = await this.tripsRepository
        .createQueryBuilder()
        .update(TripsEntity)
        .set({  status: TripStatus.NO_DRIVER })
        .where('id = :id', { id: trip.id })
        .andWhere('status != :status', {
          status: TripStatus.NO_DRIVER,
        }) // total kitni entries ka status update karna
        .execute();
          if (TripsUpdate?.affected > 0) {
        
          this.notifyTripDetailAndSendNotification(trip, 'no_drivers');

          // Updates admin dashboard stats as trip status changed
          await this.notifyAdminDashboardAsTripStatusChanged();
        }
          return;
        }
        
        const data: TripsUpdateDTO = {
          status: TripStatus.EXPIRED,
          tripExpiredAt: getTimestamp(),
          riderAmount: 0,
          driverAmount: 0,
          motAmount: 0,
        };

        await this.update(trip.id, data);
        this.notifyTripDetailAndSendNotification(trip, 'trip_expired');

        // Updates admin dashboard stats as trip status changed
        await this.notifyAdminDashboardAsTripStatusChanged();

        return;
      }

      // finds nearest available drivers to send request to(active + unallocated)
      const nearestDrivers: any = await this.findDriversToSendRequestTo(tripId);

      // no. of drivers from trip_drivers
      this.customLogger.log(
        '[processTripFromKafka] nearestDrivers drivers : ' +
          nearestDrivers?.drivers?.length,
      );
      if (!nearestDrivers?.drivers?.length) {
        const cabTypes = await this.redisHandler.getAllKeys('cab-type-*');
        this.customLogger.log(
          '[processTripFromKafka] total available cabTypes : ' +
            cabTypes?.length,
        );

        if (
          initialTripStatus.includes(trip.status) &&
          trip.cabId &&
          cabTypes?.length > 1 &&
          trip.previousStatus === TripPreviousStatus.IN_PROGRESS
        ) {
          // const data: TripsUpdateDTO = {
          //   status: TripStatus.NO_DRIVER,
          // };
          // await this.update(trip.id, data);
          const TripsUpdate = await this.tripsRepository
        .createQueryBuilder()
        .update(TripsEntity)
        .set({  status: TripStatus.NO_DRIVER })
        .where('id = :id', { id: trip.id })
        .andWhere('status != :status', {
          status: TripStatus.NO_DRIVER,
        }) // total kitni entries ka status update karna
        .execute();
          if (TripsUpdate?.affected > 0) {
        
          this.notifyTripDetailAndSendNotification(trip, 'no_drivers');

          // Updates admin dashboard stats as trip status changed
          await this.notifyAdminDashboardAsTripStatusChanged();
        }
          return;
        } else if (
          trip.previousStatus ===
          TripPreviousStatus.DRIVER_CANCELLED_BEFORE_ARRIVED
        ) {
          const data: TripsUpdateDTO = {
            status: TripStatus.CANCELLED_BY_DRIVER,
            tripCancelledAt: String(trip.cancelledByDriverAt),
          };
          await this.update(trip.id, data);

          // Notify rider that driver has cancelled trip before reached at picked up point
          this.notifyTripDetail(trip.id, 'driver_cancelled_before_arrived');

          this.sendNotifications('driver_cancelled', trip, trip?.driverId);

          // Updates admin dashboard stats as trip status changed
          await this.notifyAdminDashboardAsTripStatusChanged(
            TripStatus.CANCELLED_BY_DRIVER,
          );

          return;
        }

        const data: TripsUpdateDTO = {
          status: TripStatus.EXPIRED,
          tripExpiredAt: getTimestamp(),
          riderAmount: 0,
          driverAmount: 0,
          motAmount: 0,
        };
        await this.update(trip.id, data);
        this.notifyTripDetailAndSendNotification(trip, 'trip_expired');

        // Updates admin dashboard stats as trip status changed
        await this.notifyAdminDashboardAsTripStatusChanged();

        return;
      }

      // Request nearest driver if drivers found.
      if (nearestDrivers?.drivers.length) {
        const isRequestAccepted = trip.drivers.some(
          (tripDriver: TripDriver) =>
            tripDriver.status === TripDriverStatus.ACCEPTED,
        );

        if (isRequestAccepted) {
          // TODO:: expire all other pending request
        } else if (
          (requestedStatus === TripDriverRequestedStatus.TRIP_INITIATE &&
            totalDriversRequested < Number(maxDriversRequestLimit || 5)) ||
          (requestedStatus ===
            TripDriverRequestedStatus.TRIP_CANCELLED_BY_DRIVER &&
            totalTripRequests < Number(maxTripRequestsLimit || 3) &&
            totalDriversRequested < Number(maxDriversRequestLimit || 3)) ||
          (requestedStatus ===
            TripDriverRequestedStatus.TRIP_REJECTED_BY_DRIVER &&
            totalTripRequests < Number(maxTripRequestsLimit || 3))
        ) {
          /*
            Need to update trip data so that trip can be process again
            after driver has cancelled the trip
          */
          if (
            trip.status === TripStatus.PENDING &&
            trip.previousStatus ===
              TripPreviousStatus.DRIVER_CANCELLED_BEFORE_ARRIVED
          ) {
            const data: TripsUpdateDTO = {
              driverId: null,
              tripCancelledAt: null,
              driverAssignedAt: null,
              tripOtp: null,
              transactionId: null,
              transactionStatus: null,
            };
            await this.update(tripId, data);
            this.customLogger.log(`[processTripFromKafka] Trip record updated`);
          }

          const [nearestFirstDriver] = nearestDrivers.drivers;

          let DRIVER_DECLINE_TIME_LIMIT = await this.redisHandler.getRedisKey(
            'SETTING_DRIVER_DECLINE_TIME_LIMIT',
          );

          const driverGroupId = await this.findDriverGroupId(tripId);
          let retData;
          let nearestDriversIds=[];
          for( let allNearestDrivers of nearestDrivers.drivers){
            retData = await this.tripDriversService.create({
              driverId: allNearestDrivers.externalId,
              trip,
              requestedStatus,
              driverGroupId,
              // expiredAt: getTimestamp(Number(5)),
              expiredAt: getTimestamp(Number(DRIVER_DECLINE_TIME_LIMIT || 30)),
            });
              this.sendNotifications('trip_request', trip, allNearestDrivers.externalId, {
                tripExpireTime: retData.expiredAt,
              })

              
              nearestDriversIds.push({externalId : allNearestDrivers.externalId});

        }
            
            // notify trip details
            this.notifyTripDetail(trip.id, 'trip_request', {
              driverId: nearestDriversIds,
              tripExpireTime: retData.expiredAt,
            });
          return retData;
        }
        return;
      }
    } catch (error) {
      this.customLogger.error('Error while process trip from kafka', error);
    }
  }

  async promoCodeAction(
    promoCodeDto: PromoCodeDto | RevertPromoCodeDto,
    action: PromoCodeAction,
  ) {
    try {
      const { promoCode } = promoCodeDto;
      this.customLogger.log(
        `[promoCodeAction] promoCode: ${promoCode} | action: ${action}`,
      );

      const response = await this.promoCodesTcpClient
        .send(PromoCodeTopic[action], JSON.stringify(promoCodeDto))
        .pipe()
        .toPromise();

      this.customLogger.log(
        `[promoCodeAction] Success ✔ | response: ${JSON.stringify(
          response,
        )} | action: ${action}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: `Trip promo code ${PromoCodeResponse[action]} successfully`,
        data: response.data,
      });
    } catch (e) {
      this.customLogger.error(
        `[promoCodeAction] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async addRemainingCharges(trip: TripsEntity) {
    try {
      this.customLogger.log(`[addRemainingCharges] tripId: ${trip.id}`);

      let DRIVER_WAITING_TIME_LIMIT = await this.redisHandler.getRedisKey(
        'SETTING_DRIVER_WAITING_TIME_LIMIT',
      );
      let WAITING_CHARGE_PER_MINUTE = await this.getWaitingChargePerMinute(
        trip.cabId,
      );
      const wait_time = this.calculateWaitingTime(
        trip.driverReachedAt,
        trip.id,
      );
      let charges = 0;
      if (wait_time > DRIVER_WAITING_TIME_LIMIT) {
        charges =
          (wait_time - DRIVER_WAITING_TIME_LIMIT) * WAITING_CHARGE_PER_MINUTE;
      }
      let data = {
        tripId: trip.id,
        remainingCharge: charges,
        riderId: trip.riderId,
      };
      const findRider = await this.getPreviousChargeRecord(trip.riderId);
      if (!!findRider?.id) {
        data.remainingCharge = charges + +findRider.remainingCharge;
      }
      this.remainingChargesRepository.create(data);
      await this.remainingChargesRepository.save(data);

      // send notifications
      this.sendNotifications('waiting_charges', trip, trip?.driverId);

      this.customLogger.log(
        `[addRemainingCharges] Success | tripId: ${trip.id}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message:
          successMessage.TRIP.WAITING_CHARGES_WILL_BE_ADDED_IN_RIDER_NEXT_RIDE,
      });
    } catch (e) {
      this.customLogger.error(
        `[addRemainingCharges] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async tripAcceptedByDriver(
    tripAccepted: DriverIdDto & TripIdParamDto & SessionIdDto,
  ) {
    try {
      const { driverId, tripId, sessionId } = tripAccepted;
      this.customLogger.log(
        `[tripAcceptedByDriver] tripId: ${tripId} | driverId: ${driverId}`,
      );

      if (!driverId) {
        this.customLogger.log(
          `[tripAcceptedByDriver] ${errorMessage.UNAUTHORIZED_ACTION} | driverId: ${driverId}`,
        );
        throw new Error(errorMessage.UNAUTHORIZED_ACTION);
      }

      // Get & Validate Trip
      let trip = await this.getTripById(tripId, {
        select: [
          'id',
          'tripNo',
          'riderId',
          'driverId',
          'tripCancelledAt',
          'driverReachedAt',
          'cabId',
          'promoCode',
          'status',
          'tripExpiredAt',
          'tripBaseAmount',
          'taxPercentage',
          'baseFare',
          'costPerKm',
          'costPerMin',
          'fareMultiplier',
          'motAmount',
          'processingFee',
          'waslFee',
          'transactionFee',
        ],
        relations: ['addresses'],
      });

      const captainId = await this.getDriversCaptainID(driverId);

      // Validations
      this.checkIsTripActionAllowed(trip.id, trip.status);

      if (trip.tripCancelledAt) {
        this.customLogger.error(
          `[tripAcceptedByDriver] ${errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED} | tripCancelledAt: ${trip.tripCancelledAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED);
      }

      if (trip.tripExpiredAt) {
        this.customLogger.error(
          `[tripAcceptedByDriver] ${errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED} | tripExpiredAt: ${trip.tripExpiredAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED);
      }

      if (
        trip.driverReachedAt ||
        trip.status === TripStatus.ACCEPTED_BY_DRIVER
      ) {
        this.customLogger.error(
          `[tripAcceptedByDriver] ${errorMessage.TRIP.TRIP_ACCEPTED_BY_ANOTHER_DRIVER_ALREADY} | driverReachedAt: ${trip.driverReachedAt}`,
        );
        throw new Error(
          errorMessage.TRIP.TRIP_ACCEPTED_BY_ANOTHER_DRIVER_ALREADY,
        );
      }

      // Validate Driver in trip_drivers table as pending status
      this.customLogger.log(
        `[tripAcceptedByDriver] Validate Driver in trip_drivers table as pending status | tripId: ${tripId} | driverId: ${driverId}`,
      );
      const tripDriver = await this.tripDriversService.findOne({
        driverId,
        status: TripDriverStatus.PENDING,
      });
      if (!tripDriver) {
        this.customLogger.error(
          `[tripAcceptedByDriver] ${errorMessage.UNAUTHORIZED_ACTION} | tripId: ${tripId} | driverId: ${driverId}`,
        );
        throw new Error(errorMessage.UNAUTHORIZED_ACTION);
      }
      this.customLogger.log(
        `[tripAcceptedByDriver] Success | Validate Driver in trip_drivers table as pending status | tripId: ${tripId} | driverId: ${driverId}`,
      );

      let { baseFare, costPerKm, costPerMin, fareMultiplier } = trip;

      // Update cab Id for trip if rider find trip without specifying cab-type
      if (!trip.cabId && driverId) {
        const driverDetail = await this.customerRepository.findOne({
          where: { driverId: captainId },
          select: ['cabId'],
        });
        this.customLogger.log(
          `[tripAcceptedByDriver] cabId: ${driverDetail.cabId}`,
        );

        await this.update(trip.id, {
          cabId: driverDetail.cabId,
        });

        trip.cabId = driverDetail.cabId;
      }

      // Calculate distance & estimate-time from google
      const originAddress = trip.addresses.find(
        (address) => address.addressType === AddressType.PICK_UP,
      );
      const destinationAddress = trip.addresses.find(
        (address) => address.addressType === AddressType.DESTINATION,
      );

      const { distance: tripDistance, time } = await calculateFareDistance(
        {
          latitude: originAddress.latitude,
          longitude: originAddress.longitude,
        },
        {
          latitude: destinationAddress.latitude,
          longitude: destinationAddress.longitude,
        },
      );

      // re-calculate base-amount in case cabId or destination changed
      const tripBaseAmount = await this.estimateFareAmount(trip.cabId, {
        distance: tripDistance,
        time,
        baseFare,
        costPerKm,
        costPerMin,
        fareMultiplier,
      });

      // calculate promo-code amount
      let promoCodeAmount = 0;
      if (!!trip.promoCode) {
        const res = await this.promoCodeAction(
          {
            promoCode: trip.promoCode,
            userId: trip.riderId,
            tripId: trip.id,
            amount: tripBaseAmount,
            lat: originAddress.latitude,
            long: originAddress.longitude,
            applyingTo: applicableFor.rider,
          },
          PromoCodeAction.APPLY,
        );
        if (res?.data?.data?.valid) {
          promoCodeAmount = res.data.data.amount;
        }
      }
      const tripFees = await this.getTripFeeSum();
      // calculate tax amount

      const transactionFee =
        getAmountFormatted(tripBaseAmount / 100) *
        Number(await this.getTripBankFeePercentage());

      const taxAmount = await this.calculateTaxAmount(
        tripBaseAmount,
        trip.taxPercentage,
        transactionFee,
      );

      // update base amount, distance and time
      await this.update(trip.id, {
        tripBaseAmount,
        estimatedBaseAmount: tripBaseAmount,
        driverAmount: tripBaseAmount,
        transactionFee,
        promoCodeAmount,
        taxAmount,
        estimatedTripTime: time,
        tripDistance,
        baseFare,
        costPerKm,
        costPerMin,
      });

      //Generate OTP
      const tripOtp = getOTP();

      // Block(Hold) trip amount
      this.customLogger.log(
        `[tripAcceptedByDriver] | Block(Hold) payment to e-wallet`,
      );
      const riderAmount = await this.calculateFareAmountWithTax(trip.id);
      const senderTax = getAmountFormatted(taxAmount);

      // const bankFee =
      //   (riderAmount / 100) * Number(await this.getTripBankFeePercentage());

      // const driverClientKey = `driverClient-${driverId}`;
      // const driverClientVal = await this.redisHandler.getRedisKey(driverClientKey);
      const paymentParams: HoldParams = {
        senderId: trip.riderId,
        receiverId: driverId,
        amount: tripBaseAmount,
        senderFee: tripFees + transactionFee,
        senderTax,
        tripId: tripId,
        details: `holding amounts for trip: ${tripId}`,
        motFee: trip.motAmount,
      };

      // Removes old tripDriver data if any present
      this.redisHandler.client.del(`tripDriver-${tripId}`, function (err) {
        Logger.log(
          `[tripAcceptedByDriver] redis-del -> tripDriver-${tripId} -> error :: ${JSON.stringify(
            err,
          )}`,
        );
      });

      const paymentResponse = await this.holdTripPayment(paymentParams);

      // Accepted Success (update trip_drivers table as accepted status)
      await this.tripDriversService.update(tripDriver.id, {
        status: TripDriverStatus.ACCEPTED,
      });
      this.customLogger.log(
        `[tripAcceptedByDriver] Trip Driver Record updated | driverId: ${driverId}`,
      );

      // update driver stats
      this.clientCaptainKafka.emit(
        CHANGE_DRIVER_AVAILABILITY,
        JSON.stringify({ id: captainId, status: true }),
      );

      // update base amount, distance and time
      // Resets cancelledBy, cancelledReason data, in case trip was cancelled by driver before
      const data: TripsUpdateDTO = {
        status: TripStatus.ACCEPTED_BY_DRIVER,
        previousStatus: TripPreviousStatus.IN_PROGRESS,
        driverAssignedAt: getTimestamp(),
        transactionStatus: TransactionStatus.BLOCKED,
        transactionId: paymentResponse?.data?.holdId,
        riderAmount,
        tripOtp,
        driverId,
        cancelledBy: null,
        cancelledReason: null,
      };
      await this.update(tripId, data);
      this.customLogger.log(
        `[tripAcceptedByDriver] Trip Record updated | tripId: ${tripId}`,
      );

      // notify trip details
      this.notifyTripDetail(tripId, 'driver_accepted');
      // send notifications
      this.sendNotifications('driver_accepted', trip, driverId);

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged();

      this.customLogger.log(
        `[tripAcceptedByDriver] Success | tripId: ${tripId} | driverId: ${driverId}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.TRIP_ACCEPTED_BY_DRIVER,
      });
    } catch (e) {
      this.customLogger.error(
        `[tripAcceptedByDriver] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async tripCancelledByDriver(
    tripCancelDto: DriverTripRejectCancelDto & TripIdParamDto & SessionIdDto,
  ) {
    const { tripId, declinedReason, driverId, sessionId } = tripCancelDto;
    try {
      this.customLogger.log(
        `[tripCancelledByDriver] tripId: ${tripId} | driverId: ${driverId}`,
      );

      const trip = await this.getTripById(tripId, {
        select: [
          'id',
          'riderId',
          'driverId',
          'driverReachedAt',
          'tripCancelledAt',
          'completed',
          'tripStartedAt',
          'status',
          'cabId',
          'tripType',
          'cancelledByDriver',
        ],
      });

      if (!trip.driverId) {
        this.customLogger.error(
          `[tripCancelledByDriver] ${errorMessage.TRIP.TRIP_HAS_NOT_ASSIGNED_ANY_DRIVER}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_NOT_ASSIGNED_ANY_DRIVER);
      }

      this.checkIsDriverAuthorized(trip.driverId, driverId, trip.id);

      const captainId = await this.getDriversCaptainID(driverId);

      // Validations
      this.checkIsTripActionAllowed(trip.id, trip.status);

      if (!!trip.tripCancelledAt) {
        this.customLogger.error(
          `[tripCancelledByDriver] ${errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED} | tripCancelledAt: ${trip.tripCancelledAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED);
      }

      if (trip.completed) {
        this.customLogger.error(
          `[tripCancelledByDriver] ${errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED} | completed: ${trip.completed}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED);
      }

      if (!!trip.driverReachedAt && !trip.tripCancelledAt) {
        const DRIVER_WAITING_TIME_LIMIT = await this.redisHandler.getRedisKey(
          'SETTING_DRIVER_WAITING_TIME_LIMIT',
        );

        const waitTime = this.calculateWaitingTime(
          trip.driverReachedAt,
          trip.id,
        );
        if (waitTime < DRIVER_WAITING_TIME_LIMIT) {
          this.customLogger.error(
            `[tripCancelledByDriver] ${errorMessage.TRIP.WAIT_SOMETIME}`,
          );
          throw new Error(errorMessage.TRIP.WAIT_SOMETIME);
        } else {
          // await this.addRemainingCharges(trip);
        }
      }

      // release the blocked amount
      await this.releaseTripPayment(tripId);

      const tripDriver = await this.tripDriversService.findOneRow({
        select: ['id'],
        where: {
          trip: tripId,
          driverId,
          status: TripDriverStatus.ACCEPTED,
        },
      });

      await this.tripDriversService.update(tripDriver.id, {
        status: TripDriverStatus.CANCELLED,
      });
      this.customLogger.log(
        `[tripCancelledByDriver] Trip driver record updated`,
      );

      let tripPreviousStatus;
      if (
        !trip.driverReachedAt &&
        trip.status === TripStatus.ACCEPTED_BY_DRIVER
      ) {
        tripPreviousStatus = TripPreviousStatus.DRIVER_CANCELLED_BEFORE_ARRIVED;
      } else if (
        trip.driverReachedAt &&
        trip.status === TripStatus.DRIVER_ARRIVED
      ) {
        tripPreviousStatus = TripPreviousStatus.DRIVER_CANCELLED_AFTER_ARRIVED;
      }

      // Update trip table
      const data: TripsUpdateDTO = {
        status: TripStatus.CANCELLED_BY_DRIVER,
        tripCancelledAt: getTimestamp(),
        tripExpiredAt: getTimestamp(),
        cancelledByDriverAt: getTimestamp(),
        cancelledBy: driverId,
        cancelledReason: declinedReason,
        cancelledByDriver: trip.cancelledByDriver + 1,
        riderAmount: 0,
        driverAmount: 0,
        transactionStatus: TransactionStatus.RELEASED,
        previousStatus: tripPreviousStatus,
        motAmount: 0,
      };
      await this.update(tripId, data);
      this.customLogger.log(`[tripCancelledByDriver] Trip Record updated`);

      // update driver stats
      this.clientCaptainKafka.emit(
        CHANGE_DRIVER_AVAILABILITY,
        JSON.stringify({ id: captainId, status: false }),
      );

      const { data: driverDetail } = await this.customerService.findOne({
        userId: Number(trip.driverId),
      });
      await this.customerService.updateCustomer(driverDetail.id, {
        tripsCancelled: driverDetail.tripsCancelled + 1,
      });
      this.customLogger.log(
        `[tripCancelledByDriver] | Record updated successfully for Driver ✔ | Driver: ${trip.driverId} | tripsCancelled: ${driverDetail.tripsCancelled}`,
      );

      // notify trip details
      if (
        // (!trip.driverReachedAt &&
        //   trip.status === TripStatus.ACCEPTED_BY_DRIVER) ||
        trip.status === TripStatus.ACCEPTED_BY_DRIVER
      ) {
        const delList = [
          `tripDriver-${tripId}`,
          `${trip.riderId}-trip-${trip.driverId}`,
        ];
        this.redisHandler.client.del(delList, function (err) {
          Logger.debug(
            '[tripCancelledByDriver] redis-del::' +
              JSON.stringify(delList) +
              '::error > ' +
              JSON.stringify(err),
          );
        });

        // Again process trip and assign driver if any available
        this.processTripCancelledByDriver(tripId);
      } else {
        // Sends driver has cancelled trip after reached at picked up point event
        this.notifyTripDetail(tripId, 'driver_cancelled');
      }

      // this.notifyTripDetail(tripId, 'driver_cancelled'); //TODO:: to remove later on

      // send notifications
      if (!!trip.driverReachedAt && !trip.tripCancelledAt) {
        this.sendNotifications(
          'trip_cancelled_after_reaching_pickup_location',
          trip,
          trip?.driverId,
        );
      }

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged(
        TripStatus.CANCELLED_BY_DRIVER,
      );

      this.customLogger.log(
        `[tripCancelledByDriver] Success ✔ | tripId: ${tripId} | driverId: ${driverId}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.TRIP_CANCELLED_BY_DRIVER,
      });
    } catch (e) {
      this.customLogger.error(
        `[tripCancelledByDriver] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async tripRejectedByDriver(
    tripRejectDto: DriverTripRejectCancelDto & TripIdParamDto,
  ) {
    try {
      const { tripId, declinedReason, driverId } = tripRejectDto;
      this.customLogger.log(
        `[tripRejectedByDriver] | tripId: ${tripId} | driverId: ${driverId}`,
      );

      const trip = await this.getTripById(tripId, {
        select: [
          'id',
          'tripNo',
          'riderId',
          'driverId',
          'tripCancelledAt',
          'completed',
          'driverAssignedAt',
          'tripExpiredAt',
          'status',
        ],
      });

      // Validations
      this.checkIsTripActionAllowed(trip.id, trip.status);

      if (!!trip.tripExpiredAt) {
        this.customLogger.error(
          `[tripRejectedByDriver] | ${errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED} | tripExpiredAt: ${trip.tripExpiredAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED);
      }
      if (!!trip.tripCancelledAt) {
        this.customLogger.error(
          `[tripRejectedByDriver] | ${errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED} | tripCancelledAt: ${trip.tripCancelledAt}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED);
      }
      if (trip.completed) {
        this.customLogger.error(
          `[tripRejectedByDriver] | ${errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED} | completed: ${trip.completed}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED);
      }
      if (!!trip.driverAssignedAt) {
        this.customLogger.error(
          `[tripRejectedByDriver] | ${errorMessage.TRIP.TRIP_CAN_NOT_BE_REJECT_AFTER_ACCEPTING_REQUEST} | driverAssignedAt: ${trip.driverAssignedAt}`,
        );
        throw new Error(
          errorMessage.TRIP.TRIP_CAN_NOT_BE_REJECT_AFTER_ACCEPTING_REQUEST,
        );
      }
      if (!!trip.driverAssignedAt && trip.driverId !== driverId) {
        this.customLogger.error(
          `[tripRejectedByDriver] | ${errorMessage.TRIP.DRIVER_IS_NOT_A_PART_OF_TRIP} | Trip-Driver: ${trip.driverId} | Requested-driver: ${driverId}`,
        );
        throw new Error(errorMessage.TRIP.DRIVER_IS_NOT_A_PART_OF_TRIP);
      }

      // update trip_drivers table as accepted status
      const tripDriver = await this.tripDriversService.findOne({
        driverId,
        status: TripDriverStatus.PENDING,
        select: ['id'],
      });
      await this.tripDriversService.update(tripDriver.id, {
        status: TripDriverStatus.DECLINED,
        declinedReason,
      });
      this.customLogger.log(
        `[tripRejectedByDriver] | Trip-Driver Record updated Success | declinedReason: ${declinedReason} | status: ${'DECLINED'}`,
      );

      // this will emit trip to kafka on creation
      // await this.emitTripsToKafka(trip.id);

      const data: TripsUpdateDTO = {
        status: TripStatus.REJECTED_BY_DRIVER,
      };
      await this.update(tripId, data);
      this.customLogger.log(
        `[tripRejectedByDriver] | Trip Record updated Success | declinedReason: ${declinedReason} | status: ${'REJECTED_BY_DRIVER'}`,
      );

      // update driver stats
      const { data: driverDetail } = await this.customerService.findOne({
        userId: Number(driverId),
      });
      await this.customerService.updateCustomer(driverDetail.id, {
        tripsDeclined: driverDetail.tripsDeclined + 1,
      });
      this.customLogger.log(
        `[tripRejectedByDriver] | Record updated successfully for Driver ✔ | Driver: ${trip.driverId} | tripsDeclined: ${driverDetail.tripsDeclined}`,
      );

      this.customLogger.log(
        `[tripRejectedByDriver] Success ✔ | tripId: ${tripId} | driverId: ${driverId}`,
      );

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged();

      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.TRIP_REJECTED_BY_DRIVER,
      });
    } catch (e) {
      this.customLogger.error(
        `[tripRejectedByDriver] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async tripCancelledByAdmin(
    tripCancelDto: AdminTripCancelDto & TripIdParamDto & AdminIdDto,
  ) {
    try {
      const { tripId, cancelReason, adminId, superAdmin } = tripCancelDto;
      this.customLogger.log(`[tripCancelledByAdmin] tripId: ${tripId}`);
      this.customLogger.log(`[tripCancelledByAdmin] adminId: ${adminId}`);

      const trip = await this.getTripById(tripId, {
        relations: ['addresses'],
        select: [
          'id',
          'tripNo',
          'riderId',
          'driverId',
          'tripExpiredAt',
          'completed',
          'tripCancelledAt',
          'promoCode',
          'tripStartedAt',
          'taxAmount',
          'waitingCharge',
          'status',
          'driverAssignedAt',
        ],
      });

      if (!superAdmin) {
        this.checkIsTripActionAllowed(trip.id, trip.status);

        if (!!trip.driverAssignedAt) {
          this.customLogger.error(
            `[tripCancelledByAdmin] ${errorMessage.TRIP.DRIVER_HAS_BEEN_ASSIGNED_TO_THIS_TRIP} | driverAssignedAt: ${trip.driverAssignedAt}`,
          );
          throw new Error(
            errorMessage.TRIP.DRIVER_HAS_BEEN_ASSIGNED_TO_THIS_TRIP,
          );
        }

        if (!!trip.tripExpiredAt) {
          this.customLogger.error(
            `[tripCancelledByAdmin] ${errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED} | tripExpiredAt" ${trip.tripExpiredAt}`,
          );
          throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_EXPIRED);
        }

        if (!!trip.tripCancelledAt) {
          this.customLogger.error(
            `[tripCancelledByAdmin] ${errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED} | tripCancelledAt" ${trip.tripCancelledAt}`,
          );
          throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED);
        }

        if (trip.completed) {
          this.customLogger.error(
            `[tripCancelledByAdmin] ${errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED} | completed" ${trip.completed}`,
          );
          throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED);
        }

        if (!!trip.promoCode) {
          try {
            await this.promoCodeAction(
              { promoCode: trip.promoCode, userId: trip.riderId },
              PromoCodeAction.REVERT,
            );
            await this.tripsRepository.update(tripId, {
              promoCode: null,
              promoCodeAmount: 0,
            });
          } catch (e) {
            this.customLogger.debug(
              `[tripCancelledByAdmin] Promo-code end point error: Promo-code = ${trip.promoCode}`,
            );
          }
        }
      }

      // release the blocked amount
      //Allow admin to cancel pending trip so rider can process new trip
      await this.releaseTripPayment(tripId);

      // Update trips table
      const data: TripsUpdateDTO = {
        status: TripStatus.CANCELLED_BY_ADMIN,
        cancelledBy: adminId,
        cancelledReason: cancelReason,
        tripCancelledAt: getTimestamp(),
        riderAmount: 0,
        driverAmount: 0,
        transactionStatus: TransactionStatus.RELEASED,
        motAmount: 0,
      };
      await this.update(tripId, data);
      this.customLogger.log(
        `[tripCancelledByAdmin] Record updated to trip | Trip: ${tripId}`,
      );

      // update driver stats
      const captainId = await this.getDriversCaptainID(trip.driverId);
      this.clientCaptainKafka.emit(
        CHANGE_DRIVER_AVAILABILITY,
        JSON.stringify({ id: captainId, status: false }),
      );

      // TODO: Decision Pending
      // notify trip details
      this.notifyTripDetail(tripId, 'admin_cancelled');
      // // send notifications
      this.sendNotifications('admin_cancelled', trip, trip?.driverId);

      this.customLogger.log(
        `[tripCancelledByAdmin] Success ✔ | riderId: ${trip?.riderId}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.TRIP_CANCELLED_BY_ADMIN,
      });
    } catch (e) {
      this.customLogger.error(
        `[tripCancelledByAdmin] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findNearestDrivers(param: FindNearestDriversDto) {
    try {
      this.customLogger.log(
        `[findNearestDrivers] | param : ${JSON.stringify(param)}`,
      );

      const response = await this.clientCaptainTCP
        .send(FIND_NEAREST_DRIVERS, JSON.stringify(param))
        .pipe()
        .toPromise();

      if (response && response.statusCode === HttpStatus.OK) {
        this.customLogger.log(`[findNearestDrivers] Success ✔`);

        return response;
      } else {
        this.customLogger.error(
          `[findNearestDrivers] ${errorMessage.FETCH_DRIVERS_ERROR}`,
        );

        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: errorMessage.FETCH_DRIVERS_ERROR,
        };
      }
    } catch (e) {
      this.customLogger.error(
        `[findNearestDrivers] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async notifyRiderScheduleTrip(trip: any) {
    // send notifications
    this.sendNotifications('scheduled_trip_confirmation', trip, null);
    // notify trip details
    this.notifyTripDetail(trip.id, 'rider_scheduled_trip_confirmation');
  }

  async acceptScheduledTrip(params: TripScheduleRiderDto) {
    try {
      this.customLogger.log(
        `[acceptScheduledTrip] | tripId => ${params.tripId}`,
      );

      const trip = await this.getTripById(
        params.tripId,
        {
          select: ['id', 'riderId', 'riderScheduledAt'],
        },
        {
          tripType: TripType.SCHEDULED,
          status: TripStatus.PENDING,
          riderId: params.riderId,
        },
      );

      const diffMinutes = getTimeDifference(trip.riderScheduledAt, new Date());
      let NOTIFY_TIME_SCHEDULED_TRIP = await this.redisHandler.getRedisKey(
        'SETTING_NOTIFY_TIME_SCHEDULED_TRIP',
      );

      if (trip.id && diffMinutes <= NOTIFY_TIME_SCHEDULED_TRIP) {
        this.customLogger.log(
          `[acceptScheduledTrip] | initiating trip : ${trip.id}`,
        );

        return ResponseData.success(HttpStatus.OK, {
          message: successMessage.TRIP.CONFIRM_SCHEDULE,
        });
      } else {
        this.customLogger.error(
          `[acceptScheduledTrip] ${errorMessage.TRIP.TRIP_NOT_FOUND} --OR-- trip time(${trip?.riderScheduledAt}) not in the range of ${NOTIFY_TIME_SCHEDULED_TRIP} mins`,
        );
        throw new Error(errorMessage.TRIP.TRIP_NOT_FOUND);
      }
    } catch (error) {
      this.customLogger.error(
        `[acceptScheduledTrip] Some Error Occurred in catch | ${error.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async declineScheduledTrip(params: TripScheduleRiderDto) {
    try {
      this.customLogger.log(`[declineScheduledTrip]`);

      const trip = await this.getTripById(
        params.tripId,
        {
          select: [
            'id',
            'tripNo',
            'riderId',
            'driverId',
            'completed',
            'tripCancelledAt',
            'riderScheduledAt',
          ],
        },
        {
          tripType: TripType.SCHEDULED,
          status: TripStatus.PENDING,
          riderId: params.riderId,
        },
      );
      const diffMinutes = getTimeDifference(trip.riderScheduledAt, new Date());
      this.customLogger.log(
        `[declineScheduledTrip] | diffMinutes: ${diffMinutes}`,
      );

      let NOTIFY_TIME_SCHEDULED_TRIP = await this.redisHandler.getRedisKey(
        'SETTING_NOTIFY_TIME_SCHEDULED_TRIP',
      );
      if (trip.id && diffMinutes <= NOTIFY_TIME_SCHEDULED_TRIP) {
        if (!!trip.tripCancelledAt) {
          this.customLogger.error(
            `[declineScheduledTrip] ${errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED}`,
          );
          throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_CANCELLED);
        }
        if (trip.completed) {
          this.customLogger.error(
            `[declineScheduledTrip] ${errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED}`,
          );
          throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED);
        }

        const data: TripDeclinedDTO = {
          status: TripStatus.CANCELLED_BY_RIDER,
          transactionStatus: null,
          riderAmount: 0,
          driverAmount: 0,
          cancelledBy: params.riderId,
          cancelledReason: 'I want to travel after sometime', // VERIFY: reason need to confirm
          tripCancelledAt: getTimestamp(),
          motAmount: 0,
        };
        await this.update(params.tripId, data);

        // update rider stats
        const { data: customerDetail } = await this.customerService.findOne({
          userId: Number(trip.riderId),
        });
        if (customerDetail) {
          const upcomingRides = customerDetail.upcomingRides - 1;
          await this.customerService.updateCustomer(customerDetail.id, {
            upcomingRides: upcomingRides > 0 ? upcomingRides : 0,
            ridesCancelled: customerDetail.ridesCancelled + 1,
          });
        }

        // notify trip details
        this.notifyTripDetail(params.tripId, 'rider_schedule_trip_declined');
      } else {
        this.customLogger.error(
          `[declineScheduledTrip] ${errorMessage.TRIP.TRIP_NOT_FOUND} --OR-- trip time(${trip?.riderScheduledAt}) not in the range of ${NOTIFY_TIME_SCHEDULED_TRIP} mins`,
        );
        throw new Error(errorMessage.TRIP.TRIP_NOT_FOUND);
      }

      // Updates admin dashboard stats as trip status changed
      await this.notifyAdminDashboardAsTripStatusChanged(
        TripStatus.CANCELLED_BY_RIDER,
      );

      this.customLogger.log(
        `[declineScheduledTrip] Success | ${successMessage.TRIP.DECLINE_SCHEDULE}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.DECLINE_SCHEDULE,
      });
    } catch (e) {
      this.customLogger.error(
        `[declineScheduledTrip] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async uploadPhoto(params: TripIdParamDto & TripUploadPhotoDto) {
    try {
      const { tripId, type, images } = params;
      this.customLogger.log(
        `[uploadPhoto] | tripId: ${tripId} | type: ${type} | image: ${images}`,
      );

      const trip = await this.getTripById(tripId);

      if (trip.completed && type != TRIP_PHOTO_ACTION.COMPLETED) {
        this.customLogger.error(
          `[uploadPhoto] | ${errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED} | tripId: ${tripId} | type: ${type} | image: ${images}`,
        );
        throw new Error(errorMessage.TRIP.TRIP_HAS_BEEN_COMPLETED);
      }

      // Upload images
      await Promise.all(
        images.map(async (imageObject) => {
          if (imageObject) {
            const tripImageUpload = this.tripImagesRepository.create({
              image: imageObject.image,
              imageBy: imageObject.imageBy,
              type,
              trip,
            });
            return this.tripImagesRepository.save(tripImageUpload);
          }
        }),
      );

      this.customLogger.log(
        `[uploadPhoto] Success ✔ | tripId: ${tripId} | type: ${type} | image: ${images}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        message: successMessage.TRIP.TRIP_PHOTO_UPLOADED,
      });
    } catch (e) {
      this.customLogger.error(
        `[uploadPhoto] Some Error Occurred in catch | ${e.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getRunningTripDetail(params: TripIdParamDto & DriverIdInterface) {
    const { tripId, driverId } = params;
    try {
      this.customLogger.log(`In Get Running Trip for tripId: ${tripId}`);
      const tripData = await this.tripsRepository.findOne({ id: tripId });
      if (!tripData) {
        throw new Error(errorMessage.TRIP.TRIP_NOT_FOUND);
      }
      const tripKey = `${tripData?.riderId}-trip-*`;
      const scanList = await this.redisHandler.getMatchedClients(tripKey);
      const riderInfoKey = `tripRider-${tripId}`;
      const riderInfoRedis = await this.redisHandler.getRedisKey(riderInfoKey);
      const driverInfoKey = `tripDriver-${tripId}`;
      const driverInfoRedis = await this.redisHandler.getRedisKey(
        driverInfoKey,
      );

      let userIdList = [];
      // Driver Details
      let tripDriverDetails: any = {};
      if (tripData?.driverId && !driverInfoRedis) {
        const captainId = await this.getDriversCaptainID(tripData.driverId);
        this.customLogger.log(
          `[getRunningTripDetail] Driver Request from CS driverId > ${tripData.driverId}`,
        );
        const tripDriverResponse: any = await this.clientCaptainTCP
          .send(CAPTAIN_DETAIL, JSON.stringify({ id: captainId }))
          .pipe()
          .toPromise();
        this.customLogger.log(
          `[getRunningTripDetail] Driver Response from CS driverId > ${tripDriverResponse?.data?.id}`,
        );
        if (
          tripDriverResponse &&
          tripDriverResponse.statusCode === HttpStatus.OK
        ) {
          tripDriverDetails = tripDriverResponse.data;
          if (tripDriverDetails?.externalId) {
            userIdList.push(tripDriverDetails.externalId);
          }
        }
      }

      // Rider Details
      if (tripData?.riderId && !riderInfoRedis) {
        userIdList.push(tripData.riderId);
      }

      let driverProfileDetails: any;
      let riderProfileDetails: any;
      if (userIdList.length > 0) {
        this.customLogger.log(
          `[getRunningTripDetail] Request from Customer service > ${JSON.stringify(
            userIdList,
          )}`,
        );
        let customersResponse: any = await this.customerService.findByIdList(
          { userIdList },
          { isReviewDetail: true },
        );
        this.customLogger.log(
          `[getRunningTripDetail] Response from Customer service > ${JSON.stringify(
            userIdList,
          )}`,
        );
        if (
          customersResponse &&
          customersResponse.statusCode === HttpStatus.OK
        ) {
          if (tripDriverDetails?.externalId) {
            driverProfileDetails =
              customersResponse.data.find(
                (cusRow) =>
                  cusRow.userId &&
                  cusRow.userId == tripDriverDetails?.externalId,
              ) ?? {};
          }
          if (tripData?.riderId) {
            riderProfileDetails =
              customersResponse.data.find(
                (cusRow) => cusRow.userId && cusRow.userId == tripData?.riderId,
              ) ?? {};
          }
          this.customLogger.log(
            `[getRunningTripDetail] Customer service response > Driver : ${driverProfileDetails?.id} & Rider : ${riderProfileDetails?.id}`,
          );
        }
      }

      let tripDriverInfo: TripDetailDriverInfo;
      if (!driverInfoRedis) {
        const driverProfileName = driverProfileDetails?.firstName
          ? `${driverProfileDetails.firstName} ${driverProfileDetails.lastName}`
          : '';
        const driverProfileArabicName = driverProfileDetails?.arabicFirstName
          ? `${driverProfileDetails.arabicFirstName} ${driverProfileDetails.arabicLastName}`
          : '';
        tripDriverInfo = {
          id: driverProfileDetails?.userId,
          name: tripDriverDetails?.driverName || driverProfileName,
          arabicName: driverProfileArabicName,
          mobile: driverProfileDetails?.mobileNo,
          rating: driverProfileDetails?.overallRating || 0,
          carPlateNo: tripDriverDetails?.carPlateNo || '',
          carSequenceNo: tripDriverDetails?.carSequenceNo || '',
          totalTrips: driverProfileDetails?.totalTrips || 0,
          profileImage: driverProfileDetails?.profileImage || '',
          latitude: tripDriverDetails?.latitude || 0,
          longitude: tripDriverDetails?.longitude || 0,
        };
        if (tripData?.driverId && scanList.length > 0) {
          this.redisHandler.client.set(
            `tripDriver-${tripId}`,
            JSON.stringify(tripDriverInfo),
            function (err) {
              Logger.log(
                `[getRunningTripDetail] redis-set -> tripDriver-${tripId} -> error :: ${JSON.stringify(
                  err,
                )}`,
              );
            },
          );
        }
      } else {
        this.customLogger.log(
          `[getRunningTripDetail] Driver details > REDIS : ${driverInfoKey}`,
        );
        tripDriverInfo = JSON.parse(driverInfoRedis) || {};
        if (!scanList.length) {
          this.redisHandler.client.del(`tripDriver-${tripId}`, function (err) {
            Logger.log(
              `[getRunningTripDetail] redis-del -> tripDriver-${tripId} -> error :: ${JSON.stringify(
                err,
              )}`,
            );
          });
        }
      }
      let driverLoc = await this.redisHandler.getRedisKey(
        `location-${tripDriverInfo?.id}-driver`,
      );
      if (driverLoc && tripDriverInfo) {
        driverLoc = JSON.parse(driverLoc);
        tripDriverInfo = {
          ...tripDriverInfo,
          latitude: driverLoc?.lat ?? tripDriverInfo.latitude,
          longitude: driverLoc?.lon ?? tripDriverInfo.longitude,
        };
        this.customLogger.log(
          '[getRunningTripDetail] Driver location > REDIS : ' +
            JSON.stringify(driverLoc),
        );
      }

      let tripRiderInfo: TripDetailRiderInfo;
      if (!riderInfoRedis) {
        const riderProfileName = riderProfileDetails?.firstName
          ? `${riderProfileDetails.firstName} ${riderProfileDetails.lastName}`
          : '';
        const riderProfileArabicName = riderProfileDetails?.arabicFirstName
          ? `${riderProfileDetails.arabicFirstName} ${riderProfileDetails.arabicLastName}`
          : '';
        tripRiderInfo = {
          id: riderProfileDetails?.userId,
          name: riderProfileName,
          arabicName: riderProfileArabicName,
          mobile: riderProfileDetails?.mobileNo,
          rating: riderProfileDetails?.overallRating || 0,
          totalRides: riderProfileDetails?.totalRides || 0,
          profileImage: riderProfileDetails?.profileImage || '',
          latitude: riderProfileDetails?.latitude || 0,
          longitude: riderProfileDetails?.longitude || 0,
        };
        if (tripData?.riderId && scanList.length > 0) {
          this.redisHandler.client.set(
            `tripRider-${tripId}`,
            JSON.stringify(tripRiderInfo),
            function (err) {
              Logger.log(
                `[getRunningTripDetail] redis-set -> tripRider-${tripId} -> error :: ${JSON.stringify(
                  err,
                )}`,
              );
            },
          );
        }
      } else {
        this.customLogger.log(
          `[getRunningTripDetail] Rider details > REDIS : ${riderInfoKey}`,
        );
        tripRiderInfo = JSON.parse(riderInfoRedis) || {};
        if (!scanList.length) {
          this.redisHandler.client.del(`tripRider-${tripId}`, function (err) {
            Logger.log(
              `[getRunningTripDetail] redis-del -> tripRider-${tripId} -> error :: ${JSON.stringify(
                err,
              )}`,
            );
          });
        }
      }
      let riderLoc = await this.redisHandler.getRedisKey(
        `location-${tripRiderInfo?.id}-rider`,
      );
      if (riderLoc && tripRiderInfo) {
        riderLoc = JSON.parse(riderLoc);
        tripRiderInfo = {
          ...tripRiderInfo,
          latitude: riderLoc?.lat ?? tripRiderInfo.latitude,
          longitude: riderLoc?.lon ?? tripRiderInfo.longitude,
        };
        this.customLogger.log(
          '[getRunningTripDetail] Rider location > REDIS : ' +
            JSON.stringify(riderLoc),
        );
      }

      // Cab Details
      let cabDetails;
      if (tripData?.cabId) {
        let cabRedis = await this.redisHandler.getRedisKey(
          `cab-type-${tripData.cabId}`,
        );
        let cabResponse;
        if (!cabRedis) {
          this.customLogger.log(
            '[getRunningTripDetail] Cab detail > Kafka :' + tripData.cabId,
          );
          // cabResponse = await this.clientCaptainTCP.send(GET_CAB_TYPE_DETAIL, JSON.stringify({ id: tripData.cabId })).pipe().toPromise();
          cabResponse = { statusCode: HttpStatus.BAD_REQUEST, data: {} };
        } else {
          this.customLogger.log(
            '[getRunningTripDetail] Cab detail > REDIS :' + tripData.cabId,
          );
          cabResponse = {
            statusCode: HttpStatus.OK,
            data: JSON.parse(cabRedis),
          };
        }
        cabDetails = cabResponse?.data ?? {};
      }
      const tripCabInfo: TripDetailCabInfo = {
        id: cabDetails?.id,
        name: cabDetails?.name,
        description: cabDetails?.description,
        nameArabic: cabDetails?.nameArabic,
        descriptionArabic: cabDetails?.descriptionArabic,
        noOfSeats: cabDetails?.noOfSeats,
        baseFare: cabDetails?.passengerBaseFare,
        baseDistance: cabDetails?.passengerBaseDistance,
        baseTime: cabDetails?.passengerBaseTime,
        costPerMin: cabDetails?.passengerCostPerMin,
        costPerKm: cabDetails?.passengerCostPerKm,
        cancellationCharge: cabDetails?.passengerCancellationCharge,
        estimatedTimeArrival: cabDetails?.passengerEstimatedTimeArrival,
        waitChargePerMin: await this.getWaitingChargePerMinute(
          tripData?.cabId,
          cabDetails?.waitChargePerMin,
        ),
        categoryIcon: await this.awsS3Service.getCabTypeFile({
          name: cabDetails.categoryIcon,
        }),
      };

      this.customLogger.log(
        '[getRunningTripDetail] Addresses :: tripId ' + tripId,
      );
      const pickUpAddress = tripData.addresses.find(
        (address) => address.addressType === AddressType.PICK_UP,
      );
      const destinationAddress = tripData.addresses.find(
        (address) => address.addressType === AddressType.DESTINATION,
      );
      const destinationAddressNew = tripData.addresses.find(
        (address) => address.addressType === AddressType.CHANGED_DESTINATION,
      );

      const tripNotStartedStatus = [
        TripStatus.ACCEPTED_BY_DRIVER,
        TripStatus.DRIVER_ARRIVED,
      ];
      const tripOngoingStatus = [TripStatus.STARTED];

      let currentDistance = 0;
      let currentTime = 0;

      const endAddress = tripNotStartedStatus.includes(tripData.status)
        ? pickUpAddress
        : tripOngoingStatus.includes(tripData.status)
        ? destinationAddressNew || destinationAddress
        : null;

      if (endAddress) {
        const total_time_measure = tripData.tripStartedAt
          ? getCalculatedTripTime(
              tripData.tripStartedAt,
              tripData.tripFinishedAt || new Date(getTimestamp()),
            )
          : tripData.estimatedTripTime; //TODO:: to verify startedAt value null issue - divyaraj

        currentTime = total_time_measure;

        const distance: number = tripData.tripDistance;
        const baseFare: number = tripData.baseFare;
        const costPerMin: number = tripData.costPerMin;
        const costPerKm: number = tripData.costPerKm;
        const fareMultiplier: number = tripData.fareMultiplier;

        const tripBaseAmount = await this.estimateFareAmount(tripData.cabId, {
          distance,
          time: total_time_measure,
          baseFare,
          costPerMin,
          costPerKm,
          fareMultiplier,
        });

        // tripData.estimatedTripTime = total_time_measure
        tripData.estimatedBaseAmount = tripBaseAmount;
        const tripFees = await this.getTripFeeSum();
        const taxAmount = await this.calculateTaxAmount(
          tripBaseAmount,
          tripData.taxPercentage,
          tripFees,
        );
        tripData.taxAmount = taxAmount;

        const riderAmount = await this.calculateFareAmountWithTax(tripData.id, {
          tripBaseAmount,
          taxAmount,
        });
        tripData.riderAmount = riderAmount;

        this.customLogger.log(
          '[getRunningTripDetail] estimatedTripTime ::' + total_time_measure,
        );
        this.customLogger.log(
          '[getRunningTripDetail] estimatedBaseAmount ::' + tripBaseAmount,
        );
        this.customLogger.log(
          '[getRunningTripDetail] taxAmount ::' + taxAmount,
        );
        this.customLogger.log(
          '[getRunningTripDetail] riderAmount ::' + riderAmount,
        );
      }

      // Requested driver information
      const otherDetail = { tripExpireTime: null };
      if (driverId) {
        const requestedDriver = tripData.drivers.find(
          (tripDriver: TripDriver) => tripDriver.driverId === driverId,
        );
        if (requestedDriver?.expiredAt) {
          otherDetail.tripExpireTime = requestedDriver.expiredAt;
        }
      }
      this.customLogger.log(
        `[getRunningTripDetail] Requested driver (${driverId}) expiry (${otherDetail.tripExpireTime})`,
      );

      this.customLogger.log(
        '[getRunningTripDetail] Preparing details :: tripId ' + tripId,
      );
      // TODO: filter out the data based on the trip action (instead of giving all data in every action)
      let detailRow: TripDetailSocket = plainToClass(
        TripDetailSocket,
        tripData,
        { excludeExtraneousValues: true },
      );
      let extraRow = {
        driverInfo: tripDriverInfo,
        riderInfo: tripRiderInfo,
        cabType: tripCabInfo?.name,
        cabInfo: tripCabInfo,
        source: {
          address: pickUpAddress?.address || '',
          latitude: pickUpAddress?.latitude || 0,
          longitude: pickUpAddress?.longitude || 0,
        },
        destination: {
          address: destinationAddress?.address || '',
          latitude: destinationAddress?.latitude || 0,
          longitude: destinationAddress?.longitude || 0,
        },
        destinationNew: {
          address: destinationAddressNew?.address || '',
          latitude: destinationAddressNew?.latitude || 0,
          longitude: destinationAddressNew?.longitude || 0,
        },
        currentTime,
        currentDistance,
      };
      detailRow = { ...detailRow, ...extraRow };
      this.customLogger.log(
        `[getRunningTripDetail] -----success---- for tripId: ${tripId}`,
      );
      return ResponseData.success(HttpStatus.OK, {
        ...detailRow,
        ...otherDetail,
      });
    } catch (e) {
      this.customLogger.error(
        '[getRunningTripDetail] error > ',
        e.message + `--tripId: ${tripId}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async notifyTripDetail(
    tripId: string,
    actionType: string,
    extraParams?: any,
  ) {
    this.customLogger.log(
      `[notifyTripDetail] | tripId: ${tripId} | actionType: ${actionType} | extraParams: ${JSON.stringify(
        extraParams,
      )}`,
    );
    const tripDetails = await this.getRunningTripDetail({ tripId });
    let emitData = {
      actionType,
      extraParams,
      data: tripDetails.statusCode === HttpStatus.OK ? tripDetails.data : {},
    };
    if (extraParams?.tripExpireTime) {
      const extraData = {
        tripExpireTime: extraParams.tripExpireTime,
      };
      emitData.data = { ...emitData.data, ...extraData };
    }
    this.customLogger.log(
      `[notifyTripDetail] | emitting data to socket gateway`,
    );
    // this.clientSocketTCP.emit(NOTIFY_TRIP_DETAIL, JSON.stringify(emitData));
    this.socketGateway.emit(NOTIFY_TRIP_DETAIL, JSON.stringify(emitData));
  }

  async waslTripRegister(tripId: string, rating: number) {
    try {
      this.customLogger.start(`[waslTripRegister] | tripId: ${tripId}`);
      const trip = await this.getTripById(tripId, {
        select: [
          'id',
          'driverId',
          'tripDistance',
          'tripTime',
          'tripStartedAt',
          'driverReachedAt',
          'tripFinishedAt',
        ],
        relations: ['addresses'],
      });
      let originLocation: LocationInterface = { latitude: 0, longitude: 0 };
      let destinationLocation: LocationInterface = {
        latitude: 0,
        longitude: 0,
      };
      trip?.addresses?.map((address) => {
        if (address.addressType === AddressType.PICK_UP) {
          originLocation['latitude'] = address.latitude;
          originLocation['longitude'] = address.longitude;
        } else if (address.addressType === AddressType.DROP_OFF) {
          destinationLocation.latitude = address.latitude;
          destinationLocation.longitude = address.longitude;
        }
      });
      const captainId = await this.getDriversCaptainID(trip.driverId);
      const driver = await this.clientCaptainTCP
        .send(CAPTAIN_DETAIL, JSON.stringify({ id: captainId }))
        .pipe()
        .toPromise();
      if (!driver) {
        this.customLogger.error(
          'Driver finding error DriverId: ',
          trip.driverId,
        );
        return ResponseData.error(HttpStatus.NOT_FOUND, 'Driver not found');
      }
      this.customLogger.log(JSON.stringify(driver), 'Driver: ');
      const data = {
        driverId: trip.driverId,
        distanceInMeters: trip.tripDistance * 1000,
        durationInSecondes: trip.tripTime * 60,
        customerWaitingTimeInSeconds: String(
          this.calculateWaitingTime(trip.driverReachedAt, trip.id) * 60,
        ),
        originLatitude: originLocation.latitude,
        originLongitude: originLocation.longitude,
        destinationLatitude: destinationLocation.latitude,
        destinationLongitude: destinationLocation.longitude,
        customerRating: rating,
        startedWhen: trip.tripStartedAt,
        pickupTimestamp: trip.driverReachedAt,
        dropoffTimestamp: trip.tripFinishedAt,
        sequenceNumber: driver.carSequenceNo,
      };
      const waslRes = await this.clientCaptainTCP
        .send(WASL_TRIP_CHECK, JSON.stringify(data))
        .pipe()
        .toPromise();
      this.customLogger.log(
        JSON.stringify(waslRes),
        '----------response---------',
      );
      this.customLogger.end(`[waslTripRegister] | tripId: ${tripId}`);
      return waslRes;
    } catch (e) {
      this.customLogger.error('WASL Error: ', e.message);
      return ResponseData.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // expires all pending request through cron job
  async findAndExpireAllPendingTripDrivers() {
    try {
      const currentDate = getTimestamp();
      const pendingRecords: any = await this.tripDriversService.findAll({
        select: ['id', 'tripId'],
        where: {
          status: TripDriverStatus.PENDING,
          expiredAt: Raw((alias) => `${alias} < :date`, { date: currentDate }),
        },
      });

      const pendingIds = pendingRecords.map(
        (pendingRecord) => pendingRecord.id,
      );
      if (pendingIds && pendingIds.length > 0) {
        await this.tripDriversService.findAllAndUpdate(
          {
            id: In(pendingIds),
            status: TripDriverStatus.PENDING,
          },
          {
            status: TripDriverStatus.EXPIRED,
          },
        );
      }

      const tripIds = pendingRecords.map(
        (pendingRecord) => pendingRecord.tripId,
      );
      if (tripIds && tripIds.length > 0) {
        tripIds.forEach((tripId: string) => {
          this.emitTripsToKafka(tripId);
        });
      }

      return;
    } catch (error) {
      this.customLogger.error(
        'Error in find and expire all pending driver',
        'findAndExpireAllPendingTripDrivers',
        error,
      );
    }
  }

  async sendNotifications(
    code: string,
    trip: any,
    driverId: any,
    misc?: any,
  ) {
    let userIdList = [],
      driverIdList = [];
    // Notifications
    let tripRiderDetails: any = {};
    if (trip?.riderId) {
      userIdList.push(trip.riderId);
      //   this.customLogger.log(`[sendNotifications] Rider request from Customer service : ${trip?.riderId}`);
      //   let tripRiderResponse = await this.customerService.findOne({ userId: Number(trip?.riderId) });
      //   this.customLogger.log(`[sendNotifications] Rider response from Customer service : ${trip?.riderId}`);
      //   if (tripRiderResponse && tripRiderResponse.statusCode == HttpStatus.OK) {
      //     tripRiderDetails = tripRiderResponse.data;
      //   }
    }
    let tripDriverDetails: any = {};
    if (driverId) {
      userIdList.push(driverId);
      //   this.customLogger.log(`[sendNotifications] Driver request from Customer service : ${driverId}`);
      //   let tripDriverResponse = await this.customerService.findOne({ driverId: driverId });
      //   this.customLogger.log(`[sendNotifications] Driver response from Customer service : ${driverId}`);
      //   if (tripDriverResponse && tripDriverResponse.statusCode == HttpStatus.OK) {
      //     tripDriverDetails = tripDriverResponse.data;
      //   }
    }
    this.customLogger.log(
      `[sendNotifications] Request from Customer service : ${JSON.stringify({
        userIdList,
        driverIdList,
      })}`,
    );
    let customersResponse: any = await this.customerService.findByIdList({
      userIdList,
      driverIdList,
    });
    this.customLogger.log(
      `[sendNotifications] Response from Customer service : ${JSON.stringify({
        userIdList,
        driverIdList,
      })}`,
    );
    if (customersResponse && customersResponse.statusCode === HttpStatus.OK) {
      tripRiderDetails =
        customersResponse.data.find(
          (cusRow) => cusRow.userId && cusRow.userId == trip?.riderId,
        ) ?? {};
      tripDriverDetails =
        customersResponse.data.find(
          (cusRow) => cusRow.userId && cusRow.userId == driverId,
        ) ?? {};
      this.customLogger.log(
        `[sendNotifications] Got details of Driver : ${tripDriverDetails?.id} & Rider : ${tripRiderDetails?.id}`,
      );
    }

    this.customLogger.log(
      `rider details for notification ${JSON.stringify(tripRiderDetails)}`,
    );
    this.customLogger.log(
      `driver details for notification ${JSON.stringify(tripDriverDetails)}`,
    );

    const riderName = `${tripRiderDetails.firstName} ${tripRiderDetails.lastName}`;
    const riderNameArabic = tripRiderDetails?.arabicFirstName
      ? `${tripRiderDetails.arabicFirstName} ${tripRiderDetails.arabicLastName}`
      : null;
    const captainName = tripDriverDetails?.firstName
      ? `${tripDriverDetails?.firstName} ${tripDriverDetails?.lastName}`
      : '';
    const captainNameArabic = tripDriverDetails?.arabicFirstName
      ? `${tripDriverDetails?.arabicFirstName} ${tripDriverDetails?.arabicLastName}`
      : null;

    // RIDER
    // SMS notification to rider
    const riderSmsActionCodes = {
      scheduled_trip_confirmation: 'RIDER_SCHEDULED_TRIP_CONFIRMATION_TO_RIDER',
      driver_accepted: 'TRIP_ACCEPTED_TO_RIDER',
      trip_completed: 'TRIP_ENDED_TO_RIDER',
      trip_completed_by_driver: 'TRIP_COMPLETED_BY_DRIVER_TO_RIDER',
    };
    if (code in riderSmsActionCodes) {
      try {
        const smsParams: any = {
          externalId: tripRiderDetails?.userId,
          language: tripRiderDetails?.prefferedLanguage,
          mobileNo: tripRiderDetails?.mobileNo,
          templateCode: riderSmsActionCodes[code],
          keyValues: {
            riderName:
              tripRiderDetails?.prefferedLanguage === 'AR'
                ? riderNameArabic || riderName
                : riderName,
            captainName:
              tripRiderDetails?.prefferedLanguage === 'AR'
                ? captainNameArabic || captainName
                : captainName,
            tripNo: trip?.tripNo,
            // TODO: depends upon template
          },
        };
        this.customLogger.log(
          `[sendNotifications] sms notify to : ${smsParams.mobileNo} || ${smsParams.externalId}`,
        );
        this.clientNotification.emit(
          SEND_SMS_NOTIFICATION,
          JSON.stringify(smsParams),
        );
      } catch (e) {
        this.customLogger.error(e.message);
      }
    }
    // Push notification to rider
    const riderPushActionCodes = {
      scheduled_trip_confirmation: 'RIDER_SCHEDULED_TRIP_CONFIRMATION_TO_RIDER',
      scheduled_trip_cancelled_as_current_trip_is_in_progress:
        'SCHEDULED_TRIP_CANCELLED_AS_CURRENT_TRIP_IS_IN_PROGRESS_TO_RIDER',
      scheduled_trip_cancelled_as_driver_mode_is_on:
        'SCHEDULED_TRIP_CANCELLED_AS_DRIVER_MODE_IS_ON_TO_RIDER',
      driver_accepted: 'TRIP_ACCEPTED_TO_RIDER',
      rider_cancelled: 'TRIP_CANCELLED_BY_RIDER_TO_RIDER',
      driver_cancelled: 'TRIP_CANCELLED_BY_DRIVER_TO_RIDER',
      driver_reached: 'DRIVER_REACHED_PICKUP_LOCATION_TO_RIDER',
      waiting_charges: 'WAITING_CHARGES_TO_RIDER',
      trip_cancelled_after_reaching_pickup_location:
        'TRIP_CANCELLED_AFTER_REACHING_PICKUP_LOCATION_TO_RIDER',
      trip_completed_by_driver: 'TRIP_COMPLETED_BY_DRIVER_TO_RIDER',
      no_drivers: 'DRIVERS_NOT_AVAILABLE_TO_RIDER',
      trip_expired: 'TRIP_REQUEST_EXPIRED_TO_RIDER',
      admin_cancelled: 'TRIP_CANCELLED_BY_ADMIN_TO_RIDER',
      rider_updated_destination: 'DESTINATION_CHANGED_TO_RIDER',
    };
    if (code in riderPushActionCodes) {
      try {
        const type =
          code === 'trip_cancelled_after_reaching_pickup_location'
            ? 'driver_cancelled'
            : code;
        const pushParams: any = {
          externalId: tripRiderDetails?.userId,
          language: tripRiderDetails?.prefferedLanguage,
          deviceToken: tripRiderDetails?.deviceToken,
          templateCode: riderPushActionCodes[code],
          keyValues: {
            riderName:
              tripRiderDetails?.prefferedLanguage === 'AR'
                ? riderNameArabic || riderName
                : riderName,
            captainName:
              tripRiderDetails?.prefferedLanguage === 'AR'
                ? captainNameArabic || captainName
                : captainName,
            tripNo: trip?.tripNo,
            amount: `${trip?.riderAmount || 0} SAR`,
            tax: `${trip?.taxAmount || 0} SAR`,
            // TODO: depends upon template
          },
          extraParams: {
            type: type,
            userID: tripRiderDetails?.userId,
            tripID: trip?.id,
          },
        };
        this.customLogger.log(
          `[sendNotifications] push notify to : ${pushParams.externalId}`,
        );
        this.clientNotification.emit(
          SEND_PUSH_NOTIFICATION,
          JSON.stringify(pushParams),
        );
      } catch (e) {
        this.customLogger.error(e.message);
      }
    }
    // Email notification for rider
    const riderEmailActionCodes = {
      trip_completed: 'TRIP_ENDED_TO_RIDER',
    };
    let driverEmailKeys: DriverTripCompletedEmailDto = {};
    let pickupAddressForDriverEmail;
    let dropOffAddressForDriverEmail;

    let keyValues: RiderTripCompletedEmailDto = {};
    keyValues.startTime = formatAMPM(trip?.tripStartedAt);
    keyValues.endTime = formatAMPM(trip?.tripFinishedAt);
    keyValues.tripTime = trip?.tripTime;
    keyValues.totalKm = trip?.tripDistanceCovered;
    keyValues.tripImage = '';
    keyValues.noOfSeats = 0;
    keyValues.carPlatNo = '';
    keyValues.vehicleCategory = '';
    keyValues.vehicleImage = '';
    keyValues.vehicleDescription = '';

    if (code in riderEmailActionCodes) {
      try {
        if (code === TripsAction.trip_completed) {
          const pickUpAddressObj =
            trip.addresses.find(
              (pickUp) => pickUp.addressType == AddressType.PICK_UP,
            ) ?? {};
          pickupAddressForDriverEmail = pickUpAddressObj;
          const dropOffAddressObj =
            trip.addresses.find(
              (pickUp) => pickUp.addressType == AddressType.DROP_OFF,
            ) ?? {};
          dropOffAddressForDriverEmail = dropOffAddressObj;
          const tripDriverResponse = await this.clientCaptainTCP
            .send(
              CAPTAIN_DETAIL,
              JSON.stringify({
                id: tripDriverDetails?.driverId,
                data: {
                  isFullDetail: true,
                  isReviewDetail: true,
                  isRatingDetail: true,
                },
              }),
            )
            .pipe()
            .toPromise();
          if (
            tripDriverResponse &&
            tripDriverResponse.statusCode == HttpStatus.OK
          ) {
            if (tripDriverResponse?.data?.cab) {
              keyValues.carPlatNo = tripDriverResponse?.data?.carPlateNo;
              const cabImageUrl = await this.awsS3Service.getCabTypeFile({
                name: tripDriverResponse?.data?.cab?.categoryIcon,
              });
              keyValues.vehicleCategory = tripDriverResponse?.data?.cab?.name;
              keyValues.noOfSeats = tripDriverResponse?.data?.cab?.noOfSeats;
              keyValues.vehicleImage = cabImageUrl;
              keyValues.vehicleDescription =
                tripDriverResponse?.data?.cab?.description;
            }
          }
          const tripId: any = trip.id;
          const tripImages = await this.tripImagesRepository.findOne({
            where: { trip: tripId },
            order: { createdAt: 'DESC' },
          });
          if (tripImages) {
            let tripImaeUrl = await this.awsS3Service.getTripFiles({
              name: tripImages.image,
              id: tripId,
            });
            keyValues.tripImage = tripImaeUrl;
          }

          keyValues.totalFare = trip?.riderAmount;
          keyValues.tripFare = trip?.riderAmount;
          keyValues.subTotal = trip?.riderAmount;
          keyValues.amountCharged = trip?.riderAmount;

          keyValues.pickUp =
            tripRiderDetails?.prefferedLanguage === 'AR'
              ? pickUpAddressObj.cityNameInArabic || pickUpAddressObj.address
              : pickUpAddressObj.address;
          keyValues.dropOff =
            tripRiderDetails?.prefferedLanguage === 'AR'
              ? dropOffAddressObj.cityNameInArabic || dropOffAddressObj.address
              : dropOffAddressObj.address;
          keyValues.dayPart = getDayPart(
            trip?.tripStartedAt,
            tripRiderDetails?.prefferedLanguage,
          );
          keyValues.mailDate = formatDate(new Date(), 'do M yyyy');
        }

        keyValues.tripNo = trip?.tripNo;
        driverEmailKeys = { ...keyValues }; //Assign value to driver emails

        keyValues.riderName =
          tripRiderDetails?.prefferedLanguage === 'AR'
            ? riderNameArabic || riderName
            : riderName;
        keyValues.captainName =
          tripRiderDetails?.prefferedLanguage === 'AR'
            ? captainNameArabic || captainName
            : captainName;

        const emailParams = {
          receiver: tripRiderDetails?.emailId,
          language: tripRiderDetails?.prefferedLanguage,
          templateCode: riderEmailActionCodes[code],
          keyValues: keyValues,
        };
        this.customLogger.log(
          `[sendNotifications] email notify to : ${emailParams.receiver}`,
        );
        this.clientNotification.emit(
          SEND_EMAIL_NOTIFICATION,
          JSON.stringify(emailParams),
        );
      } catch (e) {
        this.customLogger.error(e.message);
      }
    }

    // DRIVER
    // SMS notification to driver
    const driverSmsActionCodes = {
      trip_request: 'TRIP_REQUEST_IMMEDIATE_TO_DRIVER',
      trip_completed_by_rider: 'TRIP_COMPLETED_BY_RIDER_TO_DRIVER',
    };
    if (code in driverSmsActionCodes) {
      try {
        const smsParams: any = {
          externalId: tripDriverDetails?.userId,
          language: tripDriverDetails?.prefferedLanguage,
          mobileNo: tripDriverDetails?.mobileNo,
          templateCode: driverSmsActionCodes[code],
          keyValues: {
            riderName:
              tripDriverDetails?.prefferedLanguage === 'AR'
                ? riderNameArabic || riderName
                : riderName,
            captainName:
              tripDriverDetails?.prefferedLanguage === 'AR'
                ? captainNameArabic || captainName
                : captainName,
            tripNo: trip?.tripNo,
            // TODO: depends upon template
          },
        };
        if (code === 'trip_request') {
          smsParams.keyValues['tripExpireTime'] = misc?.tripExpireTime;
        }
        this.customLogger.log(
          `[sendNotifications] sms notify to : ${smsParams.mobileNo} || ${smsParams.externalId}`,
        );
        this.clientNotification.emit(
          SEND_SMS_NOTIFICATION,
          JSON.stringify(smsParams),
        );
      } catch (e) {
        this.customLogger.error(e.message);
      }
    }
    // Push notification to driver
    const driverPushActionCodes = {
      trip_request: 'TRIP_REQUEST_IMMEDIATE_TO_DRIVER',
      rider_cancelled: 'TRIP_CANCELLED_BY_RIDER_TO_DRIVER',
      rider_updated_destination: 'DESTINATION_CHANGED_TO_DRIVER',
      trip_completed_by_rider: 'TRIP_COMPLETED_BY_RIDER_TO_DRIVER',
      admin_cancelled: 'TRIP_CANCELLED_BY_ADMIN_TO_DRIVER',
    };
    if (code in driverPushActionCodes) {
      try {
        const pushParams: any = {
          externalId: tripDriverDetails?.userId,
          language: tripDriverDetails?.prefferedLanguage,
          deviceToken: tripDriverDetails?.deviceToken,
          templateCode: driverPushActionCodes[code],
          keyValues: {
            riderName:
              tripDriverDetails?.prefferedLanguage === 'AR'
                ? riderNameArabic || riderName
                : riderName,
            captainName:
              tripDriverDetails?.prefferedLanguage === 'AR'
                ? captainNameArabic || captainName
                : captainName,
            tripNo: trip?.tripNo,
            amount: `${trip?.driverAmount || 0} SAR`,
            fee: `${
              Number(await this.getInstantTransferFee()) +
              Number(await this.getTripWaslFee())
            } SAR`,
            // TODO: depends upon template
          },
          extraParams: {
            type: code,
            userID: tripDriverDetails?.userId,
            tripID: trip?.id,
          },
        };
        if (code === 'trip_request') {
          pushParams.keyValues['tripExpireTime'] = misc?.tripExpireTime;
          pushParams.extraParams['tripExpireTime'] = misc?.tripExpireTime;
        }
        this.customLogger.log(
          `[sendNotifications] push notify to : ${pushParams.externalId}`,
        );
        this.clientNotification.emit(
          SEND_PUSH_NOTIFICATION,
          JSON.stringify(pushParams),
        );
      } catch (e) {
        this.customLogger.error(e.message);
      }
    }
    // Email notification for rider
    const driverEmailActionCodes = {
      trip_completed: 'TRIP_ENDED_TO_DRIVER',
    };
    if (code in driverEmailActionCodes) {
      try {
        driverEmailKeys.riderName =
          tripDriverDetails?.prefferedLanguage === 'AR'
            ? riderNameArabic || riderName
            : riderName;
        driverEmailKeys.captainName =
          tripDriverDetails?.prefferedLanguage === 'AR'
            ? captainNameArabic || captainName
            : captainName;

        driverEmailKeys.serviceTax = trip?.taxPercentage || 0;
        driverEmailKeys.taxAmount =
          trip?.taxAmount && trip?.taxAmount > 0 ? trip?.taxAmount : 0;
        driverEmailKeys.amountEarned = trip?.driverAmount || 0;
        driverEmailKeys.tripFare = trip?.baseFare || 0;
        driverEmailKeys.perkmCharges = trip?.costPerKm || 0;
        driverEmailKeys.perMinCharges = trip?.costPerMin || 0;
        driverEmailKeys.totalCost = trip?.riderAmount || 0;
        driverEmailKeys.dayPart = getDayPart(
          trip?.tripStartedAt,
          tripDriverDetails?.prefferedLanguage,
        );
        driverEmailKeys.pickUp =
          tripDriverDetails?.prefferedLanguage === 'AR'
            ? pickupAddressForDriverEmail.cityNameInArabic ||
              pickupAddressForDriverEmail.address
            : pickupAddressForDriverEmail.address;
        driverEmailKeys.dropOff =
          tripDriverDetails?.prefferedLanguage === 'AR'
            ? dropOffAddressForDriverEmail.cityNameInArabic ||
              dropOffAddressForDriverEmail.address
            : dropOffAddressForDriverEmail.address;

        const emailParams = {
          receiver: tripDriverDetails?.emailId,
          language: tripDriverDetails?.prefferedLanguage,
          templateCode: driverEmailActionCodes[code],
          keyValues: driverEmailKeys,
        };
        this.customLogger.log(
          `[sendNotifications] email notify to : ${emailParams.receiver}`,
        );
        this.clientNotification.emit(
          SEND_EMAIL_NOTIFICATION,
          JSON.stringify(emailParams),
        );
      } catch (e) {
        this.customLogger.error(e.message);
      }
    }
    // ADMIN
    // Email notification for admin
    const adminActionCodes = {
      rider_cancelled: 'TRIP_CANCELLED_BY_RIDER_TO_ADMIN',
      driver_cancelled: 'TRIP_CANCELLED_BY_DRIVER_TO_ADMIN',
      trip_completed: 'TRIP_ENDED_TO_ADMIN',
    };
    if (code in adminActionCodes) {
      try {
        const adminEmail = await this.redisHandler.getRedisKey(
          'SETTING_ADMIN_RIDE_NOTIFICATION_EMAIL',
        );
        const emailParams = {
          receiver: adminEmail,
          templateCode: adminActionCodes[code],
          keyValues: {
            riderName: riderName,
            captainName: captainName,
            tripNo: trip?.tripNo,
            // TODO: depends upon template
          },
        };
        this.customLogger.log(
          `[sendNotifications] email notify to : ${emailParams.receiver}`,
        );
        this.clientNotification.emit(
          SEND_EMAIL_NOTIFICATION,
          JSON.stringify(emailParams),
        );
      } catch (e) {
        this.customLogger.error(e.message);
      }
    }
  }

  async getDashboardStats(params: StatsParams) {
    try {
      let { fromDate, toDate } = params;
      const type: string = params.type || 'week';

      let startDate, endDate, prevStartDate, prevEndDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        [startDate, endDate] = getDateBounds(type, 'recent');
      }
      // Total Counts
      let riderTotalCount;
      let driverTotalCount;
      let tripTotalCount;
      {
        // Rider Stats
        const riderQryInstance = this.customerRepository.createQueryBuilder(
          'customer',
        );
        riderQryInstance.where('customer.isRider = :isRider', {
          isRider: true,
        });
        riderTotalCount = await riderQryInstance.getCount();
        riderTotalCount = riderTotalCount || 0;

        // Driver Stats
        const driverQryInstance = this.customerRepository.createQueryBuilder(
          'customer',
        );
        driverQryInstance.where('customer.userType = :userType', {
          userType: UserExternalType.Captain,
        });
        driverTotalCount = await driverQryInstance.getCount();
        driverTotalCount = driverTotalCount || 0;

        // Trip Stats
        const tripQryInstance = this.tripsRepository.createQueryBuilder(
          'trips',
        );
        tripQryInstance.where('trips.status IN (:...status)', {
          status: [
            TripStatus.PENDING,
            TripStatus.NO_DRIVER,
            TripStatus.REJECTED_BY_DRIVER,
            TripStatus.ACCEPTED_BY_DRIVER,
            TripStatus.CANCELLED_BY_DRIVER,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.CANCELLED_BY_ADMIN,
            TripStatus.DRIVER_ARRIVED,
            TripStatus.STARTED,
            TripStatus.COMPLETED,
          ],
        });
        tripTotalCount = await tripQryInstance.getCount();
        tripTotalCount = tripTotalCount || 0;
      }
      // Current Period Counts
      let riderPeriodCount;
      let driverPeriodCount;
      let tripPeriodCount;
      {
        // Rider Stats
        const riderQryInstance = this.customerRepository.createQueryBuilder(
          'customer',
        );
        riderQryInstance.innerJoin('customer.rides', 'rides');
        riderQryInstance.where('customer.isRider = :isRider', {
          isRider: true,
        });
        riderQryInstance.andWhere(
          "DATE_FORMAT(rides.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate },
        );
        riderQryInstance.andWhere(
          "DATE_FORMAT(rides.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate },
        );
        riderPeriodCount = await riderQryInstance.getCount();
        riderPeriodCount = riderPeriodCount || 0;

        // Driver Stats
        const driverQryInstance = this.customerRepository.createQueryBuilder(
          'customer',
        );
        driverQryInstance.innerJoin('customer.trips', 'trips');
        driverQryInstance.where('customer.userType = :userType', {
          userType: UserExternalType.Captain,
        });
        driverQryInstance.andWhere(
          "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate },
        );
        driverQryInstance.andWhere(
          "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate },
        );
        driverPeriodCount = await driverQryInstance.getCount();
        driverPeriodCount = driverPeriodCount || 0;

        // Trip Stats
        const tripQryInstance = this.tripsRepository.createQueryBuilder(
          'trips',
        );
        tripQryInstance.where('trips.status IN (:...status)', {
          status: [
            TripStatus.PENDING,
            TripStatus.NO_DRIVER,
            TripStatus.REJECTED_BY_DRIVER,
            TripStatus.ACCEPTED_BY_DRIVER,
            TripStatus.CANCELLED_BY_DRIVER,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.CANCELLED_BY_ADMIN,
            TripStatus.DRIVER_ARRIVED,
            TripStatus.STARTED,
            TripStatus.COMPLETED,
          ],
        });
        tripQryInstance.andWhere(
          "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate },
        );
        tripQryInstance.andWhere(
          "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate },
        );
        tripPeriodCount = await tripQryInstance.getCount();
        tripPeriodCount = tripPeriodCount || 0;
      }
      // Previous Period Counts
      let riderPreviousCount;
      let driverPreviousCount;
      let tripPreviousCount;
      if (type !== 'custom') {
        [prevStartDate, prevEndDate] = getPrevBounds(type, startDate);
        // Rider Stats
        const riderQryInstance = this.customerRepository.createQueryBuilder(
          'customer',
        );
        riderQryInstance.innerJoin('customer.rides', 'rides');
        riderQryInstance.where('customer.isRider = :isRider', {
          isRider: true,
        });
        riderQryInstance.andWhere(
          "DATE_FORMAT(rides.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate: prevStartDate },
        );
        riderQryInstance.andWhere(
          "DATE_FORMAT(rides.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate: prevEndDate },
        );
        riderPreviousCount = await riderQryInstance.getCount();
        riderPreviousCount = riderPreviousCount || 0;

        // Driver Stats
        const driverQryInstance = this.customerRepository.createQueryBuilder(
          'customer',
        );
        driverQryInstance.innerJoin('customer.trips', 'trips');
        driverQryInstance.where('customer.userType = :userType', {
          userType: UserExternalType.Captain,
        });
        driverQryInstance.andWhere(
          "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate: prevStartDate },
        );
        driverQryInstance.andWhere(
          "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate: prevEndDate },
        );
        driverPreviousCount = await driverQryInstance.getCount();
        driverPreviousCount = driverPreviousCount || 0;

        // Trip Stats
        const tripQryInstance = this.tripsRepository.createQueryBuilder(
          'trips',
        );
        tripQryInstance.where('trips.status IN (:...status)', {
          status: [
            TripStatus.PENDING,
            TripStatus.NO_DRIVER,
            TripStatus.REJECTED_BY_DRIVER,
            TripStatus.ACCEPTED_BY_DRIVER,
            TripStatus.CANCELLED_BY_DRIVER,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.CANCELLED_BY_ADMIN,
            TripStatus.DRIVER_ARRIVED,
            TripStatus.STARTED,
            TripStatus.COMPLETED,
          ],
        });
        tripQryInstance.andWhere(
          "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate: prevStartDate },
        );
        tripQryInstance.andWhere(
          "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate: prevEndDate },
        );
        tripPreviousCount = await tripQryInstance.getCount();
        tripPreviousCount = tripPreviousCount || 0;
      }

      const finalStats = {
        rider: { count: 0, percentage: 0, status: '--' },
        driver: { count: 0, percentage: 0, status: '--' },
        trip: { count: 0, percentage: 0, status: '--' },
        available_cars: { count: 0, percentage: 0, status: '--' },
      };

      finalStats.rider.count = Number(riderTotalCount || 0);
      if (riderPeriodCount > 0) {
        if (type === 'custom') {
          let diffTotal = riderTotalCount - riderPeriodCount;
          finalStats.rider.percentage = getPercentageFormatted(
            (Math.abs(diffTotal) * 100) / riderTotalCount,
          );
          finalStats.rider.status = diffTotal < 0 ? 'down' : 'up';
        } else {
          let diffTotal = riderPeriodCount - riderPreviousCount;
          finalStats.rider.percentage = getPercentageFormatted(
            (Math.abs(diffTotal) * 100) / riderPeriodCount,
          );
          finalStats.rider.status = diffTotal < 0 ? 'down' : 'up';
        }
      }

      finalStats.driver.count = Number(driverTotalCount || 0);
      if (driverPeriodCount > 0) {
        if (type === 'custom') {
          let diffTotal = driverTotalCount - driverPeriodCount;
          finalStats.driver.percentage = getPercentageFormatted(
            (Math.abs(diffTotal) * 100) / driverTotalCount,
          );
          finalStats.driver.status = diffTotal < 0 ? 'down' : 'up';
        } else {
          let diffTotal = driverPeriodCount - driverPreviousCount;
          finalStats.driver.percentage = getPercentageFormatted(
            (Math.abs(diffTotal) * 100) / driverPeriodCount,
          );
          finalStats.driver.status = diffTotal < 0 ? 'down' : 'up';
        }
      }

      finalStats.trip.count = Number(tripTotalCount || 0);
      if (tripPeriodCount > 0) {
        if (type === 'custom') {
          let diffTotal = tripTotalCount - tripPeriodCount;
          finalStats.trip.percentage = getPercentageFormatted(
            (Math.abs(diffTotal) * 100) / tripTotalCount,
          );
          finalStats.trip.status = diffTotal < 0 ? 'down' : 'up';
        } else {
          let diffTotal = tripPeriodCount - tripPreviousCount;
          finalStats.trip.percentage = getPercentageFormatted(
            (Math.abs(diffTotal) * 100) / tripPeriodCount,
          );
          finalStats.trip.status = diffTotal < 0 ? 'down' : 'up';
        }
      }

      const driverResp = await this.clientCaptainTCP
        .send(DASHBOARD_ACTIVE_DRIVERS, {})
        .pipe()
        .toPromise();
      if (driverResp.statusCode === HttpStatus.OK) {
        const onlineStats = driverResp.data.graphList.filter(
          (row) => row.key == 'online',
        );
        const availableCount = onlineStats ? onlineStats[0].value : 0;
        finalStats.available_cars.count = Number(availableCount || 0);
      }
      return ResponseData.success(HttpStatus.OK, finalStats);
    } catch (err) {
      this.customLogger.error('[getDashboardStats] error > ' + err.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getTripStats(params: StatsParams) {
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
        'COUNT(trips.id) AS rowTotal',
        'MAX(trips.createdAt) AS maxDate',
        'trips.status',
        'HOUR(trips.createdAt) AS hour',
      ];
      if (type === 'year') {
        fields.push('DATE_FORMAT(trips.createdAt,"%Y-%m") AS rowDateFormat');
      } else if (type === 'month') {
        fields.push('WEEK(trips.createdAt) AS rowDateFormat');
      } else if (type === 'week') {
        fields.push('DATE_FORMAT(trips.createdAt,"%Y-%m-%d") AS rowDateFormat');
      } else {
        fields.push('trips.createdAt AS rowDateFormat');
      }
      const tripQryInstance = this.tripsRepository.createQueryBuilder('trips');
      tripQryInstance.select(fields);
      tripQryInstance.where('trips.status IN (:...status)', {
        status: [
          TripStatus.CANCELLED_BY_DRIVER,
          TripStatus.CANCELLED_BY_RIDER,
          TripStatus.CANCELLED_BY_ADMIN,
          TripStatus.REJECTED_BY_DRIVER,
          TripStatus.ACCEPTED_BY_DRIVER,
          TripStatus.DRIVER_ARRIVED,
          TripStatus.STARTED,
          TripStatus.COMPLETED,
          TripStatus.NO_DRIVER,
          TripStatus.EXPIRED,
        ],
      });
      tripQryInstance.andWhere(
        "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') >= :startDate",
        { startDate },
      );
      tripQryInstance.andWhere(
        "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') <= :endDate",
        { endDate },
      );
      tripQryInstance.groupBy('rowDateFormat,trips.status');
      let results = await tripQryInstance.getRawMany();
      this.customLogger.debug(
        '[getTripStats] results: ' + JSON.stringify(results),
      );

      const morning = 5;
      const afternoon = 12;
      const evening = 18;
      const night = 21;

      const totalStats = {
        completed: 0,
        cancelled: 0,
        unmatched: 0,
      };
      const timeZoneTotalStats = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
      };

      const cancelledTotalStats = {
        cancelledByRider: 0,
        cancelledByAdmin: 0,
        cancelledByCaptain: 0,
      };

      const graphList = [];
      const cancelledGraphList = [];
      const timeZoneGraphList = [];

      if (results?.length) {
        let dateStats = {};
        let cancelledDateStats = {};
        let timeZoneDateStats = {};

        let statCode,
          statLabel,
          cancelledStatCode,
          cancelledStatLabel,
          timeZoneStatCode,
          timeZoneStatLabel;
        results.forEach((record) => {
          const hour = Number(record.hour) + 3; // for suaida
          statCode = '';
          cancelledStatCode = '';
          timeZoneStatCode = '';

          if (hour >= morning && hour < afternoon) timeZoneStatCode = 'morning';
          else if (hour >= afternoon && hour < evening)
            timeZoneStatCode = 'afternoon';
          else if (hour >= evening && hour < night)
            timeZoneStatCode = 'evening';
          else timeZoneStatCode = 'night';

          /////////////---------///////////////

          if (
            [
              TripStatus.CANCELLED_BY_RIDER,
              TripStatus.CANCELLED_BY_DRIVER,
              TripStatus.CANCELLED_BY_ADMIN,
            ].includes(Number(record.trips_status))
          ) {
            statCode = 'cancelled';
            cancelledStatCode =
              Number(record.trips_status) == TripStatus.CANCELLED_BY_RIDER
                ? 'cancelledByRider'
                : Number(record.trips_status) == TripStatus.CANCELLED_BY_ADMIN
                ? 'cancelledByAdmin'
                : 'cancelledByCaptain';
          } else if (
            [
              TripStatus.REJECTED_BY_DRIVER,
              TripStatus.NO_DRIVER,
              TripStatus.EXPIRED,
            ].includes(Number(record.trips_status))
          ) {
            statCode = 'unmatched';
          } else if (
            [
              TripStatus.ACCEPTED_BY_DRIVER,
              TripStatus.DRIVER_ARRIVED,
              TripStatus.STARTED,
              TripStatus.COMPLETED,
            ].includes(Number(record.trips_status))
          ) {
            statCode = 'completed';
          }
          if (type === 'month') {
            record.maxDate = getDateOfWeek(
              Number(record.rowDateFormat),
              record.maxDate.getFullYear(),
            );
          }
          statLabel = getGraphLabel(record.maxDate, type);
          if (!dateStats[statLabel]) {
            this.customLogger.debug();
            dateStats[statLabel] = {};
          }
          if (statCode !== '') {
            totalStats[statCode] += Number(record.rowTotal || 0);
            dateStats[statLabel][statCode] =
              (dateStats[statLabel][statCode] || 0) +
              Number(record.rowTotal || 0);
          }

          cancelledStatLabel = getGraphLabel(record.maxDate, type);
          if (!cancelledDateStats[cancelledStatLabel]) {
            cancelledDateStats[cancelledStatLabel] = {};
          }

          if (cancelledStatCode !== '') {
            cancelledTotalStats[cancelledStatCode] += Number(
              record.rowTotal || 0,
            );
            cancelledDateStats[cancelledStatLabel][cancelledStatCode] =
              (cancelledDateStats[cancelledStatLabel][cancelledStatCode] || 0) +
              Number(record.rowTotal || 0);
          }

          timeZoneStatLabel = getGraphLabel(record.maxDate, type);
          if (!timeZoneDateStats[timeZoneStatLabel]) {
            timeZoneDateStats[timeZoneStatLabel] = {};
          }

          if (timeZoneStatCode !== '') {
            timeZoneTotalStats[timeZoneStatCode] += Number(
              record.rowTotal || 0,
            );
            timeZoneDateStats[timeZoneStatLabel][timeZoneStatCode] =
              (timeZoneDateStats[timeZoneStatLabel][timeZoneStatCode] || 0) +
              Number(record.rowTotal || 0);
          }
        });

        const totalVal = Object.keys(totalStats).reduce((prev, curr) => {
          return prev + totalStats[curr];
        }, 0);

        if (totalVal > 0) {
          Object.keys(totalStats).map((statKey) => {
            totalStats[statKey] = Math.round(
              (totalStats[statKey] / totalVal) * 100,
            );
            // totalStats[statKey] += totalStats[statKey];
          });
        }
        this.customLogger.debug(
          '[getTripStats] dateStats: ' + JSON.stringify(dateStats),
        );
        this.customLogger.debug(
          '[getTripStats] totalStats: ' + JSON.stringify(totalStats),
        );
        let loopKey,
          loopVal,
          loopObj,
          cancelledLoopVal,
          cancelledLoopObj,
          timeZoneLoopVal,
          timeZoneLoopObj;
        const rangeList = getDateRange(type);
        rangeList.forEach((dateVal) => {
          loopKey = getGraphLabel(dateVal, type);

          loopObj = dateStats[loopKey] ?? {};
          loopVal = [];

          Object.keys(loopObj).forEach((innKey) => {
            loopVal.push({
              key: innKey,
              value: Number(loopObj[innKey]),
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

          /////////////cancelled graph

          cancelledLoopObj = cancelledDateStats[loopKey] ?? {};
          cancelledLoopVal = [];
          Object.keys(cancelledLoopObj).forEach((innKey) => {
            cancelledLoopVal.push({
              key: innKey,
              value: Number(cancelledLoopObj[innKey]),
            });
          });
          Object.keys(cancelledTotalStats).forEach((statKey) => {
            cancelledLoopObj = cancelledLoopVal.find(
              (innVal) => innVal.key == statKey,
            );
            if (!cancelledLoopObj) {
              cancelledLoopVal.push({
                key: statKey,
                value: 0,
              });
            }
          });
          cancelledGraphList.push({
            key: loopKey,
            data: cancelledLoopVal,
          });

          ///////////timezone graph...........

          timeZoneLoopObj = timeZoneDateStats[loopKey] ?? {};
          timeZoneLoopVal = [];
          Object.keys(timeZoneLoopObj).forEach((innKey) => {
            timeZoneLoopVal.push({
              key: innKey,
              value: Number(timeZoneLoopObj[innKey]),
            });
          });
          Object.keys(timeZoneTotalStats).forEach((statKey) => {
            timeZoneLoopObj = timeZoneLoopVal.find(
              (innVal) => innVal.key == statKey,
            );
            if (!timeZoneLoopObj) {
              timeZoneLoopVal.push({
                key: statKey,
                value: 0,
              });
            }
          });
          timeZoneGraphList.push({
            key: loopKey,
            data: timeZoneLoopVal,
          });
        });
        timeZoneDateStats = {};
        cancelledDateStats = {};
        dateStats = {};
        results = [];
      }

      return ResponseData.success(HttpStatus.OK, {
        timeZoneGraphList,
        cancelledGraphList,
        graphList,
        percentaged: totalStats,
        timeZoneTotalStats,
        cancelledTotalStats,
      });
    } catch (err) {
      this.customLogger.error('[getTripStats] error > ' + err.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getActiveRiders(params: StatsParams) {
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
        'COUNT(customer.id) AS rowTotal',
        'MAX(customer.createdAt) AS maxDate',
      ];
      if (type === 'year') {
        fields.push('DATE_FORMAT(customer.createdAt,"%Y-%m") AS rowDateFormat');
      } else if (type === 'month') {
        fields.push('WEEK(customer.createdAt) AS rowDateFormat');
      } else if (type === 'week') {
        fields.push(
          'DATE_FORMAT(customer.createdAt, "%d/%m/%Y") AS rowDateFormat',
        ); //"%Y-%m-%d"
      } else {
        fields.push('customer.createdAt AS rowDateFormat');
      }
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select(fields);
      riderQryInstance.where('customer.isRider = :isRider', { isRider: true });
      riderQryInstance.andWhere(
        "DATE_FORMAT(customer.createdAt, '%Y-%m-%d') >= :startDate",
        { startDate },
      );
      riderQryInstance.andWhere(
        "DATE_FORMAT(customer.createdAt, '%Y-%m-%d') <= :endDate",
        { endDate },
      );
      riderQryInstance.groupBy('rowDateFormat');
      const results = await riderQryInstance.getRawMany();
      this.customLogger.debug(
        `[getActiveRiders] results > ${JSON.stringify(results)}`,
      );

      let total = 0;
      if (results && results.length > 0) {
        results.forEach((record, indx) => {
          total += Number(record.rowTotal);
        });
      }
      const rangeList = getDateRange(type);
      let graphList = [];
      let loopKey, loopVal, loopObj;
      rangeList.forEach((dateVal) => {
        loopKey = getGraphLabel(dateVal, type);
        loopObj = results.filter(matchGraphDate(dateVal, type));
        loopVal = loopObj[0]?.rowTotal || 0;
        graphList.push({
          key: loopKey,
          value: Number(loopVal),
        });
      });
      this.customLogger.debug(
        `[getActiveRiders] stats > ${JSON.stringify(graphList)}`,
      );

      return ResponseData.success(HttpStatus.OK, { graphList, total });
    } catch (err) {
      this.customLogger.error('[getActiveRiders] error > ' + err.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getStatuswiseCount(params: StatsParams) {
    try {
      let { fromDate, toDate, entity } = params;
      const type: string = params.type || 'week';

      let startDate, endDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        if (entity === 'stats') {
          [startDate, endDate] = getDateBounds(type, 'blocks');
        } else {
          [startDate, endDate] = getDateBounds(type, 'recent');
        }
      }
      const fields = ['COUNT(trips.id) AS rowTotal', 'trips.status'];
      const tripQryInstance = this.tripsRepository.createQueryBuilder('trips');
      tripQryInstance.select(fields);
      tripQryInstance.where('trips.status IN (:...status)', {
        status: [
          TripStatus.CANCELLED_BY_DRIVER,
          TripStatus.CANCELLED_BY_RIDER,
          TripStatus.CANCELLED_BY_ADMIN,
          TripStatus.REJECTED_BY_DRIVER,
          TripStatus.ACCEPTED_BY_DRIVER,
          TripStatus.DRIVER_ARRIVED,
          TripStatus.STARTED,
          TripStatus.COMPLETED,
          TripStatus.COMPLETED,
          TripStatus.NO_DRIVER,
          TripStatus.EXPIRED,
        ],
      });
      tripQryInstance.andWhere(
        "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') >= :startDate",
        { startDate },
      );
      tripQryInstance.andWhere(
        "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') <= :endDate",
        { endDate },
      );
      tripQryInstance.groupBy('trips.status');
      let results = await tripQryInstance.getRawMany();

      const totalStats = {};
      const statusMapper = {};
      statusMapper[TripStatus.CANCELLED_BY_DRIVER] = 'cancelled';
      statusMapper[TripStatus.CANCELLED_BY_RIDER] = 'cancelled';
      statusMapper[TripStatus.CANCELLED_BY_ADMIN] = 'cancelled';
      statusMapper[TripStatus.ACCEPTED_BY_DRIVER] = 'completed';
      statusMapper[TripStatus.DRIVER_ARRIVED] = 'completed';
      statusMapper[TripStatus.STARTED] = 'completed';
      statusMapper[TripStatus.COMPLETED] = 'completed';
      statusMapper[TripStatus.REJECTED_BY_DRIVER] = 'unmatched';
      statusMapper[TripStatus.NO_DRIVER] = 'unmatched';
      statusMapper[TripStatus.EXPIRED] = 'unmatched';
      if (results?.length) {
        results.forEach((record) => {
          totalStats[statusMapper[record.trips_status]] =
            (totalStats[statusMapper[record.trips_status]] || 0) +
            Number(record.rowTotal);
        });
      }
      Object.values(statusMapper).forEach((statusType: string) => {
        if (!totalStats[statusType]) {
          totalStats[statusType] = 0;
        }
      });
      const declineCount = await this.tripDriversService.getDelinedCount(
        startDate,
        endDate,
      );
      totalStats['declined'] = Number(declineCount || 0);

      return ResponseData.success(HttpStatus.OK, {
        statusCounts: totalStats,
        dateRange: { startDate, endDate },
      });
    } catch (err) {
      this.customLogger.error('[getStatuswiseCount] error > ' + err.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCancelSummary(params: StatsParams) {
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
        'trips.driverId',
        'COUNT(trips.id) AS tripTotal',
        '(COUNT(IF(trips.status IN (' +
          TripStatus.CANCELLED_BY_DRIVER +
          ',' +
          TripStatus.CANCELLED_BY_RIDER +
          '), trips.id, NULL)) / COUNT(trips.id)) AS rowTotal',
        'ANY_VALUE(driver.userId) AS driverUserId',
        'ANY_VALUE(driver.profileImage) AS driverProfileImage',
        'ANY_VALUE(CONCAT_WS(" ",driver.firstName,driver.lastName)) AS driverName',
      ];
      const tripQryInstance = this.tripsRepository.createQueryBuilder('trips');
      tripQryInstance.select(fields);
      tripQryInstance.innerJoin('trips.driver', 'driver');
      tripQryInstance.where('trips.driverId IS NOT NULL');
      tripQryInstance.andWhere('trips.status IN (:...status)', {
        status: [
          TripStatus.CANCELLED_BY_DRIVER,
          TripStatus.CANCELLED_BY_RIDER,
          TripStatus.COMPLETED,
        ],
      });
      tripQryInstance.andWhere(
        "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') >= :startDate",
        { startDate },
      );
      tripQryInstance.andWhere(
        "DATE_FORMAT(trips.createdAt, '%Y-%m-%d') <= :endDate",
        { endDate },
      );
      if (params.cancelAction === 'after') {
        tripQryInstance.andWhere('trips.tripStartedAt IS NOT NULL');
      } else if (params.cancelAction === 'before') {
        tripQryInstance.andWhere('trips.tripStartedAt IS NULL');
      }
      tripQryInstance.groupBy('trips.driverId');
      tripQryInstance.orderBy({
        rowTotal: 'DESC',
        tripTotal: 'DESC',
      }); // TODO: Sorting priorities pending (lowerRating, lastCancelled)
      tripQryInstance.take(10);
      let results = await tripQryInstance.getRawMany();
      this.customLogger.debug(
        `[getCancelSummary] results : ${JSON.stringify(results)}`,
      );

      let driverReviewList = [];
      if (results?.length) {
        const externalIds = results
          .map((data) => data?.driverUserId)
          .filter((el) => {
            return el !== null;
          });
        if (externalIds && externalIds.length > 0) {
          this.customLogger.debug(
            '[getCancelSummary] fetching GET_META_REVIEWS for all drivers',
          );
          const { data: reviewData } = await this.clientReviewTCP
            .send(
              GET_META_REVIEWS,
              JSON.stringify({
                externalIds: externalIds,
                externalType: ReviewExternalType.Captain,
              }),
            )
            .pipe()
            .toPromise();
          // const { data: reviewData } = await this.reviewService.getMetaReviews({ externalIds: externalIds, externalType: ReviewExternalType.Captain })
          this.customLogger.debug(
            '[getCancelSummary] fetching GET_META_REVIEWS completed',
          );
          if (reviewData && reviewData.length > 0) {
            driverReviewList = reviewData;
          }
        }
      }

      const summary = results.map((record, index) => {
        let overallRating = 0;
        const ratingInfo = driverReviewList.filter(
          (rec) => rec.externalId == record.driverUserId,
        );
        if (ratingInfo && ratingInfo.length > 0) {
          overallRating = ratingInfo[0]['rating'];
        }
        return {
          driver_id: record.driverUserId ?? '',
          driver_name: record.driverName ?? '',
          driver_image: record.driverProfileImage ?? '',
          driver_rating: overallRating,
          cancel_rate: getPercentageFormatted(
            Math.round(record.rowTotal * 100),
          ),
        };
      });
      this.customLogger.debug(
        `[getCancelSummary] got results of ${JSON.stringify(summary)}`,
      );
      return ResponseData.success(HttpStatus.OK, summary);
    } catch (err) {
      this.customLogger.error('[getCancelSummary] error > ' + err.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // Block(Hold) trip amount
  async holdTripPayment(paymentParams: HoldParams) {
    this.customLogger.log(
      `[holdTripPayment] | Block(Hold) payment to e-wallet`,
    );

    this.customLogger.debug(
      JSON.stringify(paymentParams),
      '====== paymentParams input =====',
    );
    const paymentResponse = await this.clientPaymentTCP
      .send(BLOCK_TRIP_AMOUNT, JSON.stringify({ data: paymentParams }))
      .pipe()
      .toPromise();
    this.customLogger.debug(
      JSON.stringify(paymentResponse),
      '====== paymentParams response =====',
    );

    if (!paymentResponse || paymentResponse.statusCode !== HttpStatus.OK) {
      this.customLogger.error(
        `[holdTripPayment] Error | Block(Hold) payment to e-wallet | response : ${JSON.stringify(
          paymentResponse,
        )}`,
      );

      if (this.ewalletStatusCheck) {
        if (paymentResponse?.message) {
          throw new Error(paymentResponse?.message);
        } else {
          throw new Error(errorMessage.TRIP.RIDER_HAS_INSUFFICIENT_BALANCE);
        }
      }
    }

    this.customLogger.log(
      `[holdTripPayment] Success ✔ | Block(Hold) payment to e-wallet`,
    );
    return paymentResponse;
  }

  // Update Block(Hold) trip amount
  async updateTripPayment(updatePaymentParams: HoldUpdateParams) {
    this.customLogger.log(
      `[updateTripPayment] | Recalculate amount and update to e-wallet | amt: ${updatePaymentParams.amount} | tax: ${updatePaymentParams.senderTax}`,
    );
    updatePaymentParams.details = `Updating amounts for trip ${updatePaymentParams.tripId}`;

    this.customLogger.debug(
      JSON.stringify(updatePaymentParams),
      '====== update payment input =====',
    );
    const updatePaymentResponse = await this.clientPaymentTCP
      .send(UPDATE_TRIP_AMOUNT, JSON.stringify({ data: updatePaymentParams }))
      .pipe()
      .toPromise();
    this.customLogger.debug(
      JSON.stringify(updatePaymentResponse),
      '====== update payment response =====',
    );

    if (
      !updatePaymentResponse ||
      updatePaymentResponse.statusCode !== HttpStatus.OK
    ) {
      this.customLogger.error(
        `[updateTripPayment] | Recalculate amount and update to e-wallet Error | response: ${JSON.stringify(
          updatePaymentResponse,
        )}`,
      );

      if (this.ewalletStatusCheck) {
        if (updatePaymentResponse?.message) {
          throw new Error(updatePaymentResponse?.message);
        } else {
          throw new Error(errorMessage.TRIP.RIDER_HAS_INSUFFICIENT_BALANCE);
        }
      }
    }

    this.customLogger.log(
      `[updateTripPayment] | Recalculate amount and update to e-wallet Success ✔`,
    );
    return;
  }

  // Release trip amount
  async releaseTripPayment(tripId: string) {
    this.customLogger.log(
      `[releaseTripPayment] | Release payment from e-wallet`,
    );

    const paymentParams: HoldConfirmParams = {
      tripId: tripId,
    };

    this.customLogger.debug(
      JSON.stringify(paymentParams),
      '====== release payment input =====',
    );
    const paymentResponse = await this.clientPaymentTCP
      .send(RELEASE_TRIP_AMOUNT, JSON.stringify({ data: paymentParams }))
      .pipe()
      .toPromise();
    this.customLogger.debug(
      JSON.stringify(paymentResponse),
      '====== release payment response =====',
    );

    if (!paymentResponse || paymentResponse.statusCode !== HttpStatus.OK) {
      this.customLogger.error(
        `[releaseTripPayment] | Release payment from e-wallet Error | response: ${JSON.stringify(
          paymentResponse,
        )}`,
      );

      if (this.ewalletStatusCheck) {
        if (paymentResponse?.message) {
          throw new Error(paymentResponse.message);
        } else {
          throw new Error(errorMessage.TRIP.TRANSACTION_ROLLBACK);
        }
      }
    }

    this.customLogger.log(
      `[releaseTripPayment] | Release payment from e-wallet Success ✔`,
    );
    return;
  }

  // Confirm trip amount
  async confirmTripPayment(tripId: string, promoCodeAmount?: number, transferFee?: number) {
    this.customLogger.log(`[confirmTripPayment] | Confirm payment to e-wallet`);
    this.customLogger.debug(`[confirmTripPayment] | promoCodeAmount: ${promoCodeAmount}`);   
    const confirmPaymentParams: HoldConfirmParams = {
      tripId: tripId,
      discount: promoCodeAmount > 0 ? promoCodeAmount : 0,
    };
    this.customLogger.debug(
      JSON.stringify(confirmPaymentParams),
      '====== confirm payment input =====',
    );
    const confirmPaymentResponse = await this.clientPaymentTCP
      .send(
        CONFIRM_TRIP_AMOUNT,
        JSON.stringify({
          data: {
            transferFee: transferFee || (await this.ibanTransferFee()), //await this.getInstantTransferFee(),
            ...confirmPaymentParams,
          },
        }),
      )
      .pipe()
      .toPromise();
    this.customLogger.debug(
      JSON.stringify(confirmPaymentResponse),
      '====== confirm payment response =====',
    );

    if (
      !confirmPaymentResponse ||
      confirmPaymentResponse.statusCode !== HttpStatus.OK
    ) {
      this.customLogger.error(
        `[confirmTripPayment] | Confirm payment to e-wallet Error | response: ${JSON.stringify(
          confirmPaymentResponse,
        )}`,
      );

      if (this.ewalletStatusCheck) {
        if (confirmPaymentResponse?.message) {
          throw new Error(confirmPaymentResponse.message);
        } else {
          throw new Error(errorMessage.TRIP.TRANSACTION_CONFIRM);
        }
      }

      return false;
    }

    this.customLogger.log(
      `[confirmTripPayment] | Confirm payment to e-wallet Success ✔`,
    );
    return true;
  }

  async getTripImagesUrlFromAWS(trips: TripsEntity[], returnCount?: number) {
    this.customLogger.log(
      '[getTripImagesUrlFromAWS] Fetching Trip images from AWS',
    );

    if (trips && trips.length) {
      for (const trip of trips) {
        if (trip?.images?.length) {
          if (returnCount > 0) {
            trip.images.splice(returnCount);
          }
          const images = trip.images.map((image) =>
            this.awsS3Service.getTripFiles({ name: image.image, id: trip.id }),
          );

          const imageUrls = await Promise.all(images).then((values) =>
            values.map((value, index) => ({
              url: value,
              imageType: trip.images[index].type,
              imageBy: trip.images[index].imageBy,
            })),
          );

          trip['images'] = (imageUrls as unknown) as TripImagesEntity[];
        }
      }
    }

    this.customLogger.log(
      '[getTripImagesUrlFromAWS] Fetching Trip images from AWS Success ✔',
    );

    return trips;
  }

  getTripDriverFullName(trips: TripsEntity[]) {
    for (const trip of trips) {
      if (trip.driverId && trip.driver) {
        trip['driver'][
          'name'
        ] = `${trip.driver.firstName} ${trip.driver.lastName}`;
        trip['driver']['arabicName'] = trip.driver.arabicFirstName
          ? `${trip.driver.arabicFirstName} ${trip.driver.arabicLastName}`
          : '';
      }
    }

    return trips;
  }

  getTripRiderFullName(trips: TripsEntity[]) {
    for (const trip of trips) {
      if (trip.riderId && trip.rider) {
        trip['rider'][
          'name'
        ] = `${trip.rider.firstName} ${trip.rider.lastName}`;
        trip['rider']['arabicName'] = trip.rider.arabicFirstName
          ? `${trip.rider.arabicFirstName} ${trip.rider.arabicLastName}`
          : '';
      }
    }

    return trips;
  }

  async getTripCabTypes(trips: TripsEntity[]) {
    this.customLogger.log(
      '[getTripImagesUrlFromAWS] Fetching cab details with images from AWS',
    );

    if (trips && trips.length) {
      for (const trip of trips) {
        trip['cab'] = {};

        if (trip.cabId) {
          const cabRedis = await this.redisHandler.getRedisKey(
            `cab-type-${trip.cabId}`,
          );

          let cab;

          if (!cabRedis) {
            this.customLogger.debug(
              '[getTripCabTypes] get cab detail > kafka::' + trip.cabId,
            );
            cab = { statusCode: HttpStatus.OK, data: {} };
          } else {
            this.customLogger.debug(
              '[getTripCabTypes] get cab detail > redis::' + trip.cabId,
            );
            cab = { statusCode: HttpStatus.OK, data: JSON.parse(cabRedis) };
          }

          let imageUrl: string;
          if (cab?.data?.categoryIcon) {
            imageUrl = await this.awsS3Service.getCabTypeFile({
              name: cab.data.categoryIcon,
            });
          }

          // trip['costPerKm'] = cab?.data?.passengerCostPerKm;

          trip['cab'] = {
            costPerKm: cab?.data?.passengerCostPerKm,
            name: cab?.data?.name,
            nameArabic: cab?.data?.nameArabic,
            imageUrl,
            waitChargePerMin: await this.getWaitingChargePerMinute(
              trip.cabId,
              cab?.data?.waitChargePerMin,
            ),
          };
        }
      }
    }

    this.customLogger.log(
      '[getTripImagesUrlFromAWS] Fetching cab details with images from AWS Success ✔',
    );

    return trips;
  }

  async getTripEstimatedCostForAdmin(params: TripEstimatedCostForAdmin) {
    try {
      const { distance: tripDistance, time } = await calculateFareDistance(
        {
          latitude: params['addresses'][0].latitude,
          longitude: params['addresses'][0].longitude,
        },
        {
          latitude: params['addresses'][1].latitude,
          longitude: params['addresses'][1].longitude,
        },
      );

      //TODO: Promocode
      let couponAmount = 0;
      if (params?.promoCode) {
        couponAmount = 0;
      }
      const { country = '', city = '' } = params;
      const TRIP_TAX_PERCENTAGE = await this.getTripTaxPercentage();
      const tripBaseAmount = await this.estimateFareAmount(params.cabId, {
        distance: tripDistance,
        time,
        country,
        city,
      });
      const serviceTax = TRIP_TAX_PERCENTAGE;
      const serviceTaxAmount =
        (Number(tripBaseAmount) * parseInt(TRIP_TAX_PERCENTAGE)) / 100;
      const finalTotal = tripBaseAmount + serviceTaxAmount - couponAmount;
      return ResponseData.success(HttpStatus.OK, {
        tripBaseAmount,
        tripDistance,
        time,
        couponAmount,
        serviceTax,
        serviceTaxAmount,
        finalTotal,
      });
    } catch (err) {
      this.customLogger.error(
        '[getTripEstimatedCostForDispatcherAdmin] error > ' + err.message,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getTripTaxPercentage() {
    return (
      (await this.redisHandler.getRedisKey('SETTING_TRIP_TAX_PERCENTAGE')) || 15
    );
  }
  async ibanTransferFee() {
    return (
      Number(await this.redisHandler.getRedisKey('IBAN_TRANSFER_FEE')) || 0.3
    );
  }
  async getTripWaslFee() {
    return (
      Number(await this.redisHandler.getRedisKey('SETTING_TRIP_WASL_FEE')) ||
      0.2
    );
  }
  async getTripProcessingFee() {
    return (
      Number(
        await this.redisHandler.getRedisKey('SETTING_TRIP_PROCESSING_FEE'),
      ) || 0
    );
  }

  async getTripBankFeePercentage() {
    return (
      Number(await this.redisHandler.getRedisKey('TRIP_BANK_FEE_PERCENTAGE')) ||
      2.5
    );
  }

  async getTripFeeSum() {
    return 0;
    // return getAmountFormatted(
    //   Number(await this.getTripWaslFee()) +
    //     Number(await this.getTripProcessingFee()),
    // );
  }

  async getTripLocations(tripId: string, userType?: string) {
    let tripLocations;
    try {
      let locKey = `tripLoc-${tripId}-driver`;
      if (userType === 'rider') {
        locKey = `tripLoc-${tripId}-rider`;
      }
      tripLocations = (await this.redisHandler.lrange(locKey, 0, -1)) || [];
      if (tripLocations) {
        tripLocations = tripLocations.map((loc) => JSON.parse(loc));
      }
      this.customLogger.log(
        `[getTripLocations] List found ${locKey} > ${tripLocations.length}`,
      );
    } catch (err) {
      this.customLogger.error(
        `[getTripLocations] error > ${JSON.stringify(err)}`,
      );
    }
    return tripLocations;
  }

  async updateTripLocations(tripId: string) {
    try {
      if (!tripId) {
        throw new Error(`Invalid tripId`);
      }
      let saveLocations;
      // Fetch driver locations from redis and insert in DB
      let driverLocations = await this.getTripLocations(tripId, 'driver');
      driverLocations = driverLocations.map((location) => {
        return { ...location, userType: TripUserType.DRIVER, trip: tripId };
      });
      saveLocations = this.tripLocationRepository.create(driverLocations);
      this.tripLocationRepository.save(saveLocations);
      this.customLogger.log(
        `[updateTripLocations] Driver locations moved to Database`,
      );

      // Fetch rider locations from redis and insert in DB
      let riderLocations = await this.getTripLocations(tripId, 'rider');
      riderLocations = riderLocations.map((location) => {
        return { ...location, userType: TripUserType.RIDER, trip: tripId };
      });
      saveLocations = this.tripLocationRepository.create(riderLocations);
      this.tripLocationRepository.save(saveLocations);
      this.customLogger.log(
        `[updateTripLocations] Rider locations moved to Database`,
      );

      // Remove location data from redis of given trip
      const delList = [`tripLoc-${tripId}-driver`, `tripLoc-${tripId}-rider`];
      this.redisHandler.client.del(delList, function (err) {
        Logger.debug(
          `[updateTripLocations] Clearing redis keys ${JSON.stringify(
            delList,
          )} | error > ${JSON.stringify(err)}`,
        );
      });
    } catch (err) {
      this.customLogger.error(
        `[updateTripLocations] Error in catch > ${JSON.stringify(err)}`,
      );
    }
    return;
  }

  async getDriversCaptainID(driverId: string) {
    // const captainInfo = JSON.parse(await this.redisHandler.getRedisKey(`driverUser-${driverId}`));
    // let captainId = captainInfo?.captainId
    // if (!captainId) {
    const customerDetail = await this.customerRepository.findOne({
      where: { userId: Number(driverId) },
      select: ['driverId'],
    });
    const captainId = customerDetail?.driverId;
    // }
    this.customLogger.log(
      `[getDriversCaptainID] driverId : ${driverId} | captainId : ${captainId}`,
    );
    return captainId;
  }

  async emitToAdminDashboardViaSocket(eventType: string, data: any) {
    const emitData = {
      eventType,
      ...data,
    };

    this.customLogger.log(
      `[emitToAdminDashboardViaSocket] emitData: ${JSON.stringify(emitData)}`,
    );

    this.socketGateway.emit(EMIT_TO_ADMIN_DASHBOARD, JSON.stringify(emitData));
  }

  async getTripAndStatusStats() {
    const tripStats = await this.getTripStats({ type: 'day' });

    const statusStats = await this.getStatuswiseCount({ type: 'day' });

    let tripStatsResponse = {
      data: {},
    };

    if (tripStats.statusCode === HttpStatus.OK) {
      tripStatsResponse.data = { ...tripStatsResponse.data, ...tripStats.data };
    }

    if (statusStats.statusCode === HttpStatus.OK) {
      tripStatsResponse.data = {
        ...tripStatsResponse.data,
        ...statusStats.data,
      };
    }

    return tripStatsResponse;
  }

  // Updates admin dashboard stats as new trip created
  async notifyAdminDashboardAsNewTripCreated() {
    try {
      this.customLogger.log('[notifyAdminDashboardAsNewTripCreated] Inside');

      const tripStatsResponse = await this.getTripAndStatusStats();

      await this.emitToAdminDashboardViaSocket(NEW_TRIP_CREATED, {
        tripStats: tripStatsResponse?.data || {},
      });

      const topStatsRes = await this.getDashboardStats({ type: 'day' });

      await this.emitToAdminDashboardViaSocket(NEW_TRIP_CREATED, {
        topStats: topStatsRes?.data || {},
      });
    } catch (e) {
      this.customLogger.error(
        `[notifyAdminDashboardAsNewTripCreated] error > ${JSON.stringify(
          e.message,
        )}`,
      );
    }
  }

  // Updates admin dashboard stats as trip status changed
  async notifyAdminDashboardAsTripStatusChanged(tripStatus?: TripStatus) {
    try {
      this.customLogger.log('[notifyAdminDashboardAsTripStatusChanged] Inside');

      const tripStatsResponse = await this.getTripAndStatusStats();

      await this.emitToAdminDashboardViaSocket(TRIP_STATUS_CHANGED, {
        tripStats: tripStatsResponse?.data || {},
      });

      const topStatsRes = await this.getDashboardStats({ type: 'day' });

      await this.emitToAdminDashboardViaSocket(TRIP_STATUS_CHANGED, {
        topStats: topStatsRes?.data || {},
      });

      if (
        tripStatus &&
        [
          TripStatus.CANCELLED_BY_DRIVER,
          TripStatus.CANCELLED_BY_RIDER,
          TripStatus.COMPLETED,
        ].includes(tripStatus)
      ) {
        const cancelSummaryRes = await this.getCancelSummary({
          type: 'day',
          ...{ cancelAction: 'both' },
        });

        await this.emitToAdminDashboardViaSocket(TRIP_STATUS_CHANGED, {
          cancelSummary: cancelSummaryRes?.data || [],
        });
      }
    } catch (e) {
      this.customLogger.error(
        `[notifyAdminDashboardAsTripStatusChanged] error > ${JSON.stringify(
          e.message,
        )}`,
      );
    }
  }

  async getEstimatedCost({ scanObject: param }: any) {
    try {
      this.customLogger.log(
        '[getEstimatedCost] Inside',
        'param =>' + JSON.stringify(param),
      );

      const trip = await this.getTripById(param.tripId, {
        select: [
          'id',
          'tripStartedAt',
          'estimatedTripTime',
          'cabId',
          'tripDistance',
          'baseFare',
          'costPerKm',
          'costPerMin',
          'fareMultiplier',
          'taxPercentage',
        ],
      });

      this.customLogger.log('[getEstimatedCost]', 'trip =>' + trip.id);
      this.customLogger.log(
        '[getEstimatedCost]',
        'tripStartedAt =>' + trip.tripStartedAt,
      );
      this.customLogger.log(
        '[getEstimatedCost]',
        'endDate =>' + new Date(getTimestamp()),
      );

      const time_travelled = trip.tripStartedAt
        ? getCalculatedTripTime(trip.tripStartedAt, new Date(getTimestamp()))
        : trip.estimatedTripTime;
      this.customLogger.log(
        '[getEstimatedCost]',
        'time_travelled =>' + time_travelled,
      );

      const tripBaseAmount = await this.estimateFareAmount(trip.cabId, {
        distance: trip.tripDistance,
        time: time_travelled,
        baseFare: trip.baseFare,
        costPerKm: trip.costPerKm,
        costPerMin: trip.costPerMin,
        fareMultiplier: trip.fareMultiplier,
      });
      this.customLogger.log(
        '[getEstimatedCost]',
        'tripBaseAmount OR driverAmount =>' + tripBaseAmount,
      );

      const taxAmount = await this.calculateTaxAmount(
        tripBaseAmount,
        trip.taxPercentage,
      );
      this.customLogger.log('[getEstimatedCost]', 'taxAmount =>' + taxAmount);

      const riderAmount = await this.calculateFareAmountWithTax(trip.id, {
        tripBaseAmount,
        taxAmount,
      });
      this.customLogger.log(
        '[getEstimatedCost]',
        'riderAmount =>' + riderAmount,
      );

      return ResponseData.success(HttpStatus.OK, {
        estimatedTripTime: time_travelled,
        // estimatedBaseAmount: tripBaseAmount,
        driverAmount: tripBaseAmount,
        riderAmount,
      });
    } catch (err) {
      this.customLogger.error('[getEstimatedCost] error > ' + err.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async getLastSeenAndLoc(userId: string) {
    try {
      //Get data from redis
      const chatUserKey = `chat-user-${userId}`;
      let userData = await this.redisHandler.getRedisKey(chatUserKey);
      let onlineStatus = false;
      if (userData) {
        userData = JSON.parse(userData);
        if (userData['isOnline']) {
          onlineStatus = userData['isOnline'];
        }
      }
      const userLoc = await this.customerService.getUserLocFromDB(userId);
      return ResponseData.success(HttpStatus.OK, { onlineStatus, userLoc });
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
}

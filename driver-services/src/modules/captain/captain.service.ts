import {
  Injectable,
  Logger,
  HttpStatus,
  HttpException,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Raw, getManager } from 'typeorm';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import { RedisClient } from 'redis';

import { CabTypeEntity } from '../cab-type/entities/cab-type.entity';
import { CaptainEntity } from './captain.entity';
import {
  CaptainLocationInfo,
  FindCaptainListParams,
  FindingDataInterface,
  LocationInterface,
  RedisUserInterface,
  ListSearchSortDto,
  SubscriptionParams,
  VerifySubscriptionParams,
  FindCaptainsByAdminParams,
  PushNotificationReqDto,
  purchaseSubscriptionDto,
  addUserSubscriptionDto,
  TRANSACTION_SOURCE,
  applicableFor,
} from './interface/captain.interface';

import { successMessage } from '../../constants/success-message-constant';
import { errorMessage } from '../../constants/error-message-constant';
import { WASLService } from 'src/modules/wasl/wasl.service';
import {
  getTimestamp,
  getIsoDateTime,
  getIsoDate,
  addMonths,
  addDays,
  getDays,
} from 'src/utils/get-timestamp';
import { getStringValueFromJSON } from 'src/utils/format-json';

import {
  updateSubscriptionPackageDto,
  UserSubscriptionDto,
} from './dto/user-subscription.dto';
import {
  USER_TYPE,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPE,
  DRIVER_SEARCH_LIMIT_FOR_ADMIN,
  WASL_ELIGIBILITY_STATUS,
} from './constants';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import {
  paymentRequestPattern,
  GET_SUBSCRIPTION_DETAIL,
  CREATE_USER_SUBSCRIPTION,
  GET_META_REVIEW_BY_EXTERNAL,
  GET_RATING_COUNTS_BY_EXTERNAL,
  GET_META_REVIEWS,
  reviewPattern,
  UPDATE_CUSTOMER,
  customerPattern,
  GET_CUSTOMER_DETAIL,
  GET_SELECTED_CUSTOMERS,
  GET_ALL_USER_SUBSCRIPTIONS,
  GET_USER_SUBSCRIPTION_DETAIL,
  GET_SUBSCRIPTION_TRANSACTIONS,
  // DASHBOARD_ONRIDE_CAPTAINS,
  GET_USER_EARNINGS,
  CANCEL_USER_SUBSCRIPTION,
  ACTIVATE_USER_SUBSCRIPTION,
  CREATE_AUDIT_LOG,
  SEND_PUSH_NOTIFICATION,
  EMIT_TO_ADMIN_DASHBOARD,
  DASHBOARD_STATS,
  SEND_SMS_NOTIFICATION,
  ADD_SUBSCRIPTION_TRANSACTION,
  VALIDATE_IBAN,
  CREATE_IBAN,
  GET_IBAN,
  CLICK_PAY_HOSTED,
  GET_VEHICLE_MASTER_INFO,
} from 'src/constants/kafka-constant';
import {
  CAPTAIN_DRIVER_MODE_SWITCHED,
  CAPTAIN_RIDE_STATUS_SWITCHED,
  NEW_CAPTAIN_CREATED,
} from 'src/constants/socket-constant';
import { RegistrationInterface } from '../wasl/interface/wasl.request.interface';
import appConfig from 'config/appConfig';
import { createHash } from 'crypto';
import { promisify } from 'util';
import {
  CreateCaptainDto,
  CreateCaptainWASLDto,
} from './dto/create-captain.dto';
import { CaptainListSort, ReviewExternalType } from './captain.enum';
import { hijriDateConverter } from 'src/helpers/hijriDateConverter';
import { PaginationCommonDto } from './dto/pagination.dto';
import { SubscriptionEarningDto } from './dto/subscription-earning.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { calculateFareDistance } from 'src/helpers/googleDistanceCalculation';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';
import { CarInfoService } from '../car-info/car-info.service';
import { RedisHandler } from 'src/helpers/redis-handler';
import { notificationKafkaConfig } from 'src/microServicesConfigs/notification.microservice.config';
import { stringify } from 'querystring';

@Injectable()
export class CaptainService {
  private readonly logger = new LoggerHandler(
    CaptainService.name,
  ).getInstance();
  constructor(
    @InjectRepository(CaptainEntity)
    private captainRepository: Repository<CaptainEntity>,
    @InjectRepository(CabTypeEntity)
    private cabTypeRepository: Repository<CabTypeEntity>,
    private waslService: WASLService,
    private carInfoService: CarInfoService,
    private redisHandler: RedisHandler,
    @Inject('CLIENT_PAYMENT_SERVICE_KAFKA')
    private clientPaymentKafka: ClientKafka,
    @Inject('CLIENT_PAYMENT_SERVICE_TCP') private clientPaymentTCP: ClientProxy,
    @Inject('CLIENT_REVIEW_SERVICE_TCP') private clientReviewTCP: ClientProxy,
    @Inject('TRIP_KAFKA_CLIENT_SERVICE') private tripKafkaClient: ClientKafka,
    @Inject('TRIP_TCP_CLIENT_SERVICE') private tripTcpClient: ClientProxy,
    @Inject('CLIENT_AUDIT_SERVICE') private clientAudit: ClientKafka,
    @Inject('CLIENT_NOTIFY_SERVICE') private clientNotification: ClientKafka,
    @Inject('CLIENT_SOCKET_SERVICE_KAFKA') private socketGateway: ClientKafka,
    @Inject('CLIENT_PROMO_SERVICE_TCP')
    private promoCodesTcpClient: ClientProxy,

    @Inject('CLIENT_ADMIN_SERVICE_TCP') private clientAdminTCP: ClientProxy,
    private awsS3Service: AwsS3Service,
  ) {
    this.redisClient = new RedisClient({
      host: appConfig().RedisHost,
      port: appConfig().RedisPort,
    });
    this.getRedisKey = promisify(this.redisClient.get).bind(this.redisClient);
    // customerPattern.forEach(pattern => {
    //   this.tripKafkaClient.subscribeToResponseOf(pattern);
    // });
    // reviewPattern.forEach(pattern => {
    //   this.clientReviewKafka.subscribeToResponseOf(pattern);
    // });
  }

  // @Client(paymentKafkaConfig)
  // clientPaymentKafka: ClientKafka;

  // @Client(reviewsKafkaConfig)
  // clientReviewKafka: ClientKafka;

  // @Client({
  //   ...tripKafkaMicroServiceConfig,
  //   options: {
  //     ...tripKafkaMicroServiceConfig.options,
  //     consumer: {
  //       groupId: 'trip-consumer-cap',
  //     }
  //   }
  // })
  // clientTrip: ClientKafka;

  // @Client(auditLogMicroServiceConfig)
  // clientAudit: ClientKafka;

  // @Client(notificationKafkaConfig)
  // clientNotification: ClientKafka;

  redisClient: RedisClient;
  getRedisKey: Function;

  onModuleInit() {}

  // async  createrawuser(data:any) {
  //   try{
  //       this.logger.log(`createrawuser -> error -> ${JSON.stringify(data.value)}`);
  //       const externalid : string[] = [data.value.externalId];
  //       const findDriver = await this.getSelectedCaptains(externalid);
  //       // return findDriver;
  //       if(findDriver?.data?.[0])
  //         return ResponseData.error(HttpStatus.CONFLICT, "User already registered")

  //       const captain = this.captainRepository.create(data.value);
  //       const newdriver = await this.captainRepository.save(captain);
  //       const driverupdate = await this.captainRepository.createQueryBuilder().update('captain').set({ approved: true, acceptTC: true, driverModeSwitch: true }).where("externalId = :id", { id: data.value.externalId }).execute()
  //       return ResponseData.success({ newdriver });
  //   }
  //   catch(err){
  //     this.logger.error(`createrawuser -> error -> ${JSON.stringify(err.message)}`);
  //     return ResponseData.error(
  //       HttpStatus.BAD_REQUEST,
  //       err.message || errorMessage.SOMETHING_WENT_WRONG
  //     );
  //   }
  // }
  async findAll(params: ListSearchSortDto, conditions?: FindingDataInterface) {
    try {
      const {
        isFullDetail = false,
        isReviewDetail = false,
        isUserDetail = false,
        isSubscription = false,
      } = conditions || {};
      const fields = [
        'captain.id',
        'captain.externalId',
        'captain.driverName',
        'captain.driverNationalId',
        'captain.carPlateNo',
        'captain.carSequenceNo',
        'captain.carLicenceType',
        'captain.approved',
        'captain.driverModeSwitch',
        'captain.cabId',
        'captain.latitude',
        'captain.longitude',
        'captain.createdAt',
        'cab.name',
        'cab.noOfSeats',
        'captain.drivingModes',
      ];
      const driverQryInstance = this.captainRepository.createQueryBuilder(
        'captain',
      );
      driverQryInstance.select(fields);
      driverQryInstance.leftJoin('captain.cab', 'cab');
      //Admin Filters
      // if (params?.filters?.externalId) {
      //   driverQryInstance.andWhere('captain.externalId = :externalId', {
      //     externalId: params?.filters?.externalId,
      //   });
      // }
      if (params?.filters?.externalId) {
        driverQryInstance.andWhere('captain.externalId LIKE :externalId', {
          externalId: `${params?.filters?.externalId}%`,
        });
      }
      if (params?.filters?.driverName) {
        driverQryInstance.andWhere('captain.driverName LIKE :driverName', {
          driverName: `${params?.filters?.driverName}%`,
        });
      }
      if (params?.filters?.carPlateNo) {
        driverQryInstance.andWhere('captain.carPlateNo LIKE :carPlateNo', {
          carPlateNo: `${params?.filters?.carPlateNo}%`,
        });
      }
      if (params?.filters?.carSequenceNo) {
        driverQryInstance.andWhere(
          'captain.carSequenceNo LIKE :carSequenceNo',
          { carSequenceNo: `${params?.filters?.carSequenceNo}%` },
        );
      }
      if (params?.filters?.carLicenceType) {
        driverQryInstance.andWhere('captain.carLicenceType = :carLicenceType', {
          carLicenceType: params?.filters?.carLicenceType,
        });
      }
      if (params?.filters && 'approved' in params.filters) {
        driverQryInstance.andWhere('captain.approved = :approved', {
          approved: params?.filters?.approved,
        });
      }
      if (params?.filters && 'driverModeSwitch' in params?.filters) {
        driverQryInstance.andWhere(
          'captain.driverModeSwitch = :driverModeSwitch',
          { driverModeSwitch: params?.filters?.driverModeSwitch },
        );
      }
      if (params?.filters?.cabName) {
        driverQryInstance.andWhere('cab.name LIKE :cabName', {
          cabName: `${params?.filters?.cabName}%`,
        });
      }
      if (params?.filters?.drivingMode) {
        driverQryInstance.andWhere(
          'FIND_IN_SET(:drivingMode, captain.drivingModes)',
          { drivingMode: params?.filters?.drivingMode },
        );
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        driverQryInstance.andWhere('captain.createdAt >= :fromDate', {
          fromDate,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setHours(23, 59, 59, 999),
          ),
        );
        driverQryInstance.andWhere('captain.createdAt <= :toDate', { toDate });
      }
      // TODO: MobileNo Filter
      // TODO: Rating Filter
      // TODO: Subscription Status
      // TODO: Total Trips Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = CaptainListSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          driverQryInstance.orderBy(sortField, sortOrder);
        }
      }
      driverQryInstance.skip(params.skip);
      driverQryInstance.take(params.take);
      const [result, total] = await driverQryInstance.getManyAndCount();

      const totalCount: number = total;
      const captains: any = result;
      if (captains?.length) {
        captains.forEach((captainRow, captainIndex) => {
          captains[captainIndex].drivingModes = captainRow.drivingModes.map(
            (driveMode) => {
              return { drivingMode: Number(driveMode) };
            },
          );
        });
      }

      let captainUserList = [];
      if (isUserDetail) {
        const externalIds = captains.map((data) => Number(data?.externalId));
        if (externalIds && externalIds.length > 0) {
          const { data: usersData } = await this.tripTcpClient
            .send(
              GET_SELECTED_CUSTOMERS,
              JSON.stringify({ userIds: externalIds }),
            )
            .pipe()
            .toPromise();
          if (usersData && usersData.length > 0) {
            captainUserList = usersData;
          }
        }
      }
      let captainReviewList = [];
      if (isReviewDetail) {
        const externalIds = captains.map((data) => data?.externalId);
        if (externalIds && externalIds.length > 0) {
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
          if (reviewData && reviewData.length > 0) {
            captainReviewList = reviewData;
          }
        }
      }
      let captainSubscriptions = [];
      if (isSubscription) {
        const externalIds = captains.map((data) => data?.externalId);
        if (externalIds && externalIds.length > 0) {
          const { data: subscriptionData } = await this.clientPaymentTCP
            .send(
              GET_ALL_USER_SUBSCRIPTIONS,
              JSON.stringify({ userIds: externalIds, latest: true }),
            )
            .pipe()
            .toPromise();
          if (subscriptionData && subscriptionData.length > 0) {
            captainSubscriptions = subscriptionData;
          }
        }
      }

      captains.map((data) => {
        const userInfo = captainUserList.filter(
          (rec) => rec.userId === data.externalId,
        );
        if (userInfo && userInfo.length > 0) {
          data['profileImage'] = userInfo[0]['profileImage'];
          data['dateOfBirth'] = userInfo[0]['dateOfBirth'];
          data['mobileNo'] = userInfo[0]['mobileNo'];
          data['totalRides'] = userInfo[0]['totalRides'];
          data['totalTrips'] = userInfo[0]['totalTrips'];
        } else {
          data['profileImage'] = '';
          data['dateOfBirth'] = '';
          data['mobileNo'] = '';
          data['totalRides'] = 0;
          data['totalTrips'] = 0;
        }

        const reviewInfo = captainReviewList.filter(
          (rec) => rec.externalId === data.externalId,
        );
        if (reviewInfo && reviewInfo.length > 0) {
          data['overallRating'] = reviewInfo[0]['rating'];
          data['overallReviews'] = reviewInfo[0]['reviewCount'];
        } else {
          data['overallRating'] = 0;
          data['overallReviews'] = 0;
        }

        const subscriptionInfo = captainSubscriptions.filter(
          (rec) => rec.userId === data.externalId,
        );
        if (subscriptionInfo && subscriptionInfo.length > 0) {
          data['subscription'] = {};
          data['subscription']['status'] = subscriptionInfo[0]['status'];
          data['subscription']['remainingDays'] = getDays(
            new Date(subscriptionInfo[0]['dueDate']),
            new Date(),
          );
        } else {
          data['subscription'] = {};
        }
      });

      return ResponseData.success({ captains, totalCount });
    } catch (err) {
      this.logger.error(`findAll -> error -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findOne(id: string, conditions?: FindingDataInterface) {
    try {
      const {
        isFullDetail = false,
        isUserDetail = false,
        isReviewDetail = false,
        isRatingDetail = false,
        isSubscription = false,
        transCheck = false,
      } = conditions || {};
      this.logger.log(
        `findOne -> captain conditions: ${JSON.stringify(conditions)}`,
      );

      if (transCheck) {
        await this.verifyCaptain(id);
      }
      this.logger.log(
        `findOne -> captain transCheck: ${JSON.stringify(transCheck)}`,
      );

      let captain;
      const fields = [
        'captain.id',
        'captain.driverName',
        'captain.externalId',
        'captain.driverNationalId',
        'captain.carPlateNo',
        'captain.carSequenceNo',
        'captain.carLicenceType',
        'captain.acceptTC',
        'captain.driverModeSwitch',
        'captain.driverRideStatus',
        'captain.latitude',
        'captain.longitude',
        'captain.driverSubAmount',
        'captain.driverSubStatus',
        'captain.blockedReason',
        'captain.blockedDate',
        'captain.approved',
        'captain.createdAt',
        'captain.updatedAt',
        'captain.driverSubscriptionId',
        'captain.drivingModes',
        'captain.eligibilityExpiryDate',
        'captain.isWASLApproved',
        'captain.WASLRejectionReasons',
        'captain.iban',
        'cab.id',
        'cab.name',
        'cab.nameArabic',
        'cab.description',
        'cab.descriptionArabic',
        'cab.noOfSeats',
        'cab.passengerEstimatedTimeArrival',
        'cab.passengerEstimatedTimeArrival',
        'cab.passengerBaseFare',
        'cab.passengerBaseDistance',
        'cab.passengerBaseTime',
        'cab.categoryIcon',
        'cab.passengerCostPerMin',
        'cab.passengerCostPerKm',
        'cab.passengerCancellationCharge',
        'cab.status',
        'car.id',
        'car.chassisNumber',
        'car.cylinders',
        'car.licenseExpiryDateEnglish',
        'car.lkVehicleClass',
        'car.bodyType',
        'car.bodyTypeEnglish',
        'car.majorColor',
        'car.majorColorEnglish',
        'car.modelYear',
        'car.ownerName',
        'car.ownerNameEnglish',
        'car.plateNumber',
        'car.plateText1',
        'car.plateText1English',
        'car.plateText2',
        'car.plateText2English',
        'car.plateText3',
        'car.plateText3English',
        'car.plateTypeCode',
        'car.regplace',
        'car.regplaceEnglish',
        'car.vehicleCapacity',
        'car.vehicleMaker',
        'car.vehicleMakerEnglish',
        'car.vehicleModel',
        'car.vehicleModelEnglish',
        'car.createdBy',
        'car.modifiedBy',
      ];
      if (isFullDetail) {
        captain = await this.captainRepository
          .createQueryBuilder('captain')
          .select(fields)
          .leftJoin('captain.car', 'car')
          .leftJoin('captain.cab', 'cab')
          .where('captain.id = :id', { id })
          .getOne();
      } else {
        captain = await this.captainRepository.findOne(id);
      }
      if (!captain) {
        this.logger.warn(`findOne -> captain retry with externalId: ${id}`);
        if (isFullDetail) {
          captain = await this.captainRepository
            .createQueryBuilder('captain')
            .select(fields)
            .leftJoin('captain.car', 'car')
            .leftJoin('captain.cab', 'cab')
            .where('captain.externalId = :externalId', { externalId: id })
            .getOne();
        } else {
          captain = await this.captainRepository.findOne({
            externalId: id,
          });
        }
      }
      if (!captain) {
        this.logger.error(`findOne -> captain not found. id: ${id}`);
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.DRIVER_NOT_FOUND,
        );
      }
      this.logger.log(`findOne -> captain details: ${JSON.stringify(captain)}`);

      const response = captain;
      if (response?.drivingModes) {
        response.drivingModes = response.drivingModes.map((driveMode) => {
          return { drivingMode: Number(driveMode) };
        });
      } else {
        response.drivingModes = [];
      }
      // Customer Details
      if (isUserDetail) {
        const customerDetail = await this.tripTcpClient
          .send(
            GET_CUSTOMER_DETAIL,
            JSON.stringify({
              userId: captain.externalId,
              data: { isReviewDetail: false },
            }),
          )
          .pipe()
          .toPromise();
        // console.log(customerDetail)
        response.profileImage = customerDetail?.data?.profileImage;
        response.dateOfBirth = customerDetail?.data?.dateOfBirth;
        response.mobileNo = customerDetail?.data?.mobileNo;
        response.emailId = customerDetail?.data?.emailId;
        response.address1 = customerDetail?.data?.address1;
        response.address2 = customerDetail?.data?.address2;
        response.totalRides = customerDetail?.data?.totalRides;
        response.totalTrips = customerDetail?.data?.totalTrips;
        response.tripsCancelled = customerDetail?.data?.tripsCancelled;
        response.tripsDeclined = customerDetail?.data?.tripsDeclined;
        response.arabicFullName = customerDetail?.data?.arabicFullName;
        response.additionalInfo = customerDetail?.data?.additionalInfo;

        response.otherDetails = customerDetail?.data?.otherDetails;

        response.totalEarned = customerDetail?.data?.totalEarned;
      }
      ///TEST COMMENT
      this.logger.log(
        `findOne -> captain isUserDetail: ${JSON.stringify(isUserDetail)}`,
      );

      // Review Details
      if (isReviewDetail) {
        const { data: captainReview } = await this.clientReviewTCP
          .send(
            GET_META_REVIEW_BY_EXTERNAL,
            JSON.stringify({
              externalId: captain.externalId,
              externalType: USER_TYPE.CAPTAIN,
            }),
          )
          .pipe()
          .toPromise();
        response.overallRating = captainReview?.overallRating || 0;
        response.overallReviews = captainReview?.overallReviews || 0;
      }
      this.logger.log(
        `findOne -> captain isReviewDetail: ${JSON.stringify(isReviewDetail)}`,
      );

      // Rating Details
      if (isRatingDetail) {
        const { data: recivedRatings } = await this.clientReviewTCP
          .send(
            GET_RATING_COUNTS_BY_EXTERNAL,
            JSON.stringify({
              externalId: captain.externalId,
              externalType: USER_TYPE.CUSTOMER,
            }),
          )
          .pipe()
          .toPromise();
        let captainRatings;
        if (recivedRatings && recivedRatings.length > 0) {
          captainRatings = {
            '1': Number(recivedRatings[0]?.star_1 || 0),
            '2': Number(recivedRatings[0]?.star_2 || 0),
            '3': Number(recivedRatings[0]?.star_3 || 0),
            '4': Number(recivedRatings[0]?.star_4 || 0),
            '5': Number(recivedRatings[0]?.star_5 || 0),
          };
        }
        response.ratingCounts = captainRatings || {};
      }
      this.logger.log(
        `findOne -> captain isRatingDetail: ${JSON.stringify(isRatingDetail)}`,
      );

      // Subscription Details
      if (isSubscription) {
        const isUserSubscription = await this.clientPaymentTCP
          .send(
            GET_USER_SUBSCRIPTION_DETAIL,
            JSON.stringify({ userId: captain.externalId }),
          )
          .pipe()
          .toPromise();
        if (
          isUserSubscription &&
          isUserSubscription.statusCode === HttpStatus.OK
        ) {
          const subscription = isUserSubscription.data;
          subscription['remainingDays'] = getDays(
            new Date(subscription['dueDafte']),
            new Date(),
          );
          response.subscription = subscription;
        }
      }
      this.logger.log(
        `findOne -> captain isSubscription: ${JSON.stringify(isSubscription)}`,
      );
      if (response?.car?.id) {
        const vehicleResponse = await this.clientAdminTCP
          .send(GET_VEHICLE_MASTER_INFO, JSON.stringify(response?.car))
          .pipe()
          .toPromise();
        this.logger.debug(
          `kafka::captain::${GET_VEHICLE_MASTER_INFO}::vehicleMasterInfoResponse -> ${JSON.stringify(
            vehicleResponse,
          )}`,
        );
        response.car.makerIcon = null;
        if (
          vehicleResponse.statusCode === HttpStatus.OK &&
          vehicleResponse?.data?.makerIcon
        ) {
          response.car.makerIcon = vehicleResponse?.data?.makerIcon;
        }
      } else {
        this.logger.warn(`findOne -> captain: car not found`);
      }
      this.logger.log(`findOne -> captain: Success`);
      return ResponseData.success(response);
    } catch (err) {
      this.logger.error(
        `findOne -> captain not found. id: ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAndNotifyDriversForWASLEligibilityOneByOne(){
    try{
    const driverList = await this.captainRepository.find({
        select: ['id', 'externalId', 'driverNationalId'],
        where: {
          isWASLApproved: WASL_ELIGIBILITY_STATUS.PENDING,
        },
      });
      this.logger.log(
        `[findAndNotifyDriversForWASLEligibilityOneByOne] drivers: ${driverList.length}`,
      );
      if (driverList?.length) {
        for (let drivers of driverList) {
          let rejectionReasons: string[] = [];
          let driverEligibility = WASL_ELIGIBILITY_STATUS.VALID
          const {data : waslEligibility} = await this.waslService.getDriversEligibility(
            drivers.driverNationalId)
          if(!waslEligibility)
            break;


          if(WASL_ELIGIBILITY_STATUS[String(waslEligibility?.driverEligibility)] == WASL_ELIGIBILITY_STATUS.INVALID ){
            if(Array.isArray(waslEligibility?.rejectionReasons))
             waslEligibility?.rejectionReasons.forEach((rejectionReason: any) => {
              rejectionReasons.push(rejectionReason);
             })
             driverEligibility =  WASL_ELIGIBILITY_STATUS.INVALID;
          }
          if (Array.isArray(waslEligibility?.vehicles)) {
              waslEligibility?.vehicles.forEach((vehicle: any) => {
                if (
                  WASL_ELIGIBILITY_STATUS[
                    String(vehicle?.vehicleEligibility)
                  ] === WASL_ELIGIBILITY_STATUS.INVALID
                ) {
                    driverEligibility =  WASL_ELIGIBILITY_STATUS.INVALID;
                }

                if (
                  vehicle?.rejectionReasons &&
                  !Array.isArray(vehicle?.rejectionReasons)
                )
                {
                  rejectionReasons.push(vehicle?.rejectionReasons)
                };
                if (
                  vehicle?.rejectionReasons &&
                  Array.isArray(vehicle?.rejectionReasons)
                ) {
                  vehicle?.rejectionReasons.forEach((element) => {
                    rejectionReasons.push(element);
                  });
                }
              });
            }

          rejectionReasons = rejectionReasons.filter(function (x, i, a) { 
            return a.indexOf(x) === i; 
          });
          
          await this.captainRepository.update(
                {
                  id: drivers.id,
                },
                {
                  isWASLApproved: driverEligibility,
                  WASLRejectionReasons: JSON.stringify(rejectionReasons),
                  eligibilityExpiryDate: waslEligibility?.eligibilityExpiryDate,
                },
              );
        }
        return ResponseData.success()
      }
      else {
        return ResponseData.error(HttpStatus.BAD_REQUEST, 'No pending driver found')
      }
    }catch(err){
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async getSelectedCaptains(externalIds: string[]) {
    try {
      if (!externalIds.length) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.DRIVER_NOT_FOUND,
        );
      }
      const fields = [
        'captain.id',
        'captain.driverName',
        'captain.externalId',
        'captain.approved',
        'captain.driverModeSwitch',
      ];
      const results = await this.captainRepository
        .createQueryBuilder('captain')
        .select(fields)
        .where('captain.externalId IN (:...externalIds)', {
          externalIds: externalIds,
        })
        .getMany();

      return ResponseData.success(results);
    } catch (err) {
      this.logger.error(
        `getSelectedCaptains -> ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  generatePayloadForWASL(
    captainDto: CreateCaptainWASLDto,
    userData: RedisUserInterface,
  ): RegistrationInterface {
    //  date conversion hijri to gregorian
    console.log('a');
    let dateOfBirthHijri;
    if (userData?.DobHijri) {
      let splitdata = userData.DobHijri.split('-');
      dateOfBirthHijri = splitdata.reverse().join('/');
    } else {
      const dayGreg = new Date(userData.dateOfBirth);
      const hijriDob = hijriDateConverter(dayGreg);

      dateOfBirthHijri = `${hijriDob.year}/${hijriDob.month}/${hijriDob.date}`;
    }
    let dateOfBirthG;
    if (userData?.dateOfBirth) {
      let splitdata = userData.dateOfBirth.split('-');
      dateOfBirthG = `${splitdata[2]}-${splitdata[1]}-${splitdata[0]}`;

      // dateOfBirthHijri = splitdata.reverse().join("/")
    }
    // console.log('b')
    const plateNo = captainDto.carPlateNo.split('-');
    const data = {
      driver: {
        identityNumber: captainDto.driverNationalId,
        // dateOfBirthHijri,
        dateOfBirthGregorian: dateOfBirthG || userData.dateOfBirth,
        // dateOfBirthGregorian: `${
        //   new Date(userData.dateOfBirth).toISOString().split("T")[0]
        // }`, // for non-saudi drivers
        emailAddress: userData?.emailId,
        mobileNumber: userData.mobileNo,
      },
      vehicle: {
        sequenceNumber: captainDto.carSequenceNo.replace(/^0+/, ''),
        plateLetterRight: plateNo[1][2],
        plateLetterMiddle: plateNo[1][1],
        plateLetterLeft: plateNo[1][0],
        plateNumber: plateNo[0],
        plateType: captainDto.carLicenceType,
      },
    };
    console.log(data);
    return data;
  }

  async waslCheck(data: CreateCaptainWASLDto, userData: RedisUserInterface) {
    try {
      let response;
      if (JSON.parse(appConfig().isWASL)) {
        // need redis call to get user info
        // console.log(data, userData)
        const registerData = this.generatePayloadForWASL(data, userData);
        this.logger.log(`waslCheck -> ${JSON.stringify(registerData)}`);

        const registerDriverVehicleRes = await this.waslService.registerDriverVehicle(
          registerData,
        );
        this.logger.log(
          `wasl register driver vehicle | res -> ${JSON.stringify(
            registerDriverVehicleRes,
          )}`,
        );

        if (registerDriverVehicleRes.statusCode !== HttpStatus.OK) {
          throw new Error(
            registerDriverVehicleRes.message ||
              errorMessage.SOMETHING_WENT_WRONG,
          );
        }

        response = registerDriverVehicleRes;
      } else {
        response = ResponseData.success();
      }

      return response;
    } catch (err) {
      this.logger.error(`waslCheck -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async create(
    data: CaptainEntity & CreateCaptainDto,
    userData: RedisUserInterface,
    sessionId: string,
  ) {
    try {
      const driver = await this.captainRepository.findOne({
        where: [
          { driverNationalId: data.driverNationalId },
          { externalId: userData.id },
        ],
        select: ['id', 'driverNationalId'],
      });
      if (driver) {
        if (driver.driverNationalId === data.driverNationalId) {
          this.logger.error(
            `create -> conflict -> ${errorMessage.DRIVER_EXIST_WITH_NATIONAL_ID} | driverNationalId: ${data.driverNationalId}`,
          );
          return ResponseData.error(
            HttpStatus.CONFLICT,
            errorMessage.DRIVER_EXIST_WITH_NATIONAL_ID,
          );
        }

        this.logger.error(
          `create -> conflict -> ${errorMessage.DRIVER_EXIST} | driverId: ${userData.id}`,
        );
        return ResponseData.error(
          HttpStatus.CONFLICT,
          errorMessage.DRIVER_EXIST,
        );
      }

      const waslRes = await this.waslCheck(data, userData);

      // const carInfo = await this.carInfoService.findOneBySequenceNo(
      //   data?.carSequenceNo,
      // );

      // if (
      //   carInfo.statusCode != HttpStatus.OK ||
      //   carInfo.data.ownerId != data.driverNationalId ||
      //   !carInfo?.data?.id
      // ) {
      //   return ResponseData.error(
      //     HttpStatus.NOT_FOUND,
      //     errorMessage.CAR_INFO_NOT_FOUND,
      //   );
      // }

      if (waslRes?.statusCode && waslRes?.statusCode != HttpStatus.OK) {
        data.WASLRejectionReasons = waslRes?.message;
        data.isWASLApproved = WASL_ELIGIBILITY_STATUS.INVALID;
      }
      const carInfo = await this.carInfoService.findOneBySequenceNo(
        data?.carSequenceNo,
      );
      if (
        carInfo.statusCode != HttpStatus.OK ||
        // carInfo.data.ownerId != data.driverNationalId ||
        !carInfo?.data?.id
      ) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.CAR_INFO_NOT_FOUND,
        );
      }
      let cabId: any = null;
      const vehicleResponse = await this.clientAdminTCP
        .send(GET_VEHICLE_MASTER_INFO, JSON.stringify(carInfo?.data))
        .pipe()
        .toPromise();
      this.logger.debug(
        `kafka::captain::${GET_VEHICLE_MASTER_INFO}::vehicleMasterInfoResponse -> ${JSON.stringify(
          vehicleResponse,
        )}`,
      );
      if (
        vehicleResponse.statusCode == HttpStatus.OK &&
        vehicleResponse?.data?.cabTypeId &&
        vehicleResponse?.data?.cabTypeId != null
      ) {
        cabId = vehicleResponse?.data?.cabTypeId;
      }
      if (cabId != null && cabId) {
        const cabType = await this.cabTypeRepository.findOne(cabId, {
          select: ['id'],
        });
        if (!cabType) {
          this.logger.error(
            `create -> cabType -> ${errorMessage.CAB_TYPE_NOT_FOUND}`,
          );
          return ResponseData.error(
            HttpStatus.BAD_REQUEST,
            errorMessage.CAB_TYPE_NOT_FOUND,
          );
        }
      }

      data.cab = cabId;
      const driverName: string = userData.firstName + ' ' + userData.lastName;

      const updatedData = {
        ...data,
        driverName,
        externalId: userData.id,
        approved: true,
        driverSubStatus: 1,
        driverSubscriptionId: data.subscriptionId,
        car: carInfo.data.id,
      };
      this.logger.log(
        `create -> updatedData -> ${JSON.stringify(updatedData)}`,
      );

      const captain = this.captainRepository.create(updatedData);
      await this.captainRepository.save(captain);
      this.logger.log(`create -> success -> ${JSON.stringify(captain.id)}`);

      this.logger.log(
        `kafka::trip::${UPDATE_CUSTOMER}::send -> ${JSON.stringify(
          captain.id,
        )}`,
      );
      this.tripKafkaClient.emit(
        UPDATE_CUSTOMER,
        JSON.stringify({
          id: userData.id,
          data: {
            userType: USER_TYPE.CAPTAIN,
            driverId: captain.id,
            cabId,
          },
        }),
      );

      //Redis logic to add driverId in storage
      const hashKey = createHash('md5').update(sessionId).digest('hex');
      const userDetails = JSON.parse(await this.getRedisKey(`user-${hashKey}`));
      this.redisClient.set(
        `user-${hashKey}`,
        JSON.stringify({ ...userDetails, driverId: captain.id }),
        function (err) {
          if (err) {
            Logger.error(
              `error while saving driver id in redis: ${JSON.stringify(err)}`,
            );
          } else {
            Logger.log('driver id saved in redis');
          }
        },
      );
      const driverInfo = JSON.stringify({
        userId: userData.id,
        captainId: captain.id,
        cabId: cabId,
      });
      this.redisClient.mset([`driverUser-${userData.id}`, driverInfo]);

      // Update ewallet car info to our car_info entity
      // if (data?.carSequenceNo) {
      //   this.carInfoService.syncCarInfo(
      //     {
      //       carSequenceNo: data.carSequenceNo,
      //       driverId: captain.id,
      //       cabId,
      //       userId: captain.externalId,
      //     },
      //     sessionId,
      //   );
      // }

      // Updates admin dashboard stats as new captain created
      await this.notifyAdminDashboardAsCaptainCreated();

      return ResponseData.success(
        { id: captain.id, isWASLApproved: captain.isWASLApproved },
        successMessage.CAPTAIN_ADDED,
      );
      // } else {
      //   this.logger.error(
      //     `create -> WASL error while creating captain driverNationalId: ${data.driverNationalId}`,
      //   );
      //   return ResponseData.error(
      //     HttpStatus.BAD_REQUEST,
      //     waslRes.message || "Can't create a captain",
      //   );
      // }
    } catch (err) {
      this.logger.error(`create -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async checkPackageDetails(id: string) {
    this.logger.log(
      `kafka::payment::${GET_SUBSCRIPTION_DETAIL}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    const packageDetails = await this.clientPaymentTCP
      .send(GET_SUBSCRIPTION_DETAIL, JSON.stringify({ id }))
      .pipe()
      .toPromise();
    if (packageDetails.statusCode === HttpStatus.NOT_FOUND) {
      this.logger.error(
        `create -> checkPackageDetails -> ${JSON.stringify(
          packageDetails.message,
        )}`,
      );
      throw new Error(packageDetails.message);
    }
    return packageDetails.data;
  }

  async getPackageInvoice(userId: string) {
    try {
      let captain = await this.captainRepository.findOne({
        select: [
          'id',
          'approved',
          'driverSubscriptionId',
          'externalId',
          'driverSubStatus',
        ],
        where: { externalId: userId },
      });
      if (!captain) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.DRIVER_NOT_FOUND,
        );
      }
      const id = captain.driverSubscriptionId;
      this.logger.log(
        `kafka::payment::${GET_SUBSCRIPTION_DETAIL}::send -> ${JSON.stringify(
          id,
        )}`,
      );
      const packageDetails = await this.clientPaymentTCP
        .send(GET_SUBSCRIPTION_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
      if (
        packageDetails.statusCode === HttpStatus.NOT_FOUND ||
        packageDetails.data.status != 1
      ) {
        this.logger.error(
          `create -> checkPackageDetails -> ${JSON.stringify(
            errorMessage.SUBSCRIPTION_NOT_FOUND,
          )}`,
        );
        throw new Error(errorMessage.SUBSCRIPTION_NOT_FOUND);
      } else {
        packageDetails.data.taxPercentage = await this.getTaxPercentage();
        packageDetails.data.cardFeePercentage = await this.getCardFee();
        this.logger.log(
          `[getPackageInvoice] ${packageDetails.data.taxPercentage} ${packageDetails.data.cardFeePercentage}`,
        );

        packageDetails.data.cardFee = Number(
          (
            (Number(packageDetails.data.cardFeePercentage) *
              Number(packageDetails.data.finalPrice)) /
            100
          ).toFixed(2),
        );
        packageDetails.data.cardFee = Number(
          (
            Number(
              (
                (Number(packageDetails.data.cardFee) *
                  Number(packageDetails.data.taxPercentage)) /
                100
              ).toFixed(2),
            ) + packageDetails.data.cardFee
          ).toFixed(2),
        );
        this.logger.log(
          `[getPackageInvoice] cardFee: ${packageDetails.data.cardFee}`,
        );

        this.logger.log(
          `[getPackageInvoice] finalPrice: ${packageDetails.data.finalPrice}`,
        );

        this.logger.log(
          `[getPackageInvoice] ${packageDetails.data.taxPercentage} ${packageDetails.data.cardFeePercentage}`,
        );
        packageDetails.data.taxAmount = Number(
          (
            Number(
              (
                Number(packageDetails.data.finalPrice) *
                Number(packageDetails.data.taxPercentage)
              ).toFixed(2),
            ) / 100
          ).toFixed(2),
        );

        this.logger.log(
          `[getPackageInvoice] TaxAmount: ${packageDetails.data.taxAmount}`,
        );
        packageDetails.data.finalPrice = Number(
          (
            Number(packageDetails.data.finalPrice) +
            packageDetails.data.cardFee +
            packageDetails.data.taxAmount
          ).toFixed(2),
        );
        this.logger.log(
          `[getPackageInvoice] finalPrice: ${packageDetails.data.finalPrice}`,
        );
      }
      return ResponseData.success(packageDetails.data);
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async checkSubscriptionTransaction(id: string) {
    this.logger.log(
      `kafka::payment::${GET_SUBSCRIPTION_TRANSACTIONS}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    const transactionResponse = await this.clientPaymentTCP
      .send(GET_SUBSCRIPTION_TRANSACTIONS, JSON.stringify(id))
      .pipe()
      .toPromise();
    if (transactionResponse.statusCode !== HttpStatus.OK) {
      this.logger.error(
        `create -> checkSubscriptionTransaction -> ${JSON.stringify(
          transactionResponse.message,
        )}`,
      );
      throw new Error(transactionResponse.message);
    }
    return transactionResponse.data;
  }

  addSubscription(params: UserSubscriptionDto, transactionId: string) {
    // Let this process on backend if the transaction is verified
    try {
      this.logger.log(
        `kafka::payment::${CREATE_USER_SUBSCRIPTION}::emit -> ${JSON.stringify({
          transactionId,
          params,
        })}`,
      );
      this.clientPaymentKafka
        .emit(
          CREATE_USER_SUBSCRIPTION,
          JSON.stringify({ params, transactionId }),
        )
        .pipe()
        .toPromise();
    } catch (e) {
      this.logger.error(
        `kafka::payment::${CREATE_USER_SUBSCRIPTION}::emit -> ${JSON.stringify({
          transactionId,
          params,
        })}`,
      );
      throw new Error(errorMessage.ADD_SUBSCRIPTION);
    }
  }

  async updateCaptain(id: string, data: CaptainEntity) {
    try {
      await this.captainRepository.update({ id }, data);
      this.logger.log(`updateCaptain -> Record updated -> ${id}`);
      return ResponseData.success(id, successMessage.RECORD_UPDATED);
    } catch (err) {
      this.logger.error(
        `updateCaptain -> error -> ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async changeDriverStatus(id: string, data: CaptainEntity) {
    try {
      const captain = await this.captainRepository.findOne(id, {
        select: ['id', 'approved', 'blockedReason', 'blockedDate'],
      });

      if (!data.approved) {
        data.driverModeSwitch = false;
      }
      await this.captainRepository.update({ id }, data);

      if (data.driverModeSwitch === false) {
        // Updates admin dashboard stats as driver mode switched
        await this.notifyAdminDashboardAsDriverModeSwitched();
      }

      this.logger.log(`[changeDriverStatus] -> updated -> ${id}`);

      // Audit log entry
      try {
        const auditParams = {
          moduleName: 'captain',
          entityName: 'captain-status',
          entityId: id,
          actionType: 'update',
          oldValues: {},
          newValues: {},
        };
        auditParams.oldValues = {
          approved: captain.approved,
          blockedReason: captain.blockedReason,
          blockedDate: captain.blockedDate,
        };
        if (data.approved) {
          auditParams.newValues = {
            approved: true,
            blockedReason: '',
            blockedDate: '',
          };
        } else {
          auditParams.newValues = {
            approved: false,
            blockedReason: data.blockedReason,
            blockedDate: data.blockedDate,
          };
        }
        this.clientAudit.emit(CREATE_AUDIT_LOG, JSON.stringify(auditParams));
        this.logger.log(
          `[changeDriverStatus] audit log for status: ${data.approved}`,
        );
      } catch (e) {
        this.logger.error(
          `[changeDriverStatus] audit log for status: ${data.approved} :: ${e.message}`,
        );
      }
      return ResponseData.success(id, successMessage.CAPTAIN_STATUS_CHANGE);
    } catch (err) {
      this.logger.error(
        `[changeDriverStatus] -> error -> ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
 async changeDriverOnline(id: string) {
    try{
      //   await this.captainRepository.update(
      //   { externalId: id },
      //   { isOnline: !captain.driverModeSwitch },
      // );
    }catch(err){

    }
 }
  async changeDriverMode(id: string) {
    try {
      let captain = await this.captainRepository.findOne(id, {
        select: [
          'id',
          'driverModeSwitch',
          'driverRideStatus',
          'externalId',
          'approved',
        ],
      });
      if (!captain) {
        captain = await this.captainRepository.findOne(
          {
            externalId: id,
          },
          {
            select: [
              'id',
              'driverModeSwitch',
              'driverRideStatus',
              'externalId',
              'approved',
            ],
          },
        );
      }
      if (!captain) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.DRIVER_NOT_FOUND,
        );
      }

      if (!captain.approved) {
        throw new Error(errorMessage.DRIVER_NOT_APPROVED);
      }

      // Check for driver trip status and restrict to switch OFF
      if (
        captain.driverModeSwitch === true &&
        captain.driverRideStatus === true
      ) {
        throw new Error(errorMessage.SWITCH_MODE_NOT_ALLOWED);
      }
      // /////TEMP
      // if (captain.externalId != '966110000005')
      //   throw new Error(errorMessage.SWITCH_MODE_NOT_ALLOWED);

      //TEMP
      // TODO: need to have check from trip-service as redis can't handle pending,rejected_driver statuses
      // Check for rider trip status and restrict to switch ON
      if (captain.driverModeSwitch === false && captain?.externalId) {
        const tripRiderKey = `${captain.externalId}-trip-*`;
        let scanList = await this.redisHandler.getMatchedClients(tripRiderKey);
        this.logger.log(
          `tripRiderKey : ${tripRiderKey} | scanList length : ${JSON.stringify(
            scanList,
          )}`,
        );
        if (scanList.length > 0 && scanList[0]) {
          let scanRecord = await this.redisHandler.getRedisKey(scanList[0]);
          let scanObject = JSON.parse(scanRecord);
          this.logger.log(`checking for tripId : ${scanObject?.tripId}`);
          if (scanObject?.tripId) {
            throw new Error(errorMessage.SWITCH_MODE_NOT_ALLOWED);
          }
        }
      }

      await this.captainRepository.update(
        { id: captain.id },
        { driverModeSwitch: !captain.driverModeSwitch },
      );

      // Updates admin dashboard stats as driver mode switched
      await this.notifyAdminDashboardAsDriverModeSwitched();

      return ResponseData.successWithMessage(
        successMessage.CAPTAIN_MODE_CHANGE,
      );
    } catch (err) {
      this.logger.error(`changeDriverMode  -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.DRIVER_NOT_FOUND,
      );
    }
  }

  async changeWaslStatus(id: string) {
    try {
      let captain = await this.captainRepository.findOne(id, {
        select: [
          'id',
          'driverModeSwitch',
          'driverRideStatus',
          'externalId',
          'approved',
          'isWASLApproved',
        ],
      });
      if (!captain) {
        captain = await this.captainRepository.findOne(
          {
            externalId: id,
          },
          {
            select: [
              'id',
              'driverModeSwitch',
              'driverRideStatus',
              'externalId',
              'approved',
              'isWASLApproved',
            ],
          },
        );
      }
      if (!captain) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.DRIVER_NOT_FOUND,
        );
      }
      let waslStatus = 0;
      if (captain.isWASLApproved == 0) waslStatus = 1;

      await this.captainRepository.update(
        { id: captain.id },
        { isWASLApproved: waslStatus },
      );

      const customerDetail = await this.tripTcpClient
        .send(
          GET_CUSTOMER_DETAIL,
          JSON.stringify({
            userId: captain.externalId,
            data: { isReviewDetail: false },
          }),
        )
        .pipe()
        .toPromise();

      const pushParams: PushNotificationReqDto = {
        deviceToken: '',
        multiple: true,
        deviceTokenList: [customerDetail.data.deviceToken],
        templateCode: 'NOTIFY_DRIVER_FOR_WASL_APPROVAL',
        keyValues: {},
        extraParams: {},
      };

      this.logger.log(
        `[findAndNotifyDriversForWASLEligibility] push notify to driver ID: ${customerDetail.data.userId} approved drivers`,
      );
      await this.sendPushNotificationToDrivers(pushParams, captain);
      return ResponseData.successWithMessage(
        successMessage.CAPTAIN_WASL_STATUS_CHANGE,
      );
    } catch (err) {
      this.logger.error(`changeDriverMode  -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.DRIVER_NOT_FOUND,
      );
    }
  }

  async getDriverMode(id: string) {
    try {
      this.logger.log(`[getDriverMode] -> Captain: ${id}`);

      const captain = await this.captainRepository.findOne(
        {
          externalId: id,
        },
        { select: ['id', 'driverModeSwitch'] },
      );

      if (!captain) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.DRIVER_NOT_FOUND,
        );
      }

      this.logger.log(
        `[getDriverMode] | Captain: ${id} | DriverModeSwitch: ${captain.driverModeSwitch}`,
      );

      return ResponseData.success(captain);
    } catch (err) {
      this.logger.error(`getDriverMode  -> ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.DRIVER_NOT_FOUND,
      );
    }
  }

  async changeDriverAvailability(id: string, status: boolean = null) {
    try {
      this.logger.log(`[changeDriverAvailability] -> Captain: ${id}`);

      const query = {
        driverModeSwitch: true,
        approved: true,
      };

      const captain = await this.captainRepository.findOne({
        where: [
          { id, ...query },
          { externalId: id, ...query },
        ],
        select: ['id', 'driverRideStatus'],
      });

      if (!captain) {
        this.logger.error(
          `[changeDriverAvailability] -> Captain not-found/not-approved/driver-mode-off -> ${id}`,
        );
        throw new HttpException(
          errorMessage.DRIVER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      let driverRideStatus = !captain.driverRideStatus;
      if (typeof status === 'boolean') {
        driverRideStatus = status;
      }

      await this.captainRepository.update(
        { id: captain.id },
        { driverRideStatus },
      );

      // Updates admin dashboard stats as driver ride status switched
      await this.notifyAdminDashboardAsDriverRideStatusSwitched();

      this.logger.log(
        `[changeDriverAvailability] -> Captain Availability Status Updated Success | Captain: ${id} | Status: ${driverRideStatus}`,
      );
      return ResponseData.successWithMessage(
        successMessage.CAPTAIN_AVAILABILITY_CHANGE,
      );
    } catch (err) {
      this.logger.log(
        `[changeDriverAvailability] -> Error in catch: ${err.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // Update driver current location
  async updateCaptainLocation(locationInfo: CaptainLocationInfo) {
    try {
      let whereParams;
      if (locationInfo.isExternalId) {
        whereParams = { externalId: locationInfo.driverId };
      } else {
        whereParams = { id: locationInfo.driverId };
      }

      const driver = await this.captainRepository.findOne(whereParams, {
        select: [
          'id',
          'driverNationalId',
          'carSequenceNo',
          'eligibilityExpiryDate',
        ],
      });
      if (driver && driver.id) {
        const upData = {
          latitude: locationInfo.latitude,
          longitude: locationInfo.longitude,
        };
        await this.captainRepository.update({ id: driver.id }, upData);
        this.logger.log(
          `updateCaptainLocation -> updated -> ${JSON.stringify(locationInfo)}`,
        );

        // if(driver.eligibilityExpiryDate) {

        const waslResponse = await this.waslUpdateLocation(
          driver,
          locationInfo,
        );
        if (
          waslResponse?.success !== true &&
          waslResponse?.statusCode !== HttpStatus.OK
        ) {
          this.logger.error(
            `updateCaptainLocation -> WASL can not update location of driver, driverId ${driver.id}`,
          );
          this.logger.error(
            `updateCaptainLocation -> waslUpdateLocation -> ${JSON.stringify(
              waslResponse,
            )}`,
          );
        }

        // } else {
        //   this.logger.log(`updateCaptainLocation -> Skipping WASL location update as captain is not eligible. | Captain: ${driver.id}`);
        // }
      }
    } catch (err) {
      this.logger.error(
        `updateCaptainLocation -> error -> ${JSON.stringify(err)}`,
      );
    }
  }

  async waslUpdateLocation(
    driver: CaptainEntity,
    locationInfo: CaptainLocationInfo,
  ) {
    try {
      if (JSON.parse(appConfig().isWASL)) {
        const data = {
          driverIdentityNumber: driver.driverNationalId,
          vehicleSequenceNumber: driver.carSequenceNo,
          latitude: locationInfo.latitude,
          longitude: locationInfo.longitude,
          hasCustomer: false, // static for now will change
          updatedWhen: new Date().toISOString(),
        };
        this.logger.log(
          `waslUpdateLocation -> data -> ${JSON.stringify(data)}`,
        );
        return await this.waslService.updateCurrentLocation(data);
      } else {
        return ResponseData.success();
      }
    } catch (err) {
      this.logger.error(
        `waslUpdateLocation -> error -> ${JSON.stringify(err.message)}`,
      );
    }
  }

  /*
   * Find drivers based on the input criteria i.e radius,latitude,longitude,limit(optional),exclude_drivers(optional)
   */
  async findCaptainList(params: FindCaptainListParams) {
    try {
      let locationDistance = 0;
      if (
        params &&
        params.latitude &&
        params.longitude &&
        params.destinationLatitude &&
        params.destinationLongitude
      ) {
        // const { distance } = await calculateFareDistance(
        //   { lat: params.latitude, lng: params.longitude },
        //   { lat: params.destinationLatitude, lng: params.destinationLongitude },
        // );
        // locationDistance = distance;
        // TODO APPLY FREE MATRIX APIS TO REDUCE
        locationDistance =
          this.calcCrow(
            params.latitude,
            params.longitude,
            params.destinationLatitude,
            params.destinationLongitude,
          ) * 1.7;
      }
      if (!params.radius) {
        let radiusVal = await this.getRedisKey(
          'SETTING_TRIP_DRIVER_SEARCH_RADIUS',
        );
        if (!radiusVal) {
          this.logger.error(
            '[findCaptainList] redis :: SETTING_TRIP_DRIVER_SEARCH_RADIUS got null',
          );
        }
        params.radius = Number(radiusVal ?? 5);
      }
      if (!params.limit) {
        let searchLimit = await this.getRedisKey(
          'SETTING_TRIP_DRIVER_SEARCH_LIMIT',
        );
        if (!searchLimit) {
          this.logger.error(
            '[findCaptainList] redis :: SETTING_TRIP_DRIVER_SEARCH_LIMIT got null',
          );
        }
        params.limit = Number(searchLimit ?? 5);
      }
      // MUST_NOTE: GeoDistMiles function should be added in the database
      const captainFields = [
        'c.*',
        'GeoDistMiles(' +
          params.latitude +
          ',' +
          params.longitude +
          ",c.latitude,c.longitude,'km') AS distance",
      ];
      const captainQryInstance = this.captainRepository.createQueryBuilder('c');
      captainQryInstance.select(captainFields);

      captainQryInstance.where('approved = :approved', { approved: true });
      captainQryInstance.andWhere('isWASLApproved = :isWASLApproved', {
        isWASLApproved: WASL_ELIGIBILITY_STATUS.VALID,
      });
      captainQryInstance.andWhere('driverModeSwitch = :driverModeSwitch', {
        driverModeSwitch: true,
      });
      captainQryInstance.andWhere('driverRideStatus = :driverRideStatus', {
        driverRideStatus: false,
      }); // check occupied in ride or not
      captainQryInstance.andWhere('driverSubStatus = 1');
      captainQryInstance.andWhere('latitude IS NOT NULL');
      captainQryInstance.andWhere('longitude IS NOT NULL');

      captainQryInstance.andWhere('iban IS NOT NULL');
      captainQryInstance.andWhere('isOnline  = 1');
      if (params?.cabId) {
        captainQryInstance.andWhere('cabId = :cabId', { cabId: params.cabId });
      }

      // if (params.excludeList && params.excludeList.length > 0) {
      //   captainQryInstance.andWhere('externalId NOT IN (:...excludeList)', {
      //     excludeList: params.excludeList,
      //   });
      // }

      if (params.radius && params.radius > 0) {
        captainQryInstance.groupBy('id');
        captainQryInstance.having('distance <= :radius', {
          radius: params.radius,
        });
      }
      if (params.limit && params.limit > 0) {
        captainQryInstance.limit(params.limit);
      }
      captainQryInstance.orderBy({
        distance: 'ASC',
        // updatedAt: 'DESC',
      });
      const drivers = await captainQryInstance.getRawMany();

      let carCategoryTypes = [];
      if (drivers.length > 0) {
        const carTypeIds = drivers
          .map((item) => item.cabId)
          .filter((value, index, self) => self.indexOf(value) === index);
        this.logger.log(
          `findCaptainList -> carTypeIds -> ${JSON.stringify(carTypeIds)}`,
        );
        const cabTypeQryInstance = this.cabTypeRepository.createQueryBuilder();
        cabTypeQryInstance.select('*');
        if (carTypeIds && carTypeIds.length > 0) {
          cabTypeQryInstance.whereInIds(carTypeIds);
        }
        carCategoryTypes = await cabTypeQryInstance.getRawMany();

        carCategoryTypes.map((record, idx) => {
          record.categoryIcon = this.awsS3Service.getPublicCabTypeFile({
            name: record?.categoryIcon,
          });
          let pBaseFare = record.passengerBaseFare;
          let pBaseDistance = record.passengerBaseDistance;
          let pBaseTime = record.passengerBaseTime;
          let pCostPerMin = record.passengerCostPerMin;
          let pCostPerKm = record.passengerCostPerKm;

          let pTotalCost = pBaseFare;
          // Distance calucaltions
          if (locationDistance && locationDistance > pBaseDistance) {
            let extraDistance = locationDistance - pBaseDistance;
            pTotalCost = pBaseFare + extraDistance * pCostPerKm;
          }
          // TODO: Minute calulations

          // TODO: Share calculations

          // TODO: Pool calculations

          // carCategoryTypes[idx].tripDistance = locationDistance;
          // carCategoryTypes[idx].passengerTotalCost = pTotalCost ? Number(pTotalCost.toFixed(2)) : 0;

          return {
            ...record,
            tripDistance: locationDistance,
            passengerTotalCost: pTotalCost ? Number(pTotalCost.toFixed(2)) : 0,
          };
        });
      }

      this.logger.log(
        `findCaptainList -> success -> drivers ${drivers?.length} | car_types ${carCategoryTypes.length} `,
      );

      return {
        statusCode: HttpStatus.OK,
        drivers: drivers,
        car_types: carCategoryTypes,
      };
    } catch (err) {
      this.logger.error(
        `findCaptainList -> error -> ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findDriversForAdmin(params: FindCaptainsByAdminParams) {
    try {
      // let locationDistance = 0;
      // if (params && params.addresses && params.addresses[0]?.latitude && params.addresses[0]?.longitude && params.addresses[1]?.latitude && params.addresses[1]?.longitude) {
      //   const { distance } = await calculateFareDistance(
      //     { lat: params.addresses[0]?.latitude, lng: params.addresses[0]?.longitude },
      //     { lat: params.addresses[1]?.latitude, lng: params.addresses[1]?.longitude }
      //   );
      //   locationDistance = distance;
      // }

      if (!params.radius) {
        let radiusVal = await this.getRedisKey(
          'SETTING_TRIP_DRIVER_SEARCH_RADIUS',
        );
        if (!radiusVal) {
          this.logger.error(
            '[findCaptainList] redis :: SETTING_TRIP_DRIVER_SEARCH_RADIUS got null',
          );
        }
        params.radius = Number(radiusVal ?? 5);
      }
      if (!params.limit) {
        params.limit = DRIVER_SEARCH_LIMIT_FOR_ADMIN;
      }

      const captainFields = [
        'c.*',
        // "ST_distance(ST_GeomFromText('POINT(" + params.addresses[0]?.latitude + " " + params.addresses[0]?.longitude + ")'),ST_GeomFromText(CONCAT('POINT(',COALESCE(c.latitude,NULL),' ',COALESCE(c.longitude,NULL),')'))) AS db_distance",
        'GeoDistMiles(' +
          params.addresses[0]?.latitude +
          ', ' +
          params.addresses[0]?.longitude +
          ", c.latitude, c.longitude,'km') AS distance",
      ];
      const captainQryInstance = this.captainRepository.createQueryBuilder('c');
      captainQryInstance.select(captainFields);

      captainQryInstance.where('approved = :approved', { approved: true });
      captainQryInstance.andWhere('driverSubStatus = :driverSubStatus', {
        driverSubStatus: true,
      });
      captainQryInstance.andWhere('driverModeSwitch = :driverModeSwitch', {
        driverModeSwitch: true,
      });
      captainQryInstance.andWhere('driverRideStatus = :driverRideStatus', {
        driverRideStatus: false,
      });
      captainQryInstance.andWhere('latitude IS NOT NULL');
      captainQryInstance.andWhere('longitude IS NOT NULL');

      captainQryInstance.andWhere('iban IS NOT NULL');
      if (params?.cabId) {
        captainQryInstance.andWhere('cabId = :cabId', { cabId: params.cabId });
      }
      if (params.radius && params.radius > 0) {
        captainQryInstance.groupBy('id');
        captainQryInstance.having('distance <= :radius', {
          radius: params.radius,
        });
      }
      if (params.limit && params.limit > 0) {
        captainQryInstance.limit(params.limit);
      }
      captainQryInstance.orderBy({
        distance: 'ASC',
        driverRating: 'DESC',
      });
      const drivers = await captainQryInstance.getRawMany();

      /**
       * TODO:
       * Fetch list of on-ride drivers which are about to complete the on-going trip ( by distance, e.g. destination is 5km far )
       * Current location of on-ride driver need to be get from redis
       * Calculation { distance b/w current location to on-going trip destination } + { on-going trip destination to current pickup location }
       */

      if (drivers) {
        let driversInfo = [];
        {
          const externalIds = drivers.map((data) => data?.externalId);
          this.logger.log(
            `kafka::trip::${GET_SELECTED_CUSTOMERS}::send -> ${JSON.stringify(
              externalIds,
            )}`,
          );
          const { data: usersData } = await this.tripTcpClient
            .send(
              GET_SELECTED_CUSTOMERS,
              JSON.stringify({ userIds: externalIds }),
            )
            .pipe()
            .toPromise();
          this.logger.log(
            `drivers info :: received -> ${JSON.stringify(driversInfo)}`,
          );
          if (usersData && usersData.length > 0) {
            driversInfo = usersData;
          }
        }
        drivers.map((data) => {
          const userInfo = driversInfo.filter(
            (rec) => rec.userId == data.externalId,
          );
          if (userInfo && userInfo.length > 0) {
            data['emailId'] = userInfo[0]['emailId'];
            data['mobileNo'] = userInfo[0]['mobileNo'];
            data['totalTrips'] = userInfo[0]['totalTrips'];
            data['profileImage'] = userInfo[0]['profileImage'];
          } else {
            data['emailId'] = '';
            data['mobileNo'] = '';
            data['totalTrips'] = 0;
            data['profileImage'] = '';
          }
        });
      }

      return ResponseData.success(drivers);
    } catch (err) {
      this.logger.error(
        `findCaptainListForDispatcherAdmin -> error -> ${JSON.stringify(
          err.message,
        )}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async getActiveDriverStats() {
    try {
      let offlineCount;
      let onlineCount;
      let onrideCount;
      // Offline count
      {
        const transQryInstance = this.captainRepository.createQueryBuilder(
          'captain',
        );
        transQryInstance.where('captain.driverModeSwitch = :driverModeSwitch', {
          driverModeSwitch: false,
        });
        offlineCount = await transQryInstance.getCount();
      }
      // Online count
      {
        const transQryInstance = this.captainRepository.createQueryBuilder(
          'captain',
        );
        transQryInstance.where('captain.driverModeSwitch = :driverModeSwitch', {
          driverModeSwitch: true,
        });
        onlineCount = await transQryInstance.getCount();
      }
      // Onride count
      {
        const transQryInstance = this.captainRepository.createQueryBuilder(
          'captain',
        );
        transQryInstance.where('captain.driverRideStatus = :driverRideStatus', {
          driverRideStatus: true,
        });
        onrideCount = await transQryInstance.getCount();
      }
      offlineCount = Number(offlineCount ?? 0);
      onlineCount = Number(onlineCount ?? 0);
      onrideCount = Number(onrideCount ?? 0);
      if (onrideCount > 0) {
        onlineCount = onlineCount - onrideCount;
      }
      let total = offlineCount + onlineCount + onrideCount;
      let graphList = [
        { key: 'online', value: onlineCount },
        { key: 'offline', value: offlineCount },
        { key: 'onRides', value: onrideCount },
      ];
      this.logger.log(
        `getAvailableDriverStats -> success -> ${JSON.stringify({
          graphList,
          total,
        })}`,
      );
      return ResponseData.success({ graphList, total });
    } catch (err) {
      this.logger.error(
        `getAvailableDriverStats -> error -> ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAllSubscriptions(userId: string, pagination: PaginationCommonDto) {
    try {
      const captain = await this.captainRepository.findOne(
        { externalId: userId },
        { select: ['id'] },
      );
      if (!captain) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.DRIVER_NOT_FOUND,
        );
      }

      let subscriptions = [];

      const subscriptionRes = await this.clientPaymentTCP
        .send(
          GET_ALL_USER_SUBSCRIPTIONS,
          JSON.stringify({ userIds: [userId], pagination }),
        )
        .pipe()
        .toPromise();
      if (subscriptionRes && subscriptionRes.statusCode !== HttpStatus.OK) {
        throw new HttpException(
          subscriptionRes?.message,
          subscriptionRes.statusCode,
        );
      }
      subscriptions = subscriptionRes?.data || [];

      return ResponseData.success(subscriptions);
    } catch (err) {
      this.logger.error(
        `[findAllSubscriptions] Error in catch -> ${JSON.stringify(
          err.message,
        )}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAllEarnings(userId: string, body: SubscriptionEarningDto) {
    try {
      this.logger.log(
        `[findAllEarnings] userId: ${userId} | body: ${JSON.stringify(body)}`,
      );

      const captain = await this.captainRepository.findOne(
        { externalId: userId },
        { select: ['id'] },
      );
      if (!captain) {
        this.logger.error(
          `[findAllEarnings] Error | userId: ${userId} | ${errorMessage.DRIVER_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.DRIVER_NOT_FOUND,
        );
      }

      // Find Captain earnings for trip
      const userEarningsRes = await this.clientPaymentTCP
        .send(GET_USER_EARNINGS, JSON.stringify({ userId, body }))
        .pipe()
        .toPromise();

      if (userEarningsRes && userEarningsRes.statusCode !== HttpStatus.OK) {
        this.logger.error(
          `[findAllEarnings] Error | userId: ${userId} | userEarningsRes: ${JSON.stringify(
            userEarningsRes,
          )}`,
        );
        throw new HttpException(
          userEarningsRes?.message,
          userEarningsRes.statusCode,
        );
      }

      let earnings = userEarningsRes?.data || {};
      let transactions = earnings?.transactions || [];
      const riderIds = transactions.map(({ senderId }) => senderId) || [];

      if (transactions.length && riderIds.length) {
        // Fetch Rider name from id's
        const riderResponse = await this.tripTcpClient
          .send(
            GET_SELECTED_CUSTOMERS,
            JSON.stringify({
              userIds: riderIds,
              select: [
                'firstName',
                'lastName',
                'userId',
                'arabicFirstName',
                'arabicLastName',
              ],
            }),
          )
          .pipe()
          .toPromise();

        if (riderResponse && riderResponse.statusCode !== HttpStatus.OK) {
          this.logger.error(
            `[findAllEarnings] Error in fetching Riders | userId: ${userId} | riderResponse: ${JSON.stringify(
              riderResponse,
            )}`,
          );
          throw new HttpException(
            riderResponse?.message,
            riderResponse.statusCode,
          );
        }

        const riders = riderResponse?.data || [];

        // Combine Earning with Rider name
        transactions = transactions.map((transaction) => {
          const riderDetail = riders.find(
            (rider) => rider.userId === transaction.senderId,
          );

          return {
            ...transaction,
            firstName: riderDetail?.firstName,
            lastName: riderDetail?.lastName,
            arabicFirstName: riderDetail?.arabicFirstName,
            arabicLastName: riderDetail?.arabicLastName,
          };
        });

        // Updated each transaction records
        earnings = {
          ...earnings,
          transactions,
        };
      }

      this.logger.log(
        `[findAllEarnings] Success | userId: ${userId} | body: ${JSON.stringify(
          body,
        )}`,
      );
      return ResponseData.success(earnings);
    } catch (err) {
      this.logger.error(
        `[findAllEarnings] Error in catch -> ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getDriversReport(params: ListSearchSortDto) {
    try {
      const fields = [
        'captain.id',
        'captain.externalId',
        'captain.driverName',
        'captain.driverNationalId',
        'captain.carPlateNo',
        'captain.carSequenceNo',
        'captain.carLicenceType',
        'captain.approved',
        'captain.driverModeSwitch',
        'captain.cabId',
        'captain.latitude',
        'captain.longitude',
        'captain.createdAt',
        'cab.name',
        'cab.noOfSeats',
        'captain.drivingModes',
      ];
      const driverQryInstance = this.captainRepository.createQueryBuilder(
        'captain',
      );
      driverQryInstance.select(fields);
      driverQryInstance.leftJoin('captain.cab', 'cab');
      //Admin Filters
      if (typeof params?.filters?.externalId === 'number') {
        driverQryInstance.andWhere('captain.externalId = :externalId', {
          externalId: params?.filters?.externalId,
        });
      }
      if (params?.filters?.driverName) {
        driverQryInstance.andWhere('captain.driverName LIKE :driverName', {
          driverName: `${params?.filters?.driverName}%`,
        });
      }
      if (params?.filters?.driverNationalId) {
        driverQryInstance.andWhere(
          'captain.driverNationalId LIKE :driverNationalId',
          { driverNationalId: `${params?.filters?.driverNationalId}%` },
        );
      }
      if (params?.filters?.carPlateNo) {
        driverQryInstance.andWhere('captain.carPlateNo LIKE :carPlateNo', {
          carPlateNo: `${params?.filters?.carPlateNo}%`,
        });
      }
      if (params?.filters?.carSequenceNo) {
        driverQryInstance.andWhere(
          'captain.carSequenceNo LIKE :carSequenceNo',
          { carSequenceNo: `${params?.filters?.carSequenceNo}%` },
        );
      }
      if (typeof params?.filters?.carLicenceType === 'number') {
        driverQryInstance.andWhere('captain.carLicenceType = :carLicenceType', {
          carLicenceType: params?.filters?.carLicenceType,
        });
      }
      if ('approved' in params?.filters) {
        driverQryInstance.andWhere('captain.approved = :approved', {
          approved: params?.filters?.approved,
        });
      }
      if ('driverModeSwitch' in params?.filters) {
        driverQryInstance.andWhere(
          'captain.driverModeSwitch = :driverModeSwitch',
          { driverModeSwitch: params?.filters?.driverModeSwitch },
        );
      }
      if (params?.filters?.cabName) {
        driverQryInstance.andWhere('cab.name LIKE :cabName', {
          cabName: `${params?.filters?.cabName}%`,
        });
      }
      if (typeof params?.filters?.drivingMode === 'number') {
        driverQryInstance.andWhere(
          'FIND_IN_SET(:drivingMode, captain.drivingModes)',
          { drivingMode: params?.filters?.drivingMode },
        );
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        driverQryInstance.andWhere('captain.createdAt >= :fromDate', {
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
        driverQryInstance.andWhere('captain.createdAt <= :toDate', { toDate });
      }
      // TODO: MobileNo Filter
      // TODO: Rating Filter
      // TODO: Subscription Status
      // TODO: Total Trips Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = CaptainListSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          driverQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        driverQryInstance.orderBy('captain.createdAt', 'DESC');
      }
      driverQryInstance.skip(params.skip);
      driverQryInstance.take(params.take);
      const [result, total] = await driverQryInstance.getManyAndCount();

      const totalCount: number = total;
      const captains: any = result;
      if (captains?.length) {
        captains.forEach((captainRow, captainIndex) => {
          captains[captainIndex].drivingModes = captainRow.drivingModes.map(
            (driveMode) => {
              return { drivingMode: Number(driveMode) };
            },
          );
        });
      }

      let captainUserList = [];
      {
        const externalIds = captains.map((data) => Number(data?.externalId));
        if (externalIds && externalIds.length > 0) {
          const { data: usersData } = await this.tripTcpClient
            .send(
              GET_SELECTED_CUSTOMERS,
              JSON.stringify({ userIds: externalIds }),
            )
            .pipe()
            .toPromise();
          if (usersData && usersData.length > 0) {
            captainUserList = usersData;
          }
        }
      }
      let captainReviewList = [];
      {
        const externalIds = captains.map((data) => data?.externalId);
        if (externalIds && externalIds.length > 0) {
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
          if (reviewData && reviewData.length > 0) {
            captainReviewList = reviewData;
          }
        }
      }
      let captainSubscriptions = [];
      {
        const externalIds = captains.map((data) => data?.externalId);
        if (externalIds && externalIds.length > 0) {
          const { data: subscriptionData } = await this.clientPaymentTCP
            .send(
              GET_ALL_USER_SUBSCRIPTIONS,
              JSON.stringify({ userIds: externalIds, latest: true }),
            )
            .pipe()
            .toPromise();
          if (subscriptionData && subscriptionData.length > 0) {
            captainSubscriptions = subscriptionData;
          }
        }
      }

      captains.map((data) => {
        const userInfo = captainUserList.filter(
          (rec) => rec.userId === data.externalId,
        );
        if (userInfo && userInfo.length > 0) {
          data['profileImage'] = userInfo[0]['profileImage'];
          data['dateOfBirth'] = userInfo[0]['dateOfBirth'];
          data['mobileNo'] = userInfo[0]['mobileNo'];
          data['totalRides'] = userInfo[0]['totalRides'];
          data['totalTrips'] = userInfo[0]['totalTrips'];
        } else {
          data['profileImage'] = '';
          data['dateOfBirth'] = '';
          data['mobileNo'] = '';
          data['totalRides'] = 0;
          data['totalTrips'] = 0;
        }

        const reviewInfo = captainReviewList.filter(
          (rec) => rec.externalId === data.externalId,
        );
        if (reviewInfo && reviewInfo.length > 0) {
          data['overallRating'] = reviewInfo[0]['rating'];
          data['overallReviews'] = reviewInfo[0]['reviewCount'];
        } else {
          data['overallRating'] = 0;
          data['overallReviews'] = 0;
        }

        const subscriptionInfo = captainSubscriptions.filter(
          (rec) => rec.userId === data.externalId,
        );
        if (subscriptionInfo && subscriptionInfo.length > 0) {
          data['subscription'] = {};
          data['subscription']['status'] = subscriptionInfo[0]['status'];
          data['subscription']['remainingDays'] = getDays(
            new Date(subscriptionInfo[0]['dueDate']),
            new Date(),
          );
        } else {
          data['subscription'] = {};
        }
      });
      this.logger.log(`[getDriversReport] -> success `);

      return ResponseData.success({ captains, totalCount });
    } catch (err) {
      this.logger.error(
        `[getDriversReport] -> error -> ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateSubscriptionDetail(params: SubscriptionParams) {
    try {
      if (params?.userId) {
        let captain = await this.captainRepository.findOne({
          select: ['id', 'driverSubStatus'],
          where: { externalId: params.userId },
        });
        if (!captain) {
          this.logger.error(
            `[updateSubscriptionDetail] driver not found | externalId : ${params.userId}`,
          );
          throw new Error(errorMessage.DRIVER_NOT_FOUND);
        }
        const data = {
          driverSubStatus: params.status ?? captain.driverSubStatus,
        };
        await this.captainRepository.update({ id: captain.id }, data);
        this.logger.error(
          `[updateSubscriptionDetail] updated status(${data.driverSubStatus}) | externalId : ${params.userId}`,
        );
        return ResponseData.success(
          data,
          successMessage.CAPTAIN_SUBSCRIPTION_UPDATED,
        );
      } else {
        this.logger.error('[updateSubscriptionDetail] userId not found input');
        throw new Error(errorMessage.DRIVER_NOT_FOUND);
      }
    } catch (err) {
      this.logger.error(
        `[updateSubscriptionDetail] error > ${JSON.stringify(err.message)}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.DRIVER_NOT_FOUND,
      );
    }
  }

  async cancelSubscription(userId: string) {
    try {
      this.logger.log(`[cancelSubscription] userId: ${userId}`);

      const captain = await this.captainRepository.findOne(
        { externalId: userId },
        { select: ['id', 'driverModeSwitch', 'approved'] },
      );
      if (!captain) {
        this.logger.error(
          `[cancelSubscription] Error => ${errorMessage.DRIVER_NOT_FOUND}`,
        );
        throw new HttpException(
          errorMessage.DRIVER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      if (!captain.approved) {
        throw new HttpException(
          errorMessage.DRIVER_NOT_APPROVED,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const subscription = await this.clientPaymentTCP
        .send(CANCEL_USER_SUBSCRIPTION, userId)
        .pipe()
        .toPromise();

      if (subscription.statusCode !== HttpStatus.OK) {
        this.logger.error(
          `[cancelSubscription] Error => ${subscription?.message}`,
        );
        throw new HttpException(subscription?.message, subscription.statusCode);
      }

      let updateObj = {
        driverSubStatus: 0,
        driverModeSwitch: captain.driverModeSwitch,
      };
      if (captain.driverModeSwitch) {
        updateObj.driverModeSwitch = false;
      }
      await this.captainRepository.update({ id: captain.id }, updateObj);

      if (updateObj.driverModeSwitch === false) {
        // Updates admin dashboard stats as driver mode switched
        await this.notifyAdminDashboardAsDriverModeSwitched();
      }

      return ResponseData.successWithMessage(subscription.message);
    } catch (error) {
      this.logger.error(
        `[cancelSubscription] Error in catch => ${error.message}`,
      );

      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async activateSubscription(userId: string) {
    try {
      this.logger.log(`[activateSubscription] userId: ${userId}`);

      const captain = await this.captainRepository.findOne(
        { externalId: userId },
        { select: ['id', 'driverModeSwitch', 'approved'] },
      );
      if (!captain) {
        this.logger.error(
          `[activateSubscription] Error => ${errorMessage.DRIVER_NOT_FOUND}`,
        );
        throw new HttpException(
          errorMessage.DRIVER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      if (!captain.approved) {
        throw new HttpException(
          errorMessage.DRIVER_NOT_APPROVED,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const subscription = await this.clientPaymentTCP
        .send(ACTIVATE_USER_SUBSCRIPTION, userId)
        .pipe()
        .toPromise();

      if (subscription.statusCode !== HttpStatus.OK) {
        this.logger.error(
          `[activateSubscription] Error => ${subscription?.message}`,
        );
        throw new HttpException(subscription?.message, subscription.statusCode);
      }

      let updateObj = {
        driverSubStatus: 1,
        driverModeSwitch: captain.driverModeSwitch,
      };
      if (!captain.driverModeSwitch) {
        updateObj.driverModeSwitch = true;
      }
      await this.captainRepository.update({ id: captain.id }, updateObj);

      if (updateObj.driverModeSwitch === true) {
        // Updates admin dashboard stats as driver mode switched
        await this.notifyAdminDashboardAsDriverModeSwitched();
      }

      return ResponseData.successWithMessage(subscription.message);
    } catch (error) {
      this.logger.error(
        `[activateSubscription] Error in catch => ${error.message}`,
      );

      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        error?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyCaptain(userId, data?: VerifySubscriptionParams) {
    try {
      const captain: any = await this.validateCaptain(userId);
      if (captain.driverSubStatus === 0) {
        const upData = {
          driverSubStatus: 0,
        };
        let extraData;
        const respUserSubscription = await this.clientPaymentTCP
          .send(
            GET_USER_SUBSCRIPTION_DETAIL,
            JSON.stringify({
              userId: captain.externalId,
              status: SUBSCRIPTION_STATUS.ACTIVE,
            }),
          )
          .pipe()
          .toPromise();
        if (
          respUserSubscription &&
          respUserSubscription.statusCode === HttpStatus.OK
        ) {
          this.logger.log(
            '[verifyCaptain] subscription already exists' +
              JSON.stringify(respUserSubscription.data),
          );
          extraData = {
            driverSubStatus: 1,
            driverSubAmount: respUserSubscription.data?.subscriptionAmount,
            driverSubscriptionId: respUserSubscription.data?.subscriptionId,
          };
        } else {
          const subscriptionTransaction = await this.checkSubscriptionTransaction(
            userId,
          );
          this.logger.log(
            `[verifyCaptain] -> checkSubscriptionTransaction -> response: ${JSON.stringify(
              subscriptionTransaction,
            )}`,
          );
          if (subscriptionTransaction?.txnId || subscriptionTransaction?.id) {
            subscriptionTransaction.txnId = subscriptionTransaction?.id;
            const packageDetails = await this.checkPackageDetails(
              captain.driverSubscriptionId,
            );
            const month =
              packageDetails.planType === SUBSCRIPTION_TYPE.YEARLY ? 12 : 1;
            const startDate: Date = new Date();
            const endDate: Date = addMonths(startDate, month);
            const dueDate: Date = addDays(endDate, 1);

            const subParams: UserSubscriptionDto = {
              userId: captain.externalId,
              userType: USER_TYPE.CAPTAIN,
              subscriptionId: packageDetails.id,
              subscriptionType: packageDetails.planType,
              subscriptionAmount: packageDetails.finalPrice,
              paidAmount: subscriptionTransaction.amount,
              dueAmount:
                packageDetails.finalPrice - subscriptionTransaction.amount,
              autoRenewal: data.autoRenewal ?? true,
              startDate: getIsoDate(startDate),
              endDate: getIsoDate(endDate),
              dueDate: getIsoDate(dueDate),
              status: SUBSCRIPTION_STATUS.ACTIVE,
              notify: true,
            };
            const transactionId = subscriptionTransaction.txnId;
            this.addSubscription(subParams, transactionId);
            this.logger.log('[verifyCaptain] subscription added');
            extraData = {
              driverSubStatus: 1,
              driverSubAmount: packageDetails.finalPrice,
              driverSubscriptionId: packageDetails.id,
            };
          } else {
            this.logger.error('[verifyCaptain] error > Subscription not found');
            return ResponseData.error(
              HttpStatus.NOT_FOUND,
              errorMessage.SUBSCRIPTION_NOT_FOUND,
            );
          }
        }
        this.logger.log(
          '[verifyCaptain] updating info : ' + JSON.stringify(upData),
        );
        await this.captainRepository.update(
          { id: captain.id },
          { ...upData, ...extraData },
        );
        this.logger.log('[verifyCaptain] driver subscription verified');
        return ResponseData.success(
          { id: captain.id },
          successMessage.VALID_CAPTAIN_STATUS,
        );
      } else {
        this.logger.log(
          '[verifyCaptain] driver already have subscription verified',
        );
        return ResponseData.success(
          { id: captain.id },
          successMessage.VALID_CAPTAIN_STATUS,
        );
      }
    } catch (err) {
      this.logger.error('[verifyCaptain] error > ' + JSON.stringify(err));
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async addUserSubscription(params: addUserSubscriptionDto) {
    try {
      const captain: any = await this.validateCaptain(params.userId);
      if (captain.driverSubStatus === 0) {
        const packageDetails = await this.checkPackageDetails(
          captain.driverSubscriptionId,
        );
        const month =
          packageDetails.planType === SUBSCRIPTION_TYPE.YEARLY ? 12 : 1;
        const startDate: Date = new Date();
        const endDate: Date = addMonths(startDate, month);
        const dueDate: Date = addDays(endDate, 1);

        const subParams: UserSubscriptionDto = {
          userId: captain.externalId,
          userType: USER_TYPE.CAPTAIN,
          subscriptionId: packageDetails.id,
          subscriptionType: packageDetails.planType,
          subscriptionAmount: packageDetails.finalPrice,
          paidAmount: params.senderAmount,
          dueAmount:
            packageDetails.finalPrice -
            (params?.promoCodeAmount || 0) -
            params.senderAmount,
          autoRenewal: false,
          startDate: getIsoDate(startDate),
          endDate: getIsoDate(endDate),
          dueDate: getIsoDate(dueDate),
          status: SUBSCRIPTION_STATUS.ACTIVE,
          notify: true,
          transactionId: params.transactionId,
          transactionAmount: params?.transactionAmount,
          promoCode: params?.promoCode,
          promoCodeAmount: params?.promoCodeAmount,
          source: params?.source,
          sourceRef: params?.sourceRef,
          tax: params?.senderTax,
          fee: params?.senderFee,
        };
        this.addSubscription(subParams, params.transactionId);
        this.logger.log('[addUserSubscription] subscription added');
        let extraData = {
          driverSubStatus: 1,
          driverSubAmount:
            packageDetails.finalPrice - (params?.promoCodeAmount || 0),
          driverSubscriptionId: packageDetails.id,
        };
        await this.captainRepository.update(
          { id: captain.id },
          { ...extraData },
        );
        this.logger.log('[addUserSubscription] driver subscription verified');
        return ResponseData.success(
          { id: captain.id },
          successMessage.VALID_CAPTAIN_STATUS,
        );
      } else {
        this.logger.log(
          '[addUserSubscription] driver already have subscription verified',
        );
        return ResponseData.success(
          { id: captain.id },
          successMessage.VALID_CAPTAIN_STATUS,
        );
      }
    } catch (err) {
      this.logger.error('[addUserSubscription] error > ' + JSON.stringify(err));
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async purchase(params: purchaseSubscriptionDto) {
    try {
      const captain: any = await this.validateCaptain(params.userId);
      if (captain.driverSubStatus === 0) {
        const upData = {
          driverSubStatus: 0,
        };
        let extraData;
        const respUserSubscription = await this.clientPaymentTCP
          .send(
            GET_USER_SUBSCRIPTION_DETAIL,
            JSON.stringify({
              userId: captain.externalId,
              status: SUBSCRIPTION_STATUS.ACTIVE,
            }),
          )
          .pipe()
          .toPromise();
        if (
          respUserSubscription &&
          respUserSubscription.statusCode === HttpStatus.OK
        ) {
          this.logger.log(
            '[purchase] subscription already exists' +
              JSON.stringify(respUserSubscription.data),
          );
        } else {
          // const subscriptionTransaction = await this.checkSubscriptionTransaction(
          //   userId,
          // );
          const subscriptionTransaction = await this.clientPaymentTCP
            .send(GET_SUBSCRIPTION_TRANSACTIONS, JSON.stringify(params.userId))
            .pipe()
            .toPromise();
          if (subscriptionTransaction.statusCode == HttpStatus.OK) {
            this.logger.error(
              '[purchase] error > Subscription transaction already exist',
            );
            return ResponseData.error(
              HttpStatus.NOT_FOUND,
              errorMessage.SUBSCRIPTION_TXN_ALREADY_EXIST,
            );
          } else {
            const subscriptionsInvoice = await this.getPackageInvoice(
              params.userId,
            );
            let promoCodeAmount = 0;
            if (subscriptionsInvoice.statusCode == HttpStatus.OK) {
              this.logger.log('[purchase] subscriptionsInvoice created');
              if (params?.promoCode) {
                this.logger.log('[purchase] validating promo code');

                const payload = {
                  promoCode: params.promoCode,
                  userId: params.userId,
                  amount: subscriptionsInvoice.data.finalPrice,
                  lat: captain.latitude,
                  long: captain.longitude,
                  applyingTo: applicableFor.driver,
                };
                const res = await this.promoCodesTcpClient
                  .send('apply_promo_code', JSON.stringify(payload))
                  .pipe()
                  .toPromise();
                this.logger.log(
                  '[purchase] promo service response:' + JSON.stringify(res),
                );
                if (res?.data?.valid) {
                  promoCodeAmount = res.data.amount;
                } else {
                  return ResponseData.error(
                    HttpStatus.BAD_REQUEST,
                    errorMessage.PROMO_CODE_NOT_VALID,
                  );
                }
              }
              const paymentPayload = {
                userId: params.userId,
                amount: subscriptionsInvoice.data.finalPrice,
                tax: subscriptionsInvoice.data.taxAmount,
                fee: subscriptionsInvoice.data.cardFee,
                promoCode: params?.promoCode,
                promoCodeAmount: promoCodeAmount,
                type: 2,
              };
              this.logger.log(
                '[purchase] CLICK_PAY_HOSTED payload:' +
                  JSON.stringify(paymentPayload),
              );
              const paymentURL = await this.clientPaymentTCP
                .send(CLICK_PAY_HOSTED, JSON.stringify({ ...paymentPayload }))
                .pipe()
                .toPromise();
              return paymentURL;
            }
          }
        }
      } else {
        this.logger.log('[purchase] driver already have subscription verified');
        return ResponseData.success(
          { id: captain.id },
          successMessage.VALID_CAPTAIN_STATUS,
        );
      }
    } catch (err) {
      this.logger.error('[purchase] error > ' + JSON.stringify(err));
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateSubsriptionPackage(params: updateSubscriptionPackageDto) {
    try {
      const { userId, subscriptionId } = params;
      const captain: any = await this.validateCaptain(userId);

      if (captain.driverSubStatus === 0) {
        await this.checkPackageDetails(subscriptionId);

        let data = {
          driverSubStatus: 0,
          driverSubscriptionId: subscriptionId,
        };

        await this.captainRepository.update({ id: captain.id }, { ...data });
        this.logger.log(
          '[updateSubsriptionPackage] driver subscription verified',
        );
        return ResponseData.success(
          { id: captain.id },
          successMessage.SUBSCRIPTION_PACKAGE_UPDATED,
        );
      } else throw new Error(errorMessage.CANCEL_EXISTING_SUBSCRIPTION);
    } catch (err) {
      this.logger.error(
        '[updateSubsriptionPackage] error > ' + JSON.stringify(err),
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async validateCaptain(userId: string) {
    try {
      let captain = await this.captainRepository.findOne({
        select: [
          'id',
          'approved',
          'driverSubscriptionId',
          'externalId',
          'driverSubStatus',
        ],
        where: { externalId: userId },
      });
      if (!captain) throw new Error(errorMessage.DRIVER_NOT_FOUND);

      this.logger.log('[validateCaptain] captain found');
      return captain;
    } catch (err) {
      this.logger.error('[validateCaptain] error > ' + JSON.stringify(err));
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  // async findAndUpdateDriverStatus() {
  //   try {
  //     let driverList = await this.captainRepository.find({
  //       select: ['id', 'externalId', 'driverNationalId'],
  //       where: {
  //         driverSubStatus: 1
  //       }
  //     });
  //     if (driverList) {
  //       driverList = driverList.filter(driver => {
  //         return driver.driverNationalId != ''
  //       })
  //       const inputIds = driverList.map(driver => driver.driverNationalId)
  //       if (inputIds.length) {
  //         this.logger.log(`[findAndUpdateDriverStatus] --- process started (${inputIds.length}) ----`)
  //         let notifyIds = []
  //         const waslResponse = await this.waslService.checkDriversEligibility(inputIds);
  //         if (waslResponse.statusCode !== HttpStatus.OK) {
  //           this.logger.error(`[findAndUpdateDriverStatus] WASL API error | ${waslResponse.message}`)
  //           throw new Error(waslResponse.message)
  //         }
  //         if (waslResponse.statusCode === HttpStatus.OK) {
  //           const responseIds = waslResponse.data.filter(resultRow => resultRow.driverEligibility == "VALID").map(respRow => respRow.identityNumber)
  //           const disableIds = inputIds.filter(id => !responseIds.includes(id))
  //           this.logger.log(`[findAndUpdateDriverStatus] --- disable list (${JSON.stringify(disableIds)}) ----`)
  //           if (disableIds.length) {
  //             this.captainRepository.update({
  //               driverNationalId: In(disableIds)
  //             }, { driverModeSwitch: false, approved: false })
  //             notifyIds = disableIds
  //           }
  //         } else if (waslResponse.data) {
  //           this.captainRepository.update({
  //             driverNationalId: In(inputIds)
  //           }, { driverModeSwitch: false, approved: false })
  //           notifyIds = inputIds
  //         }

  //         if (notifyIds?.length) {
  //           const notifyList = driverList.filter(driver => notifyIds.includes(driver.driverNationalId))
  //           const notifyUserIds = notifyList.map(driver => driver.externalId)
  //           const { data: usersData } = await this.tripTcpClient.send(GET_SELECTED_CUSTOMERS, JSON.stringify({ userIds: notifyUserIds })).pipe().toPromise();
  //           let captainUserList
  //           if (usersData && usersData.length > 0) {
  //             captainUserList = usersData;
  //           }
  //           try {
  //             const notifyTokens = captainUserList.map(driver => driver.deviceToken)
  //             const pushParams: any = {
  //               deviceToken: '',
  //               multiple: true,
  //               deviceTokenList: notifyTokens,
  //               templateCode: 'KYC_RENEWAL_TO_DRIVER',
  //               keyValues: {},
  //               extraParams: {
  //                 type: 'driver_kyc_renewal'
  //               }
  //             }
  //             this.logger.log(`[findAndUpdateDriverStatus] push notify to ${notifyTokens.length} drivers`);
  //             this.clientNotification.emit(SEND_PUSH_NOTIFICATION, JSON.stringify(pushParams));
  //           } catch (e) {
  //             this.logger.error(`[findAndUpdateDriverStatus] push notify error | ${e.message}`);
  //           }
  //         } else {
  //           this.logger.error(`[findAndUpdateDriverStatus] No response of invalid drivers`)
  //         }

  //         this.logger.log(`[findAndUpdateDriverStatus] --- process completed (${inputIds.length}) ----`)
  //       } else {
  //         this.logger.error(`[findAndUpdateDriverStatus] No drivers with driverNationalId`)
  //       }
  //     }
  //     return ResponseData.success({ success: true })
  //   } catch (err) {
  //     this.logger.error(`[findAndUpdateDriverStatus] error > ${JSON.stringify(err)}`)
  //     return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG)
  //   }
  // }

  async findAndNotifyWASLDriversWillExpired() {
    try {
      this.logger.log(
        `[findAndNotifyWASLDriversWillExpired] --- process started  ----`,
      );

      const currentDate = getIsoDate(new Date());

      this.logger.log(
        `[findAndNotifyWASLDriversWillExpired] currentDate: ${currentDate}`,
      );

      /*
        1) Notified count should be start with zero.
        2) At least one element should be present in an array.
      */
      const settingDefaultData = `
        [{"notifiedCount":0,"days":30},{"notifiedCount":1,"days":20},
        {"notifiedCount":2,"days":15},{"notifiedCount":3,"days":7},
        {"notifiedCount":4,"days":3},{"notifiedCount":5,"days":1}]
      `;

      const NOTIFY_ELIGIBILITY_EXPIRY_TIME_PERIODS = await this.redisHandler.getRedisKey(
        'SETTING_NOTIFY_ELIGIBILITY_EXPIRY_TIME_PERIODS',
      );
      if (!NOTIFY_ELIGIBILITY_EXPIRY_TIME_PERIODS) {
        this.logger.error(
          `[findAndNotifyWASLDriversWillExpired] redis :: NOTIFY_ELIGIBILITY_EXPIRY_TIME_PERIODS got null`,
        );
      }

      const timePeriodsData = JSON.parse(
        NOTIFY_ELIGIBILITY_EXPIRY_TIME_PERIODS || settingDefaultData,
      );

      this.logger.log(
        `[findAndNotifyWASLDriversWillExpired] timePeriodsData: ` +
          JSON.stringify(timePeriodsData),
      );

      // Prepares query string to find drivers whose eligibility will be expired in particular time periods
      let query = `
        SELECT id, externalId, driverNationalId, notifiedForEligibilityExpiry
        FROM captain
        WHERE driverSubStatus = 1 AND isWASLApproved = ${
          WASL_ELIGIBILITY_STATUS.VALID
        } AND (
          ( notifiedForEligibilityExpiry = ${Number(
            timePeriodsData[0].notifiedCount,
          )} AND eligibilityExpiryDate <= "${getIsoDate(
        new Date(addDays(new Date(), Number(timePeriodsData[0].days))),
      )}" AND eligibilityExpiryDate > "${currentDate}" )
      `;

      // Prepares query string from array's second element because first one is covered in above query string
      for (const timePeriod of timePeriodsData.slice(1)) {
        const notifiedCount = Number(timePeriod.notifiedCount);
        const expiryDateRange = getIsoDate(
          new Date(addDays(new Date(), Number(timePeriod.days))),
        );

        query += ` OR ( notifiedForEligibilityExpiry = ${notifiedCount} AND eligibilityExpiryDate <= "${expiryDateRange}" AND eligibilityExpiryDate > "${currentDate}" )`;
      }

      query += ');';

      const driverList = await getManager().query(query);
      this.logger.log(
        `[findAndNotifyWASLDriversWillExpired] drivers: ${driverList.length}`,
      );

      if (driverList.length) {
        const driverIds = driverList.map((driver) => driver.externalId);
        this.logger.log(
          `[findAndNotifyWASLDriversWillExpired] driverIds: ` +
            JSON.stringify(driverIds),
        );

        const { data: usersData } = await this.tripTcpClient
          .send(GET_SELECTED_CUSTOMERS, JSON.stringify({ userIds: driverIds }))
          .pipe()
          .toPromise();

        if (usersData && usersData.length) {
          for (const driver of driverList) {
            await this.captainRepository.update(
              {
                id: driver.id,
              },
              {
                notifiedForEligibilityExpiry:
                  driver.notifiedForEligibilityExpiry + 1,
              },
            );
          }

          for (const user of usersData) {
            const driver = driverList.find((i) => {
              return i.externalId === user.userId;
            });

            if (driver) {
              driver['deviceToken'] = user.deviceToken;
            }
          }

          this.logger.log(
            `[findAndNotifyWASLDriversWillExpired] Updated drivers: ` +
              JSON.stringify(driverList),
          );

          // As per specified setting data driver will be notified dynamically
          for (const timePeriod of timePeriodsData) {
            // Finds drivers' device token which are belong to given time period to send push notification
            const driversDeviceToken = driverList
              .filter((driver) => {
                return (
                  driver.notifiedForEligibilityExpiry ===
                  timePeriod.notifiedCount
                );
              })
              .map((driver) => driver.deviceToken);

            this.logger.log(
              `[findAndNotifyWASLDriversWillExpired] For time period: ${JSON.stringify(
                timePeriod,
              )} | driversDeviceToken: ` + JSON.stringify(driversDeviceToken),
            );

            if (driversDeviceToken.length) {
              try {
                const templateCode =
                  Number(timePeriod.days) === 1
                    ? 'NOTIFY_DRIVER_FOR_ELIGIBILITY_EXPIRY_A_DAY_BEFORE'
                    : 'NOTIFY_DRIVER_FOR_ELIGIBILITY_EXPIRY';
                const keyValues =
                  Number(timePeriod.days) === 1
                    ? {}
                    : { days: timePeriod.days };

                const pushParams: PushNotificationReqDto = {
                  deviceToken: '',
                  multiple: true,
                  deviceTokenList: driversDeviceToken,
                  templateCode,
                  keyValues,
                  extraParams: {},
                };

                this.logger.log(
                  `[findAndNotifyWASLDriversWillExpired] push notify to ${driversDeviceToken.length} drivers`,
                );
                this.clientNotification.emit(
                  SEND_PUSH_NOTIFICATION,
                  JSON.stringify(pushParams),
                );
              } catch (e) {
                this.logger.error(
                  `[findAndNotifyWASLDriversWillExpired] push notify error | ${e.message}`,
                );
              }
            }
          }
        }
      }

      this.logger.log(
        `[findAndNotifyWASLDriversWillExpired] --- process completed ----`,
      );
    } catch (e) {
      this.logger.error(
        `[findAndNotifyWASLDriversWillExpired] error > ${JSON.stringify(
          e.message,
        )}`,
      );
    }
  }

  async disapproveWASLExpiredDrivers() {
    try {
      this.logger.log(
        `[disapproveWASLExpiredDrivers] --- process started  ----`,
      );

      const currentDate = getIsoDate(new Date());

      this.logger.log(
        `[disapproveWASLExpiredDrivers] currentDate: ${currentDate}`,
      );

      // Finds drivers whose eligibility is expired
      const driverList = await this.captainRepository.find({
        select: ['id'],
        where: {
          driverSubStatus: 1,
          approved: true,
          isWASLApproved: WASL_ELIGIBILITY_STATUS.VALID,
          eligibilityExpiryDate: Raw((alias) => `${alias} < :currentDate`, {
            currentDate,
          }),
        },
      });

      this.logger.log(
        `[disapproveWASLExpiredDrivers] drivers: ${driverList.length}`,
      );

      if (driverList.length) {
        const driverIds = driverList.map((driver) => driver.id);
        this.logger.log(
          `[disapproveWASLExpiredDrivers] driverIds: ` +
            JSON.stringify(driverIds),
        );

        await this.captainRepository.update(
          {
            id: In(driverIds),
          },
          {
            approved: false,
            driverModeSwitch: false,
          },
        );

        // Updates admin dashboard stats as driver mode switched
        await this.notifyAdminDashboardAsDriverModeSwitched();
      }

      this.logger.log(
        `[disapproveWASLExpiredDrivers] --- process completed ----`,
      );
    } catch (e) {
      this.logger.error(
        `[disapproveWASLExpiredDrivers] error > ${JSON.stringify(e.message)}`,
      );
    }
  }

  async findAndNotifyDriversForWASLEligibility() {
    try {
      this.logger.log(
        `[findAndNotifyDriversForWASLEligibility] --- process started  ----`,
      );

      // Finds WASL unapproved drivers
      const driverList = await this.captainRepository.find({
        select: ['id', 'externalId', 'driverNationalId'],
        where: {
          isWASLApproved: WASL_ELIGIBILITY_STATUS.PENDING,
        },
      });

      this.logger.log(
        `[findAndNotifyDriversForWASLEligibility] drivers: ${driverList.length}`,
      );

      if (driverList.length) {
        const driverNationalIds = driverList.map(
          (driver) => driver.driverNationalId,
        );

        const driversEligibilityRes = await this.waslService.getAllDriversEligibility(
          driverNationalIds,
        );

        if (driversEligibilityRes.statusCode === HttpStatus.OK) {
          const eligibilityData = driversEligibilityRes?.data;

          if (eligibilityData && eligibilityData.length) {
            for (const data of eligibilityData) {
              const driver = driverList.find((i) => {
                return i.driverNationalId === data.identityNumber;
              });
              if (driver) {
                let rejectionReasons: string[] = [];
                data.vehicleEligibility = 'INVALID';
                if (Array.isArray(data?.rejectionReasons)) {
                  data?.rejectionReasons.forEach((x: string) => {
                    rejectionReasons.push(x);
                  });
                }
                if (data?.driverRejectionReason) {
                  rejectionReasons.push(data?.driverRejectionReason);
                }
                if (Array.isArray(data?.vehicles)) {
                  data?.vehicles.forEach((vehicle: any) => {
                    if (
                      WASL_ELIGIBILITY_STATUS[
                        String(vehicle?.vehicleEligibility)
                      ] === WASL_ELIGIBILITY_STATUS.VALID
                    ) {
                      data.vehicleEligibility = 'VALID';
                    }

                    if (
                      vehicle?.vehicleRejectionReason &&
                      !Array.isArray(vehicle?.vehicleRejectionReason)
                    )
                      rejectionReasons.push(vehicle?.vehicleRejectionReason);
                    else if (
                      vehicle?.vehicleRejectionReason &&
                      Array.isArray(vehicle?.vehicleRejectionReason)
                    ) {
                      vehicle?.vehicleRejectionReason.forEach((element) => {
                        rejectionReasons.push(element);
                      });
                    }
                  });
                }

                data.driverEligibility =
                  WASL_ELIGIBILITY_STATUS[String(data?.driverEligibility)] ===
                  WASL_ELIGIBILITY_STATUS.PENDING
                    ? data.driverEligibility
                    : WASL_ELIGIBILITY_STATUS[
                        String(data?.driverEligibility)
                      ] === WASL_ELIGIBILITY_STATUS.VALID &&
                      WASL_ELIGIBILITY_STATUS[
                        String(data?.vehicleEligibility)
                      ] === WASL_ELIGIBILITY_STATUS.VALID
                    ? data?.vehicleEligibility
                    : data?.driverEligibility
                    ? 'INVALID'
                    : null;

                driver['driverEligibility'] = data?.driverEligibility || null;
                driver['eligibilityExpiryDate'] =
                  data?.eligibilityExpiryDate || null;
                driver['WASLRejectionReasons'] =
                  rejectionReasons.length > 0
                    ? JSON.stringify(rejectionReasons)
                    : null;
                // driver['WASLRejectionReasons'] =
                //   (data?.rejectionReasons &&
                //     JSON.stringify(data.rejectionReasons)) ||
                //   (data?.driverRejectionReason &&
                //     JSON.stringify(data.driverRejectionReason)) ||
                //   null;
              }
            }

            const userIdOfDrivers = driverList.map(
              (driver) => driver.externalId,
            );

            const { data: usersData } = await this.tripTcpClient
              .send(
                GET_SELECTED_CUSTOMERS,
                JSON.stringify({ userIds: userIdOfDrivers }),
              )
              .pipe()
              .toPromise();

            if (usersData && usersData.length) {
              for (const user of usersData) {
                const driver = driverList.find((i) => {
                  return i.externalId === user.userId;
                });

                if (driver) {
                  driver['deviceToken'] = user.deviceToken;
                }
              }
            }

            const approvedDrivers = driverList.filter((driver) => {
              return (
                driver['driverEligibility'] &&
                WASL_ELIGIBILITY_STATUS[String(driver['driverEligibility'])] ===
                  WASL_ELIGIBILITY_STATUS.VALID
              );
            });

            this.logger.log(
              `[findAndNotifyDriversForWASLEligibility] approvedDrivers: ${approvedDrivers.length}`,
            );

            for (const approvedDriver of approvedDrivers) {
              await this.captainRepository.update(
                {
                  id: approvedDriver.id,
                },
                {
                  isWASLApproved: WASL_ELIGIBILITY_STATUS.VALID,
                  eligibilityExpiryDate: approvedDriver.eligibilityExpiryDate,
                },
              );
            }

            const rejectedDrivers = driverList.filter((driver) => {
              return (
                driver['driverEligibility'] &&
                WASL_ELIGIBILITY_STATUS[String(driver['driverEligibility'])] ===
                  WASL_ELIGIBILITY_STATUS.INVALID
              );
            });

            this.logger.log(
              `[findAndNotifyDriversForWASLEligibility] rejectedDrivers: ${rejectedDrivers.length}`,
            );

            for (const rejectedDriver of rejectedDrivers) {
              await this.captainRepository.update(
                {
                  id: rejectedDriver.id,
                },
                {
                  isWASLApproved: WASL_ELIGIBILITY_STATUS.INVALID,
                  WASLRejectionReasons: rejectedDriver.WASLRejectionReasons,
                },
              );
            }

            if (approvedDrivers.length) {
              const driversDeviceToken = approvedDrivers.map(
                (driver) => driver['deviceToken'],
              );

              const pushParams: PushNotificationReqDto = {
                deviceToken: '',
                multiple: true,
                deviceTokenList: driversDeviceToken,
                templateCode: 'NOTIFY_DRIVER_FOR_WASL_APPROVAL',
                keyValues: {},
                extraParams: {},
              };

              this.logger.log(
                `[findAndNotifyDriversForWASLEligibility] push notify to ${driversDeviceToken.length} approved drivers`,
              );
              await this.sendPushNotificationToDrivers(pushParams);
            }

            if (rejectedDrivers.length) {
              for (const rejectedDriver of rejectedDrivers) {
                const deviceToken = rejectedDriver['deviceToken'];

                if (deviceToken) {
                  const rejectionReasons = rejectedDriver.WASLRejectionReasons
                    ? getStringValueFromJSON(
                        rejectedDriver.WASLRejectionReasons,
                      )
                    : '';

                  const pushParams: PushNotificationReqDto = {
                    deviceToken,
                    multiple: true,
                    deviceTokenList: deviceToken,
                    templateCode: 'NOTIFY_DRIVER_FOR_WASL_REJECTION',
                    keyValues: { rejectionReasons },
                    extraParams: {},
                  };

                  this.logger.log(
                    `[findAndNotifyDriversForWASLEligibility] push notify to rejected driver`,
                  );
                  await this.sendPushNotificationToDrivers(
                    pushParams,
                    rejectedDriver,
                  );
                }
              }
            }
          }
        } else {
          this.logger.error(
            `[findAndNotifyDriversForWASLEligibility] WASL eligibility check API has error: ` +
              JSON.stringify(driversEligibilityRes),
          );
        }
      }

      this.logger.log(
        `[findAndNotifyDriversForWASLEligibility] --- process completed ----`,
      );
    } catch (e) {
      this.logger.error(
        `[findAndNotifyDriversForWASLEligibility] error > ${JSON.stringify(
          e.message,
        )}`,
      );
    }
  }

  async sendPushNotificationToDrivers(
    params: PushNotificationReqDto,
    driver?: CaptainEntity,
  ) {
    const notificationParams = {
      deviceToken: params.deviceToken || '',
      multiple: params.multiple || false,
      deviceTokenList: params.deviceTokenList || [],
      templateCode: params.templateCode,
      keyValues: params.keyValues || {},
      extraParams: params.extraParams || {},
      externalId: driver?.externalId,
    };

    const customerDetail = await this.tripTcpClient
      .send(
        GET_CUSTOMER_DETAIL,
        JSON.stringify({
          userId: driver?.externalId,
          data: { isReviewDetail: false },
        }),
      )
      .pipe()
      .toPromise();

    const otherDetailsJSON = customerDetail?.data?.otherDetails;

    const captainName =
      customerDetail?.prefferedLanguage === 'AR'
        ? otherDetailsJSON?.arabicFullName
        : otherDetailsJSON?.EnglishName;

    const smsParams: any = {
      externalId: driver?.externalId,
      language: customerDetail?.data.prefferedLanguage,
      mobileNo: customerDetail?.data.mobileNo,
      templateCode: params.templateCode,
      keyValues: {
        captainName: captainName,
      },
    };

    await this.clientNotification.emit(
      SEND_PUSH_NOTIFICATION,
      JSON.stringify(notificationParams),
    );

    await this.clientNotification.emit(
      SEND_SMS_NOTIFICATION,
      JSON.stringify(smsParams),
    );
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

  async getTripsDashboardStats(params: any) {
    return await this.tripTcpClient
      .send(DASHBOARD_STATS, JSON.stringify(params))
      .pipe()
      .toPromise();
  }

  // Updates admin dashboard stats as driver mode switched
  async notifyAdminDashboardAsDriverModeSwitched() {
    try {
      this.logger.log(`[notifyAdminDashboardAsDriverModeSwitched] Inside`);

      const activeDriverStatsRes = await this.getActiveDriverStats();

      await this.emitToAdminDashboardViaSocket(CAPTAIN_DRIVER_MODE_SWITCHED, {
        activeDrivers: activeDriverStatsRes?.data || {},
      });

      const topStatsRes = await this.getTripsDashboardStats({ type: 'day' });

      await this.emitToAdminDashboardViaSocket(CAPTAIN_DRIVER_MODE_SWITCHED, {
        topStats: topStatsRes?.data || {},
      });
    } catch (e) {
      this.logger.error(
        `[notifyAdminDashboardAsDriverModeSwitched] error > ${JSON.stringify(
          e.message,
        )}`,
      );
    }
  }

  // Updates admin dashboard stats as driver ride status switched
  async notifyAdminDashboardAsDriverRideStatusSwitched() {
    try {
      this.logger.log(
        `[notifyAdminDashboardAsDriverRideStatusSwitched] Inside`,
      );

      const activeDriverStatsRes = await this.getActiveDriverStats();

      await this.emitToAdminDashboardViaSocket(CAPTAIN_RIDE_STATUS_SWITCHED, {
        activeDrivers: activeDriverStatsRes?.data || {},
      });

      const topStatsRes = await this.getTripsDashboardStats({ type: 'day' });

      await this.emitToAdminDashboardViaSocket(CAPTAIN_RIDE_STATUS_SWITCHED, {
        topStats: topStatsRes?.data || {},
      });
    } catch (e) {
      this.logger.error(
        `[notifyAdminDashboardAsDriverRideStatusSwitched] error > ${JSON.stringify(
          e.message,
        )}`,
      );
    }
  }
  //add or update iban
  async validateIban(param: { iban: string; externalId: string }) {
    try {
      this.logger.log(
        `kafka::notifications::${VALIDATE_IBAN}::send -> ${JSON.stringify({
          param,
        })}`,
      );
      const validateIban = await this.clientPaymentTCP
        .send(CREATE_IBAN, JSON.stringify({ param }))
        .pipe()
        .toPromise();

      if (validateIban.statusCode == HttpStatus.OK) {
        await this.captainRepository.update(
          { externalId: param.externalId },
          { iban: param.iban },
        );
        validateIban.data.iban = param.iban;
      }
      return validateIban;
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_GATEWAY,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getIban(param: { iban: string; externalId: string }) {
    try {
      this.logger.log(
        `kafka::notifications::${GET_IBAN}::send -> ${JSON.stringify({
          param,
        })}`,
      );
      const captain: any = await this.captainRepository
        .createQueryBuilder('captain')
        .select(['captain.iban'])
        .where({ externalId: param.externalId })
        .getOne();

      // console.log(captain);
      if (captain && captain.iban != null) {
        param.iban = captain.iban;
        return this.validateIban(param);
      } else {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.NO_DATA_FOUND,
        );
      }
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_GATEWAY,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // Updates admin dashboard stats as new captain created
  async notifyAdminDashboardAsCaptainCreated() {
    try {
      this.logger.log(`[notifyAdminDashboardAsCaptainCreated] Inside`);

      const activeDriverStatsRes = await this.getActiveDriverStats();

      await this.emitToAdminDashboardViaSocket(NEW_CAPTAIN_CREATED, {
        activeDrivers: activeDriverStatsRes?.data || {},
      });
    } catch (e) {
      this.logger.error(
        `[notifyAdminDashboardAsCaptainCreated] error > ${JSON.stringify(
          e.message,
        )}`,
      );
    }
  }

  async getTaxPercentage() {
    return (
      (await this.redisHandler.getRedisKey('SETTING_TRIP_TAX_PERCENTAGE')) || 0
    );
  }
  async getCardFee() {
    return (await this.redisHandler.getRedisKey('SETTING_VISA_CARD_FEE')) || 0;
  }

  async waslApprovedCount() {
    try {
      const [
        approvedItems,
        approved,
      ] = await this.captainRepository.findAndCount({
        select: ['id'],
        where: {
          isWASLApproved: WASL_ELIGIBILITY_STATUS.VALID,
        },
      });
      const [pendingItems, pending] = await this.captainRepository.findAndCount(
        {
          select: ['id'],
          where: {
            isWASLApproved: WASL_ELIGIBILITY_STATUS.PENDING,
          },
        },
      );
      const [
        rejectedItems,
        rejected,
      ] = await this.captainRepository.findAndCount({
        select: ['id'],
        where: {
          isWASLApproved: WASL_ELIGIBILITY_STATUS.INVALID,
        },
      });

      const total = approved + pending + rejected;
      return ResponseData.success({
        total: total,
        approved: approved, // Math.floor((approved / total) * 100),
        pending: pending, // Math.floor((pending / total) * 100),
        rejected: rejected, // Math.floor((rejected / total) * 100),
      });
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async updateCabsId({ model, cabId }) {
    try {
      this.logger.log(`updateCabsId model: ${model} , cabId : ${cabId}`);
      const sequenceNumbers = await this.carInfoService.getCarSequenceNo(model);
      if (sequenceNumbers.statusCode == HttpStatus.OK) {
        this.logger.log(`updateCabsId sequenceNumbers:`);
        await this.captainRepository
          .createQueryBuilder('captain')
          .update('captain')
          .set({ cab: cabId })
          .where('captain.carSequenceNo IN (:...carSequenceNo) ', {
            carSequenceNo: sequenceNumbers?.data,
          })
          .execute();
      }
    } catch (err) {
      this.logger.error(`updateCabsId catch error :  ${err?.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async findCabCaptainsDistance(lat: number, lng: number) {
    try {
      const radius =
        (await this.redisHandler.getRedisKey(
          'SETTING_TRIP_DRIVER_SEARCH_RADIUS',
        )) || 5;

      this.logger.log(
        `SETTING_TRIP_DRIVER_SEARCH_RADIUS range in km: ${radius}`,
      );

      const captainData = await this.captainRepository
        .createQueryBuilder()
        .select(['DISTINCT cabId as cabId', 'latitude', 'longitude'])
        // .addSelect([])
        // .distinctOn(['cabId'])
        .addSelect([
          'GeoDistMiles(' +
            lat +
            ',' +
            lng +
            ",latitude,longitude,'km') AS distance",
        ])
        .where('latitude IS NOT NULL')
        .andWhere('longitude IS NOT NULL')
        .andWhere('driverModeSwitch = 1')
        .andWhere('driverRideStatus = 0')
        .andWhere('driverSubStatus = 1')
        .andWhere('cabId IS NOT NULL')
        .andWhere('iban IS NOT NULL')
        // .groupBy('cabId')
        .having('distance <= :radius', {
          radius: radius,
        })
        .orderBy('distance', 'DESC')
        .getRawMany();

      const uniqueCabIds = [
        ...new Map(captainData.map((item) => [item['cabId'], item])).values(),
      ];
      // log results
      // this.logger.result(`findCabCaptainsDistance -> result -> ${`);
      // console.log(captainData);

      //omit distance key:value

      //TODO (OSRM) OR OTHER ALGHORITIM
      // |||| JUST FOR PRESENT A KEY ||||
      uniqueCabIds.map(
        (o) => (o.time = `${Math.round(o.distance * 1.7)} mins`),
      ); //`${this.getRandomInt(15)} mins`));

      //add google time param.
      // const origin = { lat, lng };
      // await Promise.all(
      //   captainData.map(async (o) => {
      //     const lat = Number(o.latitude);
      //     const lng = Number(o.longitude);
      //     const destination = { lat, lng };
      //     const timeRes = await calculateFareDistance(origin, destination);
      //     o.time = timeRes.formattedTime;
      //     // return o;
      //   }),
      // );
      console.log('-------end-----------');
      //return response
      return ResponseData.success(uniqueCabIds);
    } catch (err) {
      console.log(
        '_________Error___________findCabCaptainsDistance___________________',
      );
      this.logger.error(`getAllCaptainHZD -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

   async updateDriverOnlineStatus(param: {
    userId: string;
    clientId: string;
    status: number;
  }) {
    try {
      this.logger.log(`updateDriverOnlineStatus -> params -> ${JSON.stringify(param)}`);
      if (param.status == 0) {
        this.captainRepository.update(
          { externalId: param.userId },
          { isOnline: false },
        );
      } else if (param.status == 1) {
        this.captainRepository.update(
          { externalId: param.userId },
          { isOnline: true },
        );
      }
    } catch (err) {}
  }

  getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  calcCrow(lat1, lon1, lat2, lon2): number {
    const R = 6371; // km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    lat1 = this.toRad(lat1);
    lat2 = this.toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  // Converts numeric degrees to radians
  toRad(v: any) {
    return (v * Math.PI) / 180;
  }
}

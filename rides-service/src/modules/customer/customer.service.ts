import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { errorMessage } from 'src/constants/errorMessage';
import { ResponseData } from 'src/helpers/responseHandler';
import {
  reviewsKafkaConfig,
  notificationKafkaConfig,
  reviewsTCPConfig,
  tripTCPMicroServiceConfig,
} from 'src/microServicesConfigs';
import {
  GET_RATING_COUNTS_BY_EXTERNAL,
  GET_META_REVIEW_BY_EXTERNAL,
  GET_META_REVIEWS,
  GET_REVIEWS,
  SEND_SMS_NOTIFICATION,
} from '../trips/constants/kafka-constants';
import {
  FindOneInterface,
  ConditionsInterface,
  ListSearchSortDto,
  UpdateLocationInfo,
} from './customer.interface';
import { StatsParams } from '../trips/interface/trips.interface';

import { TripsRepository } from '../trips/trips.repository';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto, UpdatePictureDto } from './dto/update-customer.dto';
import { CreateOtpDto, VerifyOtpDto } from './dto/otp.dto';

import { TripStatus, TripType } from '../trips/trips.enum';
import { AddressType } from '../trip_address/trip_address.enum';
import {
  ReviewExternalType,
  UserExternalType,
} from '../trips/enums/driver.enum';
import {
  RiderTripHistorySort,
  RiderTripScheduledSort,
  RiderListSort,
  OtpLogsListSortEnum,
} from './customer.enum';

import { addDays, addMonths, getIsoDateTime } from 'src/utils/get-timestamp';
import { getTripNumber, setTripNumber } from 'src/utils/generate-trn';
import {
  HIGH_DEMAND_ZONE_TIME_LIMIT_MINUTES,
  RIDER_SEARCH_LIMIT_FOR_ADMIN,
} from './constants/customer.constants';
import {
  EMIT_TO_ADMIN_DASHBOARD,
  DASHBOARD_STATS,
  DASHBOARD_ACTIVE_RIDERS,
} from './constants/kafka-constants';
import {
  NEW_CUSTOMER_CREATED,
  CUSTOMER_IS_RIDER_STATUS_SWITCHED,
} from './constants/socket-constant';

import { LoggerHandler } from 'src/helpers/logger.handler';
import {
  getDateBounds,
  getDateOfWeek,
  getDateRange,
  getGraphLabel,
  getPastTime,
} from 'src/helpers/date-functions';
// import { ReviewsService } from '../reviews/reviews.service';

import { getOTP } from 'src/utils/generate-otp';
import { getAmountFormatted } from 'src/helpers/amount-formatter';
import { successMessage } from 'src/constants/successMessage';
import { CustomerLocationsRepository } from './customerlocations.repository';
import { json } from 'express';
import { RestoreRequest } from '@aws-sdk/client-s3';
import { CustomerAppUsage } from './entities/customer_app_usage.entity';
import { stat } from 'fs';
import { RedisHandler } from 'src/helpers/redis-handler';
import { EARNING_DURATION } from 'src/enem/all.enem';
import { CustomerAPPUsageRepository } from './repositories/appUsage.repository';
import { TimeUsageDto } from './dto/time-usage.dto';
import { count } from 'console';
import { cursorTo } from 'readline';
import { SUBSCRIPTION_DETAILS_FROM_USERID } from './kafka-constants';
import appConfig from 'config/appConfig';
import axios from 'axios';

@Injectable()
export class CustomerService {
  private customLogger = new LoggerHandler(CustomerService.name).getInstance();

  constructor(
    @InjectRepository(CustomerRepository)
    private customerRepository: CustomerRepository,
    @InjectRepository(TripsRepository)
    private tripsRepository: TripsRepository,

    @InjectRepository(CustomerLocationsRepository)
    private customerLocationsRepository: CustomerLocationsRepository,

    @InjectRepository(CustomerAppUsage)
    private customerAppUsage: Repository<CustomerAppUsage>,

    //made by mujtaba for time calculate
    @InjectRepository(CustomerAPPUsageRepository)
    private customerAPPUsageRepository: CustomerAPPUsageRepository,

    @Inject('CLIENT_REVIEW_SERVICE_TCP') private clientReviewTCP: ClientProxy,
    @Inject('CLIENT_NOTIFY_SERVICE_KAFKA')
    private clientNotification: ClientKafka,
    @Inject('CLIENT_SOCKET_SERVICE_KAFKA') private socketGateway: ClientKafka, // private reviewService: ReviewsService // private customLogger: CustomLogger
    private redisHandler: RedisHandler,
  ) {
    // this.customLogger.setContext(CustomerService.name);
  }

  private logger = new Logger(CustomerService.name);

  @Client(tripTCPMicroServiceConfig)
  clientTripTCP: ClientProxy;

  // @Client({
  //   ...reviewsKafkaConfig,
  //   options:
  //   {
  //     ...reviewsKafkaConfig.options,
  //     consumer: {
  //       groupId: "reviews-consumer-ts-customer"
  //     }
  //   }
  // })
  // clientReviewKafka: ClientKafka

  // @Client(notificationKafkaConfig)
  // clientNotification: ClientKafka;

  onModuleInit() {
    // this.clientReviewKafka.subscribeToResponseOf(GET_RATING_COUNTS_BY_EXTERNAL);
    // this.clientReviewKafka.subscribeToResponseOf(GET_META_REVIEW_BY_EXTERNAL);
    // this.clientReviewKafka.subscribeToResponseOf(GET_META_REVIEWS);
    // this.clientReviewKafka.subscribeToResponseOf(GET_REVIEWS);
  }

  async updatePicture(params: UpdatePictureDto) {
    try {
      const { userId, profileImage } = params;
      // const recordDetail = await this.findRecord(id);
      // if (recordDetail.statusCode != HttpStatus.OK) {
      //   this.logger.error('[updatePicture] Admin not found id : ' + id)
      //   return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.DETAILS_NOT_FOUND);
      // }
      const response = await this.customerRepository
        .createQueryBuilder('customer')
        .select('customer.id')
        .where({ userId: userId })
        .getOne();
      if (!response.id) {
        this.logger.error('[updatePicture] Admin not found id : ' + userId);
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.CUSTOMER.CUSTOMER_NOT_FOUND,
        );
      }
      let upFields = {
        profileImage: profileImage,
      };
      await this.customerRepository.update(response?.id, upFields);
      // const adminRow = {...recordDetail.data, ...upFields};
      // if (adminRow.profileImage) {
      //   adminRow.profileImageUrl = await this.awsS3Service.getAdminImage({ name: adminRow.profileImage });
      // } else {
      //   adminRow.profileImageUrl = null
      // }
      this.logger.log('[updatePicture] updated successfully');
      return ResponseData.success(HttpStatus.OK, upFields);
    } catch (err) {
      this.logger.error('[updatePicture] error ' + JSON.stringify(err.message));
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async createCustomer(createCustomerDto: CreateCustomerDto) {
    try {
      //Muzz start

      this.customLogger.log(
        `[createCustomer] [findOne] | userId: ${JSON.stringify(
          createCustomerDto,
        )}`,
      );
      const user = await this.findOne({
        userId: createCustomerDto?.userId,
        mobileNo: createCustomerDto?.mobileNo,
      });
      if (user.statusCode != HttpStatus.NOT_FOUND) {
        return user;
      }

      //end
      this.customLogger.start(
        `[createCustomer] | userId: ${createCustomerDto.userId}`,
      );
      if (createCustomerDto.otherDetails) {
        const otherDetails = JSON.parse(createCustomerDto.otherDetails);
        if (typeof otherDetails === 'object' && otherDetails !== null) {
          const { ArabicFirstName, ArabicFamilyName } = otherDetails;
          createCustomerDto.arabicFirstName = ArabicFirstName;
          createCustomerDto.arabicLastName = ArabicFamilyName;
        }
      }
      const customer = this.customerRepository.create(createCustomerDto);
      const customerCreateRes = await this.customerRepository.save(customer);
      this.logger.log(`create -> customer created. id: ${customer.id}`);

      // Updates admin dashboard stats as new customer created
      await this.notifyAdminDashboardAsCustomerCreated();

      return ResponseData.success(HttpStatus.CREATED, { ...customerCreateRes });
    } catch (err) {
      this.logger.error(`create -> error: ${JSON.stringify(err.message)}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateCustomer(id: string, updateCustomerDto: UpdateCustomerDto) {
    try {
      const data = await this.customerRepository.update(id, updateCustomerDto);
      this.logger.log(`update -> customer updated. id: ${id}`);

      if ('isRider' in updateCustomerDto) {
        // Updates admin dashboard stats as customer isRider status changed
        await this.notifyAdminDashboardAsCustomerIsRiderStatusSwitched();
      }

      return await this.findOne({ id: id });
      // return ResponseData.success(HttpStatus.OK, {});
    } catch (err) {
      this.logger.error(`update -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async riderKycStatus(userId: string) {
    try {
      const fields = [
        'customer.kycStatus',
        'customer.totalRides',
        'customer.isKycRequired',
      ];
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select(fields);
      riderQryInstance.where({ userId: userId });
      const customer = await riderQryInstance.getOne();
      if (customer) {
        //TODO from admin dashboard
        this.logger.log(`${JSON.stringify(customer)}`);
        const SETTING_RIDER_TRIPS_LIMIT_WITHOUT_KYC = parseInt(
          await this.redisHandler.getRedisKey(
            'SETTING_RIDER_TRIPS_LIMIT_WITHOUT_KYC',
          ),
        );
        const ridesLimitsWithoutKyc =
          SETTING_RIDER_TRIPS_LIMIT_WITHOUT_KYC || 3;
        if (
          (Number(customer.isKycRequired) == 1 ||
            ridesLimitsWithoutKyc <= Number(customer.totalRides)) &&
          Number(customer.kycStatus) != 1
        )
          return ResponseData.success(HttpStatus.OK, { isKycRequired: true });
        else
          return ResponseData.success(HttpStatus.OK, { isKycRequired: false });
      } else
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.SOMETHING_WENT_WRONG,
        );
    } catch (err) {
      this.logger.error(`riderKycStatus -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async kycInitiate(userId: string) {
    try {
      const fields = ['customer.kycStatus', 'customer.totalRides'];

      if (userId == 'all') {
        await this.customerRepository.update(
          { isKycRequired: 0 },
          { isKycRequired: 1 },
        );
        return ResponseData.success(HttpStatus.OK, {});
      }
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select(fields);
      riderQryInstance.where({ userId: userId });
      const customer = await riderQryInstance.getOne();
      if (customer) {
        await this.customerRepository.update(
          { userId: Number(userId) },
          { isKycRequired: 1 },
        );
        return ResponseData.success(HttpStatus.OK, { isKycRequired: true });
      } else
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.SOMETHING_WENT_WRONG,
        );
    } catch (err) {
      this.logger.error(`riderKycStatus -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async lastUserId(start, end) {
    try {
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select('MAX(`userId`) as userId');
      riderQryInstance.where('userId > :start and userId < :end', {
        start,
        end,
      });
      const customer = await riderQryInstance.getRawOne();

      if (customer?.userId) {
        this.logger.log(
          `[lastUserId] last customer id : ${JSON.stringify(customer)}`,
        );
        return customer.userId;
      } else {
        const riderQryInstance = this.customerRepository.createQueryBuilder(
          'customer',
        );
        riderQryInstance.select('customer.userId');
        riderQryInstance.where('userId = :start', {
          start,
        });
        const customer = await riderQryInstance.getOne();
        if (!customer) {
          this.logger.log(
            `[lastUserId] first customer of this type useId: ${start}`,
          );
          return start;
        } else false;
      }
    } catch (err) {
      return false;
    }
  }
  async findOne(params: FindOneInterface, conditions?: ConditionsInterface) {
    try {
      this.logger.log(`findOne -> params -> ${JSON.stringify(params)}`);
      this.logger.log(`findOne -> conditions -> ${JSON.stringify(conditions)}`);
      const {
        isReviewDetail = false,
        isRatingDetail = false,
        externalType = ReviewExternalType.Rider,
      } = conditions || {};
      const fields = [
        'customer.id',
        'customer.userId',
        'customer.idNumber',
        'customer.createdAt',
        'customer.updatedAt',
        'customer.firstName',
        'customer.lastName',
        'customer.emailId',
        'customer.mobileNo',
        'customer.profileImage',
        'customer.dateOfBirth',
        'customer.gender',
        'customer.activationDate',
        'customer.creationDate',
        'customer.modificationDate',
        'customer.deviceToken',
        'customer.clientOs',
        'customer.prefferedLanguage',
        'customer.address1',
        'customer.address2',
        'customer.userType',
        'customer.userStatus',
        'customer.driverId',
        'customer.totalRides',
        'customer.totalTrips',
        'customer.upcomingRides',
        'customer.ridesCancelled',
        'customer.tripsCancelled',
        'customer.tripsDeclined',
        'customer.totalEarned',
        'customer.totalSpent',
        'customer.latitude',
        'customer.longitude',
        'customer.isRider',
        'customer.arabicFirstName',
        'customer.arabicLastName',
        'customer.additionalInfo',
        'customer.otherDetails',
        'customer.kycStatus',
        'customer.isKycRequired',
      ];
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select(fields);
      riderQryInstance.where(params);
      const customer = await riderQryInstance.getOne();
      if (!customer) {
        this.logger.error(
          `findOne -> error -> ${errorMessage.CUSTOMER.CUSTOMER_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.CUSTOMER.CUSTOMER_NOT_FOUND,
        );
      }

      //TODO OPTIMIZATION IN CONDTIONS
      if (
        customer.idNumber != 0 &&
        customer.idNumber != null &&
        (customer.otherDetails == null ||
          !JSON.parse(customer.otherDetails)?.gosi ||
          !JSON.parse(customer.otherDetails)?.govt) &&
        customer.dateOfBirth != null
      ) {
        this.logger.log(
          `[findOne] dakhli info not found idNumber: ${customer.idNumber}`,
        );
        const userKycInfo = JSON.parse(customer.additionalInfo);
        const gosi = await this.dakhliGosi(customer.idNumber);
        const govt = await this.dakhliGovt(
          customer.idNumber,
          userKycInfo?.CitizenDLInfo?.dateOfBirthH?._text,
        );
        const dakhliInfo = {
          gosi: gosi?.data,
          govt: govt?.data,
        };
        this.logger.log(
          `[findOne] dakhli info fetched for idNumber: ${
            customer.idNumber
          } dakhkliInfo : ${JSON.stringify(dakhliInfo)}`,
        );
        customer.otherDetails = JSON.stringify(dakhliInfo);
        this.customerRepository.update(
          { id: customer.id },
          {
            otherDetails: JSON.stringify(dakhliInfo),
          },
        );
      }
      // if (customer['creationDate']) {
      //   customer['creationDate'] = getIsoDateTime(new Date(Number(customer['creationDate'])));
      // }
      // if (customer['activationDate']) {
      //   customer['activationDate'] = getIsoDateTime(new Date(Number(customer['activationDate'])));
      // }
      // if (customer['modificationDate']) {
      //   customer['modificationDate'] = getIsoDateTime(new Date(Number(customer['modificationDate'])));
      // }
      customer['fullName'] = `${customer['firstName']} ${customer['lastName']}`;
      customer['arabicFullName'] = customer.arabicFirstName
        ? `${customer['arabicFirstName']} ${customer['arabicLastName']}`
        : '';

      // Review Details
      if (isReviewDetail) {
        this.logger.log(
          `findOne -> request review detail -> ${JSON.stringify({
            externalId: customer.userId,
            externalType,
          })}`,
        );
        const { data: customerReview } = await this.clientReviewTCP
          .send(
            GET_META_REVIEW_BY_EXTERNAL,
            JSON.stringify({ externalId: customer.userId, externalType }),
          )
          .pipe()
          .toPromise();
        this.logger.log(
          `findOne -> response review detail -> ${JSON.stringify({
            externalId: customer.userId,
            externalType,
          })}`,
        );
        // // const { data: customerReview } = await this.reviewService.getMetaReviewByExternal({ externalId: customer.userId, externalType })
        customer['overallRating'] = customerReview?.overallRating || 0;
        customer['overallReviews'] = customerReview?.overallReviews || 0;
      }
      // Rating Details
      if (isRatingDetail && customer.totalSpent > 0) {
        this.logger.log(
          `findOne -> request rating detail -> ${JSON.stringify({
            externalId: customer.userId,
            externalType: ReviewExternalType.Captain,
          })}`,
        );
        const { data: recivedRatings } = await this.clientReviewTCP
          .send(
            GET_RATING_COUNTS_BY_EXTERNAL,
            JSON.stringify({
              externalId: customer.userId,
              externalType: ReviewExternalType.Captain,
            }),
          )
          .pipe()
          .toPromise();
        this.logger.log(
          `findOne -> response rating detail -> ${JSON.stringify({
            externalId: customer.userId,
            externalType: ReviewExternalType.Captain,
          })}`,
        );
        // // const { data: recivedRatings } = await this.reviewService.getRatingCountsByExternal({ externalId: customer.userId, externalType: ReviewExternalType.Captain })
        const customerRatings = {
          '1': Number(recivedRatings[0]?.star_1 || 0),
          '2': Number(recivedRatings[0]?.star_2 || 0),
          '3': Number(recivedRatings[0]?.star_3 || 0),
          '4': Number(recivedRatings[0]?.star_4 || 0),
          '5': Number(recivedRatings[0]?.star_5 || 0),
        };
        customer['ratingCounts'] = customerRatings || {};
      }

      this.customLogger.end(`[findOne] | params: ${JSON.stringify(params)}`);
      return ResponseData.success(HttpStatus.OK, customer);
    } catch (err) {
      this.logger.error(`findOne -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findByIdList(
    listIds: { userIdList: number[]; driverIdList?: string[] },
    conditions?,
  ) {
    try {
      const { userIdList, driverIdList } = listIds;
      this.logger.log(
        `findByUserIds -> userIdList -> ${JSON.stringify(userIdList)}`,
      );
      this.logger.log(
        `findByUserIds -> driverIdList -> ${JSON.stringify(driverIdList)}`,
      );
      this.logger.log(
        `findByUserIds -> conditions -> ${JSON.stringify(conditions)}`,
      );
      const { isReviewDetail = false } = conditions || {}; // WARNING: need to check why review service getting hang if enable this in dev server
      // const isReviewDetail = false
      const fields = [
        'customer.id',
        'customer.userId',
        'customer.firstName',
        'customer.lastName',
        'customer.emailId',
        'customer.mobileNo',
        'customer.profileImage',
        'customer.dateOfBirth',
        'customer.gender',
        'customer.activationDate',
        'customer.creationDate',
        'customer.modificationDate',
        'customer.deviceToken',
        'customer.clientOs',
        'customer.prefferedLanguage',
        'customer.address1',
        'customer.address2',
        'customer.userType',
        'customer.userStatus',
        'customer.driverId',
        'customer.totalRides',
        'customer.totalTrips',
        'customer.upcomingRides',
        'customer.ridesCancelled',
        'customer.tripsCancelled',
        'customer.tripsDeclined',
        'customer.totalEarned',
        'customer.totalSpent',
        'customer.latitude',
        'customer.longitude',
        'customer.isRider',
        'customer.arabicFirstName',
        'customer.arabicLastName',
        'customer.idNumber',
        'customer.createdAt',
      ];
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select(fields);
      riderQryInstance.where('customer.userId IN (:...userIdList)', {
        userIdList,
      });
      if (driverIdList?.length) {
        riderQryInstance.orWhere('customer.driverId IN (:...driverIdList)', {
          driverIdList,
        });
      }
      const customerList = await riderQryInstance.getMany();
      if (!customerList) {
        this.logger.error(
          `findByUserIds -> error -> ${errorMessage.CUSTOMER.CUSTOMER_NOT_FOUND}`,
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.CUSTOMER.CUSTOMER_NOT_FOUND,
        );
      }
      let reviewParams,
        reviewListArr = [];
      if (isReviewDetail) {
        this.logger.log(
          `findByUserIds -> review requests check -> ${customerList.length}`,
        );
        let reviewList = customerList.map((customer) => {
          reviewParams = {
            externalId: customer.userId,
            externalType:
              customer.userType == 2
                ? ReviewExternalType.Captain
                : ReviewExternalType.Rider,
          };
          return this.clientReviewTCP
            .send(GET_META_REVIEW_BY_EXTERNAL, JSON.stringify(reviewParams))
            .pipe()
            .toPromise();
        });
        this.logger.log(
          `findByUserIds -> review requests start -> ${reviewList.length}`,
        );
        reviewListArr = await Promise.all(reviewList).then((values) =>
          values.map((value: any) => {
            return { overallRating: value?.data?.overallRating };
          }),
        );
        this.logger.log(
          `findByUserIds -> review requests end -> ${reviewListArr.length}`,
        );
      }
      const retCustomerList = customerList.map((customer, indx) => {
        return {
          ...customer,
          fullName: `${customer['firstName']} ${customer['lastName']}`,
          arabicFullName: customer.arabicFirstName
            ? `${customer['arabicFirstName']} ${customer['arabicLastName']}`
            : '',
          overallRating: reviewListArr[indx]?.overallRating ?? 0,
        };
      });
      this.logger.log(
        `findByUserIds -> customerList results -> ${retCustomerList.length}`,
      );
      return ResponseData.success(HttpStatus.OK, retCustomerList);
    } catch (err) {
      this.logger.error(`findByUserIds -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAll(params: ListSearchSortDto, conditions?: ConditionsInterface) {
    try {
      this.logger.debug(`findAll -> params -> ${JSON.stringify(params)}`);
      const {
        externalType = ReviewExternalType.Rider,
        isReviewDetail = false,
      } = conditions || {};
      const fields = [
        'customer.id',
        'customer.userId',
        'customer.firstName',
        'customer.lastName',
        'customer.emailId',
        'customer.mobileNo',
        'customer.profileImage',
        'customer.driverId',
        'customer.creationDate',
        'customer.totalRides',
        'customer.userType',
        'customer.userStatus',
        'customer.kycStatus',
        'customer.isKycRequired',
        'customer.idNumber',
        'customer.createdAt',
      ];
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select(fields);
      // if
      //   riderQryInstance.where('customer.isRider = :isRider', {
      //     isRider: true,
      //   });
      // else
      riderQryInstance.where('customer.isRider = :isRider', {
        isRider: params?.filters?.isRider == 0 ? false : true,
      });
      //Admin Filters
      // if (params?.filters?.userId) {
      //   riderQryInstance.andWhere('customer.userId = :userId', {
      //     userId: params?.filters?.userId,
      //   });
      // }
      if (params?.filters?.userId) {
        riderQryInstance.andWhere('customer.userId LIKE :userId', {
          userId: `${params?.filters?.userId}%`,
        });
      }
      if (params?.filters?.fullName) {
        riderQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('customer.firstName LIKE :fullName', {
              fullName: `${params?.filters?.fullName}%`,
            });
            sqb.orWhere('customer.lastName LIKE :fullName', {
              fullName: `${params?.filters?.fullName}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', customer.firstName, customer.lastName) LIKE :fullName",
              { fullName: `${params?.filters?.fullName}%` },
            );
          }),
        );
      }
      if (params?.filters?.mobileNo) {
        riderQryInstance.andWhere('customer.mobileNo LIKE :mobileNo', {
          mobileNo: `${params?.filters?.mobileNo}%`,
        });
      }
      if (params?.filters?.creationDate && params?.filters?.creationDate[0]) {
        const fromDate = new Date(params?.filters?.creationDate[0]).getTime();
        riderQryInstance.andWhere('customer.creationDate >= :fromDate', {
          fromDate,
        });
      }
      if (params?.filters?.creationDate && params?.filters?.creationDate[1]) {
        const toDate = new Date(
          new Date(params?.filters?.creationDate[1]),
        ).getTime();
        riderQryInstance.andWhere('customer.creationDate <= :toDate', {
          toDate,
        });
      }
      if (typeof params?.filters?.totalRides === 'number') {
        riderQryInstance.andWhere('customer.totalRides = :totalRides', {
          totalRides: params?.filters?.totalRides,
        });
      }
      if (params?.filters?.userType) {
        riderQryInstance.andWhere('customer.userType = :userType', {
          userType: params?.filters?.userType,
        });
      }
      if (params?.filters?.status) {
        riderQryInstance.andWhere('customer.userStatus = :status', {
          status: params?.filters?.status,
        });
      }
      if (params?.keyword) {
        riderQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('customer.userId LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('customer.firstName LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('customer.lastName LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('customer.mobileNo LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
          }),
        );
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = RiderListSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          riderQryInstance.orderBy(sortField, sortOrder);
        }
      }
      riderQryInstance.skip(params.skip);
      riderQryInstance.take(params.take);
      const [result, total] = await riderQryInstance.getManyAndCount();
      this.logger.debug(`findAll -> results with total ${total}`);

      const totalCount: number = total;
      const riders: any = result;

      let riderReviewList = [];
      if (isReviewDetail) {
        const externalIds = riders
          .map((data) => data?.userId)
          .filter((el) => {
            return el != null;
          });
        this.logger.debug(
          `findAll -> isReviewDetail START -> ${JSON.stringify(externalIds)}`,
        );
        if (externalIds && externalIds.length > 0) {
          const { data: reviewData } = await this.clientReviewTCP
            .send(
              GET_META_REVIEWS,
              JSON.stringify({
                externalIds: externalIds,
                externalType: ReviewExternalType.Rider,
              }),
            )
            .pipe()
            .toPromise();
          // const { data: reviewData } = await this.reviewService.getMetaReviews({ externalIds: externalIds, externalType: ReviewExternalType.Rider })
          if (reviewData && reviewData.length > 0) {
            riderReviewList = reviewData;
          }
        }
        this.logger.debug(
          `findAll -> isReviewDetail END -> ${JSON.stringify(externalIds)}`,
        );
      }

      this.logger.debug(`findAll -> loop riders START -> ${riders.length}`);
      riders.map((data) => {
        data['fullName'] = `${data['firstName']} ${data['lastName']}`;
        delete data['firstName'];
        delete data['lastName'];

        const ratingInfo = riderReviewList.filter(
          (rec) => rec.externalId == data.userId,
        );
        if (ratingInfo && ratingInfo.length > 0) {
          data['overallRating'] = ratingInfo[0]['rating'];
          data['overallReviews'] = ratingInfo[0]['reviewCount'];
        } else {
          data['overallRating'] = 0;
          data['overallReviews'] = 0;
        }
        if (data['creationDate']) {
          data['creationDate'] = getIsoDateTime(
            new Date(Number(data['creationDate'])),
          );
        }
      });
      this.logger.debug(`findAll -> loop riders END -> ${riders.length}`);

      return ResponseData.success(HttpStatus.OK, { riders, totalCount });
    } catch (err) {
      this.logger.error(`findAll -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // helo
  async getSelectedCustomers(userIds: number[], select = []) {
    try {
      if (!userIds.length) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.CUSTOMER.CUSTOMER_NOT_FOUND,
        );
      }

      let fields = [
        'customer.id',
        'customer.userId',
        'customer.firstName',
        'customer.lastName',
        'customer.emailId',
        'customer.mobileNo',
        'customer.profileImage',
        'customer.dateOfBirth',
        'customer.userType',
        'customer.totalTrips',
        'customer.totalRides',
        'customer.deviceToken',
        'customer.arabicLastName',
        'customer.arabicFirstName',
        'customer.idNumber',
        'customer.createdAt',
      ];

      if (select && select.length > 0) {
        fields = select.map((field) => `customer.${field}`);
      }

      const response = await this.customerRepository
        .createQueryBuilder('customer')
        .select(fields)
        .where('customer.userId IN (:...userIds)', { userIds: userIds })
        .getMany();

      //  mujtaba uncomplete
      // const data = await this.clientReviewTCP
      //   .send(SUBSCRIPTION_DETAILS_FROM_USERID, JSON.stringify(userIds))
      //   .pipe()
      //   .toPromise();

      // userIds.map((userId)=>{
      //   response.includes()
      // }
      // )

      return ResponseData.success(HttpStatus.OK, response);
    } catch (err) {
      this.logger.error(`getSelectedCustomers -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAllCustomersByUserType(userType: UserExternalType) {
    try {
      this.logger.debug(
        `getAllCustomersByUserType -> userType -> ${JSON.stringify(userType)}`,
      );

      if (!userType) {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          errorMessage.CUSTOMER.USER_TYPE_NOT_PROVIDED,
        );
      }

      let fields = [
        'customer.id',
        'customer.userId',
        'customer.userType',
        'customer.deviceToken',
      ];

      const response = await this.customerRepository
        .createQueryBuilder('customer')
        .select(fields)
        .where('customer.userType = :userType', { userType })
        .getMany();

      return ResponseData.success(HttpStatus.OK, response);
    } catch (err) {
      this.logger.error(`getAllCustomersByUserType -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getRiderTripHistory(id: string, params: ListSearchSortDto) {
    try {
      this.customLogger.start(`[getRiderTripHistory] | id: ${id}`);
      const fields = [
        'trips.id',
        'trips.tripNo',
        'trips.createdAt',
        'trips.tripBaseAmount',
        'trips.waitingCharge',
        'trips.taxAmount',
        'trips.promoCodeAmount',
        'trips.riderAmount',
        'trips.status',
        'trips.motAmount',
        'trips.driverReviewId',
        'driver.id',
        'driver.userId',
        'driver.firstName',
        'driver.lastName',
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
        'rider.userId',
        'rider.firstName',
      ];
      const riderQryInstance = this.tripsRepository.createQueryBuilder('trips');
      riderQryInstance.select(fields);
      riderQryInstance.addSelect(
        '(trips.tripBaseAmount + trips.waitingCharge + trips.taxAmount)',
        'subTotalAmt',
      );
      riderQryInstance.innerJoin('trips.rider', 'rider');
      riderQryInstance.leftJoin('trips.driver', 'driver');
      riderQryInstance.leftJoin(
        'trips.pickup',
        'pickup',
        'pickup.addressType = :pickupType',
        { pickupType: AddressType.PICK_UP },
      );
      riderQryInstance.leftJoin(
        'trips.dropoff',
        'dropoff',
        'dropoff.addressType = :dropoffType',
        { dropoffType: AddressType.DROP_OFF },
      );
      riderQryInstance.leftJoin(
        'trips.destination',
        'destination',
        'destination.addressType = :destinationType',
        { destinationType: AddressType.DESTINATION },
      );
      riderQryInstance.where('rider.id = :id', { id });
      //Admin Filters
      if (params?.filters?.tripNo) {
        riderQryInstance.andWhere('trips.tripNo = :tripNo', {
          tripNo: setTripNumber(params?.filters?.tripNo),
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        riderQryInstance.andWhere('trips.createdAt >= :fromDate', { fromDate });
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
        riderQryInstance.andWhere('trips.createdAt <= :toDate', { toDate });
      }
      if (typeof params?.filters?.promoCodeAmount === 'number') {
        riderQryInstance.andWhere('trips.promoCodeAmount = :promoCodeAmount', {
          promoCodeAmount: params?.filters?.promoCodeAmount,
        });
      }
      if (typeof params?.filters?.riderAmount === 'number') {
        riderQryInstance.andWhere('trips.riderAmount = :riderAmount', {
          riderAmount: params?.filters?.riderAmount,
        });
      }
      if (params?.filters?.pickup) {
        riderQryInstance.andWhere('pickup.address LIKE :pickup', {
          pickup: `${params?.filters?.pickup}%`,
        });
      }
      if (params?.filters?.dropoff) {
        riderQryInstance.andWhere(
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
      if (typeof params?.filters?.status === 'number') {
        riderQryInstance.andWhere('trips.status = :status', {
          status: params?.filters?.status,
        });
      } else {
        riderQryInstance.andWhere('trips.status IN (:...status)', {
          status: [
            TripStatus.COMPLETED,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.CANCELLED_BY_DRIVER,
          ],
        });
      }
      if (params?.filters?.driverId) {
        riderQryInstance.andWhere('driver.userId = :driverId', {
          driverId: params?.filters?.driverId,
        });
      }
      if (params?.filters?.driverName) {
        riderQryInstance.andWhere(
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
      if (params?.keyword) {
        riderQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('pickup.address LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('dropoff.address LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
          }),
        );
      }
      if (typeof params?.filters?.subTotal === 'number') {
        riderQryInstance.andWhere(
          'CAST((trips.tripBaseAmount + trips.waitingCharge + trips.taxAmount) AS DECIMAL(18,2)) = :subTotal',
          { subTotal: params?.filters?.subTotal },
        );
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = RiderTripHistorySort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          riderQryInstance.orderBy(sortField, sortOrder);
        }
      }
      riderQryInstance.skip(params.skip);
      riderQryInstance.take(params.take);
      const [result, total] = await riderQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      const driverReviewIds = trips
        .map((data) => data?.driverReviewId)
        .filter((el) => {
          return el != null;
        });
      let driverReviewList = [];
      if (driverReviewIds && driverReviewIds.length > 0) {
        const { data: reviewData } = await this.clientReviewTCP
          .send(GET_REVIEWS, JSON.stringify(driverReviewIds))
          .pipe()
          .toPromise();
        // const { data: reviewData } = await this.reviewService.getReviews(driverReviewIds)
        if (reviewData && reviewData.length > 0) {
          driverReviewList = reviewData;
        }
      }
      trips.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        // data['taxAmount'] = Number((data.tripBaseAmount * data.taxAmount / 100).toFixed(2));
        data['subTotal'] =
          data.tripBaseAmount + +data.waitingCharge + +data.taxAmount;
        if (data.driver) {
          data['driver'][
            'fullName'
          ] = `${data['driver']['firstName']} ${data['driver']['lastName']}`;
          delete data['driver']['firstName'];
          delete data['driver']['lastName'];

          const ratingInfo = driverReviewList.filter(
            (rec) => rec.id == data.driverReviewId,
          );
          if (ratingInfo && ratingInfo.length > 0) {
            data['driver']['driverReview'] = ratingInfo[0]['rating'];
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
      this.customLogger.end(`[getRiderTripHistory] | id: ${id}`);
      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.logger.error(`getRiderTripHistory -> error -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getRiderTripScheduled(id: string, params: ListSearchSortDto) {
    try {
      this.customLogger.start(`[getRiderTripScheduled] | id: ${id}`);
      const fields = [
        'trips.id',
        'trips.tripNo',
        'trips.riderScheduledAt',
        'trips.createdAt',
        'trips.updatedAt',
        'trips.estimatedBaseAmount',
        'trips.motAmount',
        'pickup.address',
        'pickup.addressType',
        'pickup.latitude',
        'pickup.longitude',
        'dropoff.address',
        'dropoff.addressType',
        'dropoff.latitude',
        'dropoff.longitude',
      ];
      const riderQryInstance = this.tripsRepository.createQueryBuilder('trips');
      riderQryInstance.select(fields);
      riderQryInstance.innerJoin('trips.rider', 'rider');
      riderQryInstance.leftJoin(
        'trips.pickup',
        'pickup',
        'pickup.addressType = :pickupType',
        { pickupType: AddressType.PICK_UP },
      );
      riderQryInstance.leftJoin(
        'trips.dropoff',
        'dropoff',
        'dropoff.addressType = :dropoffType',
        { dropoffType: AddressType.DESTINATION },
      );
      riderQryInstance.where('rider.id = :id', { id });
      riderQryInstance.andWhere('trips.tripType = :tripType', {
        tripType: TripType.SCHEDULED,
      });
      riderQryInstance.andWhere('trips.status IN (:...status)', {
        status: [TripStatus.PENDING],
      });
      // Admin Filters
      if (params?.filters?.tripNo) {
        riderQryInstance.andWhere('trips.tripNo = :tripNo', {
          tripNo: setTripNumber(params?.filters?.tripNo),
        });
      }
      if (
        params?.filters?.riderScheduledAt &&
        params?.filters?.riderScheduledAt[0]
      ) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.riderScheduledAt[0]),
        );
        riderQryInstance.andWhere('trips.riderScheduledAt >= :fromDate', {
          fromDate,
        });
      }
      if (
        params?.filters?.riderScheduledAt &&
        params?.filters?.riderScheduledAt[1]
      ) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.riderScheduledAt[1]).setUTCHours(
              23,
              59,
              59,
              999,
            ),
          ),
        );
        riderQryInstance.andWhere('trips.riderScheduledAt <= :toDate', {
          toDate,
        });
      }
      if (params?.filters?.updatedAt && params?.filters?.updatedAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.updatedAt[0]),
        );
        riderQryInstance.andWhere('trips.updatedAt >= :fromDate', { fromDate });
      }
      if (params?.filters?.updatedAt && params?.filters?.updatedAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.updatedAt[1]).setUTCHours(
              23,
              59,
              59,
              999,
            ),
          ),
        );
        riderQryInstance.andWhere('trips.updatedAt <= :toDate', { toDate });
      }
      if (typeof params?.filters?.estimatedBaseAmount === 'number') {
        riderQryInstance.andWhere(
          'trips.estimatedBaseAmount = :estimatedBaseAmount',
          { estimatedBaseAmount: params?.filters?.estimatedBaseAmount },
        );
      }
      if (params?.filters?.pickup) {
        riderQryInstance.andWhere('pickup.address LIKE :pickup', {
          pickup: `${params?.filters?.pickup}%`,
        });
      }
      if (params?.filters?.dropoff) {
        riderQryInstance.andWhere('dropoff.address LIKE :dropoff', {
          dropoff: `${params?.filters?.dropoff}%`,
        });
      }
      if (params?.keyword) {
        riderQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('pickup.address LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('dropoff.address LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
          }),
        );
      }
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = RiderTripScheduledSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          riderQryInstance.orderBy(sortField, sortOrder);
        }
      }
      riderQryInstance.skip(params.skip);
      riderQryInstance.take(params.take);
      const [result, total] = await riderQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;
      trips.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        if (!data?.pickup) {
          data['pickup'] = {};
        }
        if (!data?.dropoff) {
          data['dropoff'] = {};
        }
      });
      this.customLogger.end(`[getRiderTripScheduled] | id: ${id}`);
      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.logger.error(`getRiderTripScheduled -> error -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getDriverTripHistory(id: string, params: ListSearchSortDto) {
    try {
      this.customLogger.start(`[getDriverTripHistory] | id: ${id}`);
      const fields = [
        'trips.id',
        'trips.tripNo',
        'trips.createdAt',
        'trips.tripBaseAmount',
        'trips.waitingCharge',
        'trips.taxAmount',
        'trips.promoCodeAmount',
        'trips.riderAmount',
        'trips.driverAmount',
        'trips.status',
        'trips.motAmount',
        'trips.riderReviewId',
        'rider.id',
        'rider.userId',
        'rider.firstName',
        'rider.lastName',
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
        'driver.userId',
        'driver.firstName',
      ];
      const driverQryInstance = this.tripsRepository.createQueryBuilder(
        'trips',
      );
      driverQryInstance.select(fields);
      driverQryInstance.addSelect(
        '(trips.tripBaseAmount + trips.waitingCharge + trips.taxAmount)',
        'subTotalAmt',
      );
      driverQryInstance.innerJoin('trips.driver', 'driver');
      driverQryInstance.leftJoin('trips.rider', 'rider');
      driverQryInstance.leftJoin(
        'trips.pickup',
        'pickup',
        'pickup.addressType = :pickupType',
        { pickupType: AddressType.PICK_UP },
      );
      driverQryInstance.leftJoin(
        'trips.dropoff',
        'dropoff',
        'dropoff.addressType = :dropoffType',
        { dropoffType: AddressType.DROP_OFF },
      );
      driverQryInstance.leftJoin(
        'trips.destination',
        'destination',
        'destination.addressType = :destinationType',
        { destinationType: AddressType.DESTINATION },
      );
      driverQryInstance.where('driver.driverId = :id', { id });
      // Admin Filters
      if (params?.filters?.tripNo) {
        driverQryInstance.andWhere('trips.tripNo = :tripNo', {
          tripNo: setTripNumber(params?.filters?.tripNo),
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        driverQryInstance.andWhere('trips.createdAt >= :fromDate', {
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
        driverQryInstance.andWhere('trips.createdAt <= :toDate', { toDate });
      }
      if (typeof params?.filters?.promoCodeAmount === 'number') {
        driverQryInstance.andWhere('trips.promoCodeAmount = :promoCodeAmount', {
          promoCodeAmount: params?.filters?.promoCodeAmount,
        });
      }
      if (typeof params?.filters?.riderAmount === 'number') {
        driverQryInstance.andWhere('trips.riderAmount = :riderAmount', {
          riderAmount: params?.filters?.riderAmount,
        });
      }
      if (typeof params?.filters?.driverAmount === 'number') {
        driverQryInstance.andWhere('trips.driverAmount = :driverAmount', {
          driverAmount: params?.filters?.driverAmount,
        });
      }
      if (params?.filters?.pickup) {
        driverQryInstance.andWhere('pickup.address LIKE :pickup', {
          pickup: `${params?.filters?.pickup}%`,
        });
      }
      if (params?.filters?.dropoff) {
        driverQryInstance.andWhere(
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
      if (typeof params?.filters?.status === 'number') {
        driverQryInstance.andWhere('trips.status = :status', {
          status: params?.filters?.status,
        });
      } else {
        driverQryInstance.andWhere('trips.status IN (:...status)', {
          status: [
            TripStatus.COMPLETED,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.CANCELLED_BY_DRIVER,
          ],
        });
      }
      if (params?.filters?.riderId) {
        driverQryInstance.andWhere('rider.userId = :riderId', {
          riderId: params?.filters?.riderId,
        });
      }
      if (params?.filters?.riderName) {
        driverQryInstance.andWhere(
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
      if (params?.keyword) {
        driverQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('pickup.address LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('dropoff.address LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
          }),
        );
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = RiderTripHistorySort[params?.sort?.field];
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
      const trips: any = result;

      const riderReviewIds = trips
        .map((data) => data?.riderReviewId)
        .filter((el) => {
          return el != null;
        });
      let riderReviewList = [];
      if (riderReviewIds && riderReviewIds.length > 0) {
        const { data: reviewData } = await this.clientReviewTCP
          .send(GET_REVIEWS, JSON.stringify(riderReviewList))
          .pipe()
          .toPromise();
        // const { data: reviewData } = await this.reviewService.getReviews(riderReviewList);
        if (reviewData && reviewData.length > 0) {
          riderReviewList = reviewData;
        }
      }
      this.customLogger.log(`[getDriverTripHistory] | id: ${id} Data Fetched`);
      trips.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        // data['taxAmount'] = Number((data.tripBaseAmount * data.taxAmount / 100).toFixed(2));
        data['rider'][
          'fullName'
        ] = `${data['rider']['firstName']} ${data['rider']['lastName']}`;
        delete data['rider']['firstName'];
        delete data['rider']['lastName'];
        const ratingInfo = riderReviewList.filter(
          (rec) => rec.id == data.riderReviewId,
        );
        if (ratingInfo && ratingInfo.length > 0) {
          data['rider']['riderReview'] = ratingInfo[0]['rating'];
        } else {
          data['rider']['riderReview'] = 0;
        }
        delete data['riderReviewId'];

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
      this.customLogger.end(`[getDriverTripHistory] | id: ${id}`);
      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.logger.error(`getDriverTripHistory -> error -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getDriverEarnings(id: string, params: ListSearchSortDto) {
    try {
      this.customLogger.start(
        `[getDriverEarnings] | id: ${id} | params: ${JSON.stringify(params)}`,
      );
      const fields = [
        'trips.id',
        'trips.tripNo',
        'trips.taxAmount',
        'trips.createdAt',
        'trips.driverAmount',
        'trips.riderAmount',
        'trips.driverAmount',
        'trips.transactionId',
        'trips.motAmount',
        'trips.status',
        'rider.id',
        'rider.userId',
        'rider.firstName',
        'rider.lastName',
        'trips.tripBaseAmount',
        'trips.waitingCharge',
        'trips.promoCodeAmount',
      ];
      const driverQryInstance = this.tripsRepository.createQueryBuilder(
        'trips',
      );
      driverQryInstance.select(fields);
      driverQryInstance.innerJoin('trips.driver', 'driver');
      driverQryInstance.leftJoin('trips.rider', 'rider');
      driverQryInstance.where('driver.driverId = :id', { id });
      // Admin Filters
      if (params?.filters?.tripNo) {
        driverQryInstance.andWhere('trips.tripNo = :tripNo', {
          tripNo: setTripNumber(params?.filters?.tripNo),
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        driverQryInstance.andWhere('trips.createdAt >= :fromDate', {
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
        driverQryInstance.andWhere('trips.createdAt <= :toDate', { toDate });
      }
      if (typeof params?.filters?.driverAmount === 'number') {
        driverQryInstance.andWhere('trips.driverAmount = :driverAmount', {
          driverAmount: params?.filters?.driverAmount,
        });
      }
      if (typeof params?.filters?.status === 'number') {
        driverQryInstance.andWhere('trips.status = :status', {
          status: params?.filters?.status,
        });
      } else {
        driverQryInstance.andWhere('trips.status IN (:...status)', {
          status: [
            TripStatus.COMPLETED,
            TripStatus.CANCELLED_BY_RIDER,
            TripStatus.CANCELLED_BY_DRIVER,
          ],
        });
      }
      if (params?.filters?.riderId) {
        driverQryInstance.andWhere('rider.userId = :riderId', {
          riderId: params?.filters?.riderId,
        });
      }
      if (typeof params?.filters?.riderAmount === 'number') {
        driverQryInstance.andWhere('trips.riderAmount = :riderAmount', {
          riderAmount: params?.filters?.riderAmount,
        });
      }
      if (params?.filters?.riderName) {
        driverQryInstance.andWhere(
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
      if (params?.keyword) {
        driverQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('rider.firstName LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('rider.lastName LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
          }),
        );
      }
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = RiderTripHistorySort[params?.sort?.field];
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
      const earnings: any = result;
      earnings.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        data['rider'][
          'fullName'
        ] = `${data['rider']['firstName']} ${data['rider']['lastName']}`;
        delete data['rider']['firstName'];
        delete data['rider']['lastName'];
      });

      const earningQryInstance = this.tripsRepository.createQueryBuilder(
        'trips',
      );
      earningQryInstance.select([
        'SUM(trips.riderAmount) as totalEarnings',
        'SUM(trips.driverAmount) as totalEarningsWithoutTax',
      ]);
      earningQryInstance.innerJoin('trips.driver', 'driver');
      earningQryInstance.where('driver.driverId = :id', { id });
      earningQryInstance.andWhere('trips.status IN (:...status)', {
        status: [
          TripStatus.COMPLETED,
          TripStatus.CANCELLED_BY_RIDER,
          TripStatus.CANCELLED_BY_DRIVER,
        ],
      });
      const earningsResult = await earningQryInstance.getRawOne();
      const totalEarnings = getAmountFormatted(
        Number(earningsResult?.totalEarnings || 0),
      );
      const totalEarningsWithoutTax = getAmountFormatted(
        Number(earningsResult?.totalEarningsWithoutTax || 0),
      );
      this.customLogger.end(`[getDriverEarnings] -> success -> id: ${id}`);

      return ResponseData.success(HttpStatus.OK, {
        earnings,
        totalCount,
        totalEarnings,
        totalEarningsWithoutTax,
      });
    } catch (e) {
      this.logger.error(`getDriverEarnings -> error -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCustomerStats(params: StatsParams) {
    try {
      const riderFields = [
        'COUNT(customer.id) AS rowTotal',
        "COALESCE(customer.gender, 'M') AS customer_gender",
      ];
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select(riderFields);
      riderQryInstance.where('customer.isRider = :isRider', { isRider: true });
      riderQryInstance.groupBy('customer_gender');
      const riderResults = await riderQryInstance.getRawMany();

      const driverFields = [
        'COUNT(customer.id) AS rowTotal',
        "COALESCE(customer.gender, 'M') AS customer_gender",
      ];
      const driverQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      driverQryInstance.select(driverFields);
      driverQryInstance.where('customer.userType = :userType', {
        userType: UserExternalType.Captain,
      });
      driverQryInstance.groupBy('customer_gender');
      const driverResults = await driverQryInstance.getRawMany();

      this.customLogger.start(
        `[getCustomerStats] | rider-results: ${JSON.stringify(riderResults)}`,
      );
      this.customLogger.start(
        `[getCustomerStats] | driver-results: ${JSON.stringify(driverResults)}`,
      );

      const stats = {
        riders: [],
        drivers: [],
      };
      if (riderResults && riderResults.length > 0) {
        riderResults.forEach((record, indx) => {
          stats.riders.push({
            key: record.customer_gender,
            value: Number(record.rowTotal),
          });
        });
      }
      if (driverResults && driverResults.length > 0) {
        driverResults.forEach((record, indx) => {
          stats.drivers.push({
            key: record.customer_gender,
            value: Number(record.rowTotal),
          });
        });
      }

      const genderList = ['M', 'F'];
      let checkRow;
      genderList.forEach((code) => {
        checkRow = stats.drivers.filter((row) => row.key == code);
        if (!checkRow[0]) {
          stats.drivers.push({
            key: code,
            value: 0,
          });
        }
        checkRow = stats.riders.filter((row) => row.key == code);
        if (!checkRow[0]) {
          stats.riders.push({
            key: code,
            value: 0,
          });
        }
      });

      const ridersTotal = stats.riders[0].value + +stats.riders[1].value;
      if (stats.riders[0].value > 0) {
        stats.riders[0].percentage = Number(
          ((stats.riders[0].value * 100) / ridersTotal).toFixed(2),
        );
      } else {
        stats.riders[0].percentage = 0;
      }
      if (stats.riders[1].value > 0) {
        stats.riders[1].percentage = Number(
          ((stats.riders[1].value * 100) / ridersTotal).toFixed(2),
        );
      } else {
        stats.riders[1].percentage = 0;
      }

      const driversTotal = stats.drivers[0].value + +stats.drivers[1].value;
      if (stats.drivers[0].value > 0) {
        stats.drivers[0].percentage = Number(
          ((stats.drivers[0].value * 100) / driversTotal).toFixed(2),
        );
      } else {
        stats.drivers[0].percentage = 0;
      }
      if (stats.drivers[1].value > 0) {
        stats.drivers[1].percentage = Number(
          ((stats.drivers[1].value * 100) / driversTotal).toFixed(2),
        );
      } else {
        stats.drivers[1].percentage = 0;
      }

      this.customLogger.end(
        `[getCustomerStats] | result: ${JSON.stringify(stats)}`,
      );
      return ResponseData.success(HttpStatus.OK, stats);
    } catch (e) {
      this.logger.error(`getCustomerStats -> error -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateCustomerLocation(locationInfo: UpdateLocationInfo) {
    try {
      const riderInfo = await this.findOne({
        userId: Number(locationInfo.riderId),
      });
      if (riderInfo && riderInfo.statusCode == HttpStatus.OK) {
        const upData = {
          latitude: locationInfo.latitude,
          longitude: locationInfo.longitude,
        };
        await this.customerRepository.update({ id: riderInfo.data.id }, upData);
        this.logger.log(
          `updateCustomerLocation -> updated -> userId: ${locationInfo?.riderId}`,
        );
        const customerLocations = {
          userId: locationInfo.riderId,
          ...upData,
        };
        const addLocation = this.customerLocationsRepository.create(
          customerLocations,
        );
        console.log(await this.customerLocationsRepository.save(addLocation));
      } else {
        this.logger.error(
          `updateCustomerLocation -> customer not found ${locationInfo.riderId}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `updateCustomerLocation -> error -> ${JSON.stringify(err)}`,
      );
    }
  }

  async upsertAppUsage(param: {
    userId: number;
    clientId: string;
    status: number;
  }) {
    try {
      this.logger.log(`upsertAppUsage -> params -> ${JSON.stringify(param)}`);
      if (param.status == 0) {
        this.customerAppUsage.update(
          { clientId: param.clientId },
          { status: 0 },
        );
      } else if (param.status == 1) {
        const Param = this.customerAppUsage.create({
          userId: param.userId,
          clientId: param.clientId,
          status: 1,
        });
        this.customerAppUsage.save(Param);
      }
    } catch (err) {}
  }

  async findRidersForAdmin(keyword: string) {
    try {
      const riderFields = [
        'id',
        'userId',
        'firstName',
        'lastName',
        'mobileNo',
        'emailId',
        'dateOfBirth',
        'gender',
        'profileImage',
      ];
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select(riderFields);
      if (keyword) {
        riderQryInstance.where(
          new Brackets((sqb) => {
            sqb.where('userId = :userId', { userId: `${keyword}` });
            sqb.orWhere('mobileNo = :mobileNo', { mobileNo: `${keyword}` });
            sqb.orWhere('emailId LIKE :emailId', { emailId: `${keyword}%` });
            sqb.orWhere('firstName LIKE :firstName', {
              firstName: `${keyword}%`,
            });
            sqb.orWhere('lastName LIKE :lastName', { lastName: `${keyword}%` });
            sqb.orWhere("CONCAT_WS(' ', firstName, lastName) LIKE :fullName", {
              fullName: `${keyword}%`,
            });
          }),
        );
      }
      riderQryInstance.take(RIDER_SEARCH_LIMIT_FOR_ADMIN);
      const riders = await riderQryInstance.getRawMany();
      riders.map((data) => {
        data['fullName'] = `${data['firstName']} ${data['lastName']}`;
        delete data['firstName'];
        delete data['lastName'];
      });
      this.customLogger.log(
        `[searchRiders] | total: ${JSON.stringify(riders.length)}`,
      );
      return ResponseData.success(HttpStatus.OK, riders);
    } catch (e) {
      this.logger.error(`searchRiders -> error -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async createOtpForRider(params: CreateOtpDto) {
    try {
      let { riderId } = params;
      this.customLogger.start(
        `[createOtpForRider] | params: ${JSON.stringify(params)}`,
      );
      let otp = getOTP();
      let customer = await this.customerRepository.findOne({ userId: riderId });
      if (!customer) {
        this.logger.log(`Customer not found: ${riderId}`);
        throw Error(errorMessage.CUSTOMER.CUSTOMER_NOT_FOUND);
      }
      this.sendOTP(customer, otp);
      this.customLogger.start(`[OTP] | otp generated : ${otp}`);
      this.customLogger.start(`[updateCustomerOtp] | userId: ${riderId}`);
      await this.customerRepository.update(
        { userId: riderId },
        { customerOtp: otp },
      );
      this.logger.log(`create -> customer updated. id: ${riderId}`);
      return ResponseData.success(HttpStatus.OK, otp);
    } catch (e) {
      this.logger.error(`createOtpForRider -> error -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyOtpForRider(params: VerifyOtpDto) {
    try {
      let { riderId, otp } = params;
      this.customLogger.start(
        `[verifyOtpForRider] | params: ${JSON.stringify(params)}`,
      );
      let customer = await this.customerRepository.findOne({
        userId: riderId,
        customerOtp: otp,
      });
      if (!customer) {
        this.logger.log(`Invalid OTP: ${otp}`);
        throw Error(errorMessage.OTP.OTP_NOT_FOUND);
      }
      this.customLogger.start(`[removeCustomerOtp] | userId: ${riderId}`);
      await this.customerRepository.update(
        { userId: riderId },
        { customerOtp: null },
      );
      this.logger.log(`create -> customer updated. id: ${riderId}`);
      return ResponseData.success(HttpStatus.OK, customer);
    } catch (e) {
      this.logger.error(`verifyOtpForRider -> error -> ${e.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        e.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async sendOTP(customer, otp: number) {
    try {
      const riderName =
        customer?.prefferedLanguage === 'AR'
          ? customer?.arabicFirstName
            ? `${customer?.arabicFirstName} ${customer?.arabicLastName}`
            : `${customer?.firstName} ${customer?.lastName}`
          : customer?.firstName
          ? `${customer?.firstName} ${customer?.lastName}`
          : '';
      const smsParams: any = {
        externalId: customer?.userId,
        language: customer?.prefferedLanguage,
        mobileNo: customer?.mobileNo,
        templateCode: 'SEND_OTP_TO_RIDER',
        keyValues: {
          riderName: riderName,
          otp: otp,
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

  async getTripsDashboardStats(params: any) {
    return await this.clientTripTCP
      .send(DASHBOARD_STATS, JSON.stringify(params))
      .pipe()
      .toPromise();
  }

  async getTripDashboardActiveRiders(params: any) {
    return await this.clientTripTCP
      .send(DASHBOARD_ACTIVE_RIDERS, JSON.stringify(params))
      .pipe()
      .toPromise();
  }

  // Updates admin dashboard stats as new customer created
  async notifyAdminDashboardAsCustomerCreated() {
    try {
      this.customLogger.start(`[notifyAdminDashboardAsCustomerCreated]`);

      const topStatsRes = await this.getTripsDashboardStats({ type: 'day' });

      await this.emitToAdminDashboardViaSocket(NEW_CUSTOMER_CREATED, {
        topStats: topStatsRes?.data || {},
      });

      const activeRidersRes = await this.getTripDashboardActiveRiders({
        type: 'day',
      });

      await this.emitToAdminDashboardViaSocket(NEW_CUSTOMER_CREATED, {
        activeRiders: activeRidersRes?.data || {},
      });

      const genderStatsRes = await this.getCustomerStats({ type: 'day' });

      await this.emitToAdminDashboardViaSocket(NEW_CUSTOMER_CREATED, {
        genderStats: genderStatsRes?.data || {},
      });

      this.customLogger.end(`[notifyAdminDashboardAsCustomerCreated]`);
    } catch (e) {
      this.customLogger.error(
        `[notifyAdminDashboardAsCustomerCreated] error > ${JSON.stringify(
          e.message,
        )}`,
      );
    }
  }

  // Updates admin dashboard stats as customer isRider status changed
  async notifyAdminDashboardAsCustomerIsRiderStatusSwitched() {
    try {
      this.customLogger.start(
        `[notifyAdminDashboardAsCustomerIsRiderStatusSwitched]`,
      );

      const topStatsRes = await this.getTripsDashboardStats({ type: 'day' });

      await this.emitToAdminDashboardViaSocket(
        CUSTOMER_IS_RIDER_STATUS_SWITCHED,
        { topStats: topStatsRes?.data || {} },
      );

      const activeRidersRes = await this.getTripDashboardActiveRiders({
        type: 'day',
      });

      await this.emitToAdminDashboardViaSocket(
        CUSTOMER_IS_RIDER_STATUS_SWITCHED,
        { activeRiders: activeRidersRes?.data || {} },
      );

      const genderStatsRes = await this.getCustomerStats({ type: 'day' });

      await this.emitToAdminDashboardViaSocket(
        CUSTOMER_IS_RIDER_STATUS_SWITCHED,
        { genderStats: genderStatsRes?.data || {} },
      );

      this.customLogger.end(
        `[notifyAdminDashboardAsCustomerIsRiderStatusSwitched]`,
      );
    } catch (e) {
      this.customLogger.error(
        `[notifyAdminDashboardAsCustomerIsRiderStatusSwitched] error > ${JSON.stringify(
          e.message,
        )}`,
      );
    }
  }
  async getUserLocFromDB(userId: string) {
    try {
      const riderQryInstance = this.customerRepository.createQueryBuilder(
        'customer',
      );
      riderQryInstance.select([
        'customer.updatedAt',
        'customer.latitude',
        'customer.longitude',
      ]);
      riderQryInstance.where({ userId });
      return await riderQryInstance.getOne();
    } catch (err) {}
  }

  ///

  async activeUsersPercentage(userType: UserExternalType) {
    try {
      const timeLimit = getPastTime(600);
      const activeUsersRepo: any = await this.customerAppUsage
        .createQueryBuilder('cpu')
        .select('COUNT(DISTINCT `cpu`.`userId`) AS `cnt`')
        .innerJoin('cpu.customer', 'customer')
        .where('cpu.status = 1');
      if (userType == UserExternalType.Rider) {
        activeUsersRepo.andWhere('customer.isRider = :isRider', {
          isRider: true,
        });
      } else {
        activeUsersRepo.andWhere('customer.userType = :userType', { userType });
      }
      let activeUsers = await activeUsersRepo
        .andWhere('cpu.createdAt > :timeLimit', { timeLimit })
        .getRawOne();

      const allUsersRepo = this.customerRepository
        .createQueryBuilder('customer')
        .select('COUNT(DISTINCT `customer`.`userId`) AS `cnt`');

      if (userType == UserExternalType.Rider) {
        allUsersRepo.andWhere('customer.isRider = :isRider', {
          isRider: 1,
        });
      } else {
        allUsersRepo.where({ userType });
      }
      let allUsers = await allUsersRepo.getRawOne();
      allUsers = allUsers || 0;
      let active = Number(activeUsers?.cnt) || 0,
        inActive = Number(allUsers?.cnt) || 0,
        activePercentage = 0,
        inActivePercentage = 100;

      this.logger.log(
        `[activeUsers] active: ${JSON.stringify(
          activeUsers,
        )} -- allUsers: ${JSON.stringify(allUsers)}`,
      );

      if (active <= inActive)
        activePercentage = Math.floor((active / inActive) * 100);
      inActivePercentage = 100 - activePercentage;
      return ResponseData.success(HttpStatus.OK, {
        Percentage: {
          activePercentage: active,
          inActivePercentage: inActive - active,
        },
        count: {
          active,
          inActive: inActive - active,
        },
      });
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  ////////////////////get all active users locations

  async getAllLocationsWithInDesireTime(timeInMinutes = 5) {
    try {
      if (timeInMinutes <= 0) {
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          'Please enter a valid time range',
        );
      }

      let dbTime = getPastTime(timeInMinutes);

      let fields = ['customer.latitude', 'customer.longitude'];

      const response = await this.customerRepository
        .createQueryBuilder('customer')
        .select(fields)
        .where('customer.latitude IS NOT NULL')
        .andWhere('customer.longitude IS NOT NULL')
        .andWhere('customer.updatedAt > :start_at', { start_at: dbTime })
        .getMany();

      return ResponseData.success(HttpStatus.OK, response);
    } catch (err) {
      this.logger.error(`getSelectedCustomers -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // app usage
  async appUsageGraph(userId, params: StatsParams) {
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
        'SUM(TIMEDIFF(customer_app_useage.updatedAt, customer_app_useage.createdAt)) AS rowTotal',
        'MAX(customer_app_useage.createdAt) AS maxDate',
      ];
      if (type === 'year') {
        fields.push(
          'DATE_FORMAT(customer_app_useage.createdAt,"%Y-%m") AS rowDateFormat',
        );
      } else if (type === 'month') {
        fields.push('WEEK(customer_app_useage.createdAt) AS rowDateFormat');
      } else if (type === 'week') {
        fields.push(
          'DATE_FORMAT(customer_app_useage.createdAt,"%Y-%m-%d") AS rowDateFormat',
        );
      } else {
        fields.push('customer_app_useage.createdAt AS rowDateFormat');
      }
      const AppUsageQryInstance = this.customerAPPUsageRepository.createQueryBuilder(
        'customer_app_useage',
      );
      AppUsageQryInstance.select(fields);
      AppUsageQryInstance.where('customer_app_useage.userId = :userId', {
        userId,
      });
      AppUsageQryInstance.andWhere(
        "DATE_FORMAT(customer_app_useage.createdAt, '%Y-%m-%d') >= :startDate",
        { startDate },
      );
      AppUsageQryInstance.andWhere(
        "DATE_FORMAT(customer_app_useage.createdAt, '%Y-%m-%d') <= :endDate",
        { endDate },
      );
      AppUsageQryInstance.groupBy('rowDateFormat');
      let results = await AppUsageQryInstance.getRawMany();
      this.customLogger.debug(
        '[getTripStats] results: ' + JSON.stringify(results),
      );

      const totalStats = {
        mints: 0,
      };
      const graphList = [];
      let totalVal = 0;
      if (results?.length) {
        let dateStats = {};
        let statCode, statLabel;
        results.forEach((record) => {
          statCode = 'mints';
          if (type === 'month') {
            record.maxDate = getDateOfWeek(
              Number(record.rowDateFormat),
              record.maxDate.getFullYear(),
            );
          }
          statLabel = getGraphLabel(record.maxDate, type);
          if (!dateStats[statLabel]) {
            dateStats[statLabel] = {};
          }
          if (statCode !== '') {
            totalStats[statCode] += Number(record.rowTotal || 0);
            dateStats[statLabel][statCode] =
              (dateStats[statLabel][statCode] || 0) +
              Number(record.rowTotal || 0);
          }
        });

        totalVal = Object.keys(totalStats).reduce((prev, curr) => {
          return prev + totalStats[curr];
        }, 0);
        this.customLogger.debug(
          '[appUsageGraph] dateStats: ' + JSON.stringify(dateStats),
        );
        this.customLogger.debug(
          '[appUsageGraph] totalStats: ' + JSON.stringify(totalStats),
        );

        let loopKey, loopVal, loopObj;
        const rangeList = getDateRange(type);
        rangeList.forEach((dateVal) => {
          loopKey = getGraphLabel(dateVal, type);
          loopObj = dateStats[loopKey] ?? {};
          loopVal = [];
          Object.keys(loopObj).forEach((innKey) => {
            loopVal.push({
              key: innKey,
              value: Math.round(Number(loopObj[innKey]) / 60),
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
        });
        dateStats = {};
        results = [];
      }
      return ResponseData.success(HttpStatus.OK, {
        graphList,
        totalTime: Math.round(totalVal / 60),
      });
    } catch (err) {
      this.customLogger.error('[getTripStats] error > ' + err.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err.message ?? errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAllUsersInZone(userId: string) {
    try {
      //get time from  constant and convert to db date time format.
      const dbTime = getPastTime(HIGH_DEMAND_ZONE_TIME_LIMIT_MINUTES);

      // get user lat long.
      const userLatLong = await this.customerRepository
        .createQueryBuilder('customer')
        .select(['customer.latitude, customer.longitude'])
        .andWhere('customer.userId  =  :userId', { userId: userId })
        .getRawOne();

      //get radious from radis
      const radius =
        (await this.redisHandler.getRedisKey('HIGH_DEMAND_ZONE_RADIUS')) || 10;

      //get lat long that are with in radious.
      if (userLatLong?.latitude && userLatLong?.longitude) {
        const demandZones = await this.customerRepository
          .createQueryBuilder('hd')
          .select([
            'GeoDistMiles(' +
              userLatLong.latitude +
              ',' +
              userLatLong.longitude +
              ",hd.latitude,hd.longitude,'km') AS distance",
          ])
          .addSelect(['hd.latitude as lat', 'hd.longitude as lng'])
          .having('distance <= :radius', {
            radius: radius,
          })
          .where('hd.latitude IS NOT NULL')
          .andWhere('hd.longitude IS NOT NULL')
          .andWhere('updatedAt > :start_at', { start_at: dbTime })
          .getRawMany();

        //This will delete distance key from array of object
        demandZones.map((o) => delete o.distance);

        const response = {
          user: {
            latitude: userLatLong.latitude,
            longitude: userLatLong.longitude,
          },
          radius: radius,
          coordinates: demandZones,
        };

        return ResponseData.success(HttpStatus.OK, response);
      } else {
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          'no userId lat long found',
        );
      }
    } catch (err) {
      console.log('__________Error__________getAllUsersHDZ___________________');
      this.logger.error(`getAllUsersInZone -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async changeApprovalStatus(userId: string, status: boolean) {
    try {
      const repoQueryRes = await this.customerRepository.findOne({
        where: {
          useriId: userId,
        },
      });
      if (repoQueryRes) {
        repoQueryRes.approvalStatus = status;
        const funRes = await this.customerRepository.save(repoQueryRes);
        this.logger.error(`changeApprovalStatus -> result -> ${funRes}`);
        return ResponseData.success(HttpStatus.OK, funRes);
      } else {
        console.log(
          '__________Error__________changeApprovalStatus__________No Match found_________',
        );
        return ResponseData.error(
          HttpStatus.NOT_FOUND,
          'no customer id matched',
        );
      }
    } catch (err) {
      console.log(
        '__________Error__________changeApprovalStatus___________________',
      );
      this.logger.error(`changeApprovalStatus -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  /**
   * This function will count customer that matched the params.
   * @param mobileNo customer mobile no
   * @param userType type of customer (rider = 1, captain = 2)
   */
  async checkIfUserAllReadyExist(mobileNo: string, userType: UserExternalType) {
    try {
      const result = await this.customerRepository
        .createQueryBuilder('c')
        .select('c.id', 'id')
        .where('c.userType = :userType', { userType })
        .andWhere('c.mobileNo = :mobileNo', { mobileNo })
        .getCount();
      console.log(result);

      this.logger.log(
        `customer.service checkIfUserAllReadyExist::mobileNO${mobileNo}::userType -> ${userType}`,
      );
      return ResponseData.success(HttpStatus.OK, result);
    } catch (err) {
      console.log('__________Error__________getAllUsersHDZ___________________');
      this.logger.error(
        `customer.service checkIfUserAllReadyExist -> error -> ${err.message}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  /**
   * This function get customer details based on mobile no Array.
   * @param data mobile no array and filter which are optional.
   * @returns
   */
  async getUserDetailsForOtpLogs(data) {
    try {
      const mobileNoArr = data.mobileNoArr;
      const params = data?.params || null;

      // create query builder
      const cusRepRes = this.customerRepository.createQueryBuilder('customer');
      cusRepRes.select('customer.userId', 'userId');
      cusRepRes.addSelect('customer.firstName', 'firstName');
      cusRepRes.addSelect('customer.lastName', 'lastName');
      cusRepRes.addSelect('customer.userType', 'userType');
      cusRepRes.addSelect('customer.mobileNo', 'mobileNo');
      cusRepRes.andWhere('customer.mobileNo IN (:...mobileNoArr)', {
        mobileNoArr,
      });

      // filter for usertype
      if (params?.filters?.userType) {
        cusRepRes.andWhere('customer.userType LIKE :userType', {
          userType: `${params?.filters?.userType}%`,
        });
      }

      // filters for mobileNo
      if (params?.filters?.mobileNo) {
        cusRepRes.andWhere('customer.mobileNo LIKE :mobileNo', {
          mobileNo: `${params?.filters?.mobileNo}%`,
        });
      }

      // filters for userId
      if (params?.filters?.userId) {
        cusRepRes.andWhere('customer.userId LIKE :userId', {
          userId: `${params?.filters?.userId}%`,
        });
      }

      // filters for name
      if (params?.filters?.name) {
        cusRepRes.andWhere(
          new Brackets((sqb) => {
            sqb.where('customer.firstName LIKE :name', {
              name: `${params?.filters?.name}%`,
            });
            sqb.orWhere('customer.lastName LIKE :name', {
              name: `${params?.filters?.name}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', customer.firstName, customer.lastName) LIKE :name",
              { name: `${params?.filters?.name}%` },
            );
          }),
        );
      }

      // // This code below can be used to search for customer created between 2 dates.
      // if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
      //   const fromDate = getIsoDateTime(
      //     new Date(params?.filters?.createdAt[0]),
      //   );
      //   cusRepRes.andWhere('customer.createdAt >= :fromDate', {
      //     fromDate,
      //   });
      // }

      // if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
      //   const toDate = getIsoDateTime(
      //     new Date(
      //       new Date(params?.filters?.createdAt[1]).setUTCHours(
      //         23,
      //         59,
      //         59,
      //         999,
      //       ),
      //     ),
      //   );
      //   cusRepRes.andWhere('customer.createdAt <= :toDate', { toDate });
      // }

      // search anything
      if (params?.keyword) {
        cusRepRes.andWhere(
          new Brackets((sqb) => {
            sqb.where('customer.userType LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('customer.userId LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('customer.firstName LIKE :keyword', {
              keyword: `${params?.keyword}%`,
            });
            sqb.orWhere('customer.lastName LIKE :keyword', {
              keyword: `${params?.keyword}%`,
            });
            sqb.orWhere(
              "CONCAT_WS(' ', customer.firstName, customer.lastName) LIKE :keyword",
              {
                keyword: `${params?.keyword}%`,
              },
            );
          }),
        );
      }

      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = OtpLogsListSortEnum[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          cusRepRes.orderBy(sortField, sortOrder);
        }
      } else {
        cusRepRes.orderBy('createdAt', 'DESC');
      }

      // skip or take.
      if (params?.skip) {
        cusRepRes.skip(params.skip);
      }
      if (params?.take) {
        cusRepRes.take(params.take);
      }

      const asyncArray = await cusRepRes.getRawMany();
      return ResponseData.success(HttpStatus.OK, asyncArray);
    } catch (err) {
      console.log(
        '__________error__________getUserDetailsForOtpLogs___________________',
      );
      this.logger.error(`getUserDetailsForOtpLogs -> error -> ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, err.message);
    }
  }

  async dakhliGosi(idNumber) {
    this.logger.log(`[dakhliGosi] -> start`);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'PLATFORM-KEY': appConfig().dakhliPlatformKey,
        'ORGANIZATION-NUMBER': appConfig().dakhliOrganizationNumber,
        'REQUEST-REASON': appConfig().dakhliRequestReason,
        'App-id': appConfig().dakhliGosiAppId,
        'App-key': appConfig().dakhliGosiAppKey,
      };
      // this.logger.debug(`[dakhliGosi] headers : ${headers}`);
      this.logger.debug(`[dakhliGosi] api : ${appConfig().dakhliGosiApi}`);
      const gosi = await axios.get(appConfig().dakhliGosiApi + idNumber, {
        headers,
      });

      this.logger.debug(
        `[dakhliGosi] response : ${JSON.stringify(gosi?.data)}`,
      );
      return gosi;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        this.logger.error(
          `[dakhliGosi] -> Error in catch | gosi API message: ${JSON.stringify(
            err?.response?.data,
          )}`,
        );
      }

      return { data: err?.response?.data };
    }
  }
  async dakhliGovt(idNumber, dateOfBirth) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'PLATFORM-KEY': appConfig().dakhliPlatformKey,
        'ORGANIZATION-NUMBER': appConfig().dakhliOrganizationNumber,
        'REQUEST-REASON': appConfig().dakhliRequestReason,
        'App-id': appConfig().dakhliGovtAppId,
        'App-key': appConfig().dakhliGovtAppKey,
      };

      // this.logger.debug(`[dakhliGovt] headers : ${JSON.stringify(headers)}`);

      dateOfBirth = dateOfBirth.split('-').reverse().join('-');

      const dakhliGovtApi =
        appConfig().dakhliGovtApi + `?id=${idNumber}&birthDate=${dateOfBirth}`;

      this.logger.debug(`[dakhliGovt] api : ${dakhliGovtApi}`);
      const govt = await axios.get(dakhliGovtApi, {
        headers,
      });
      this.logger.debug(
        `[dakhliGovt] dakhli gosi response : ${JSON.stringify(govt?.data)}`,
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        this.logger.error(
          `[dakhliGovt] -> Error in catch | govt API message: ${JSON.stringify(
            err?.response?.data,
          )}`,
        );
      }
      return { data: err?.response?.data };
    }
  }
}

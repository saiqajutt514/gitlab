import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets } from 'typeorm';

import { errorMessage } from 'src/constants/errorMessage';
import { ResponseData } from 'src/helpers/responseHandler';
import { reviewsKafkaConfig, paymentKafkaConfig, captainKafkaConfig, captainTCPConfig, paymentTCPConfig, reviewsTCPConfig } from 'src/microServicesConfigs';
import { GET_META_REVIEW_BY_EXTERNAL, GET_META_REVIEWS, GET_REVIEWS, GET_USER_SUBSCRIPTION_COUNT, GET_SELECTED_CAPTAINS } from '../trips/constants/kafka-constants';
import { ReviewExternalType, UserExternalType } from '../trips/enums/driver.enum';
import { AddressType } from '../trip_address/trip_address.enum';
import { TripStatus } from '../trips/trips.enum';
import { getTripNumber, setTripNumber } from 'src/utils/generate-trn';

import { TripsRepository } from '../trips/trips.repository';
import { CustomerRepository } from '../customer/customer.repository';
import {
  RatingReportSort, RidersReportSort, DriverEarningsSort, TripsReportSort,
  RidersCancelledSort, DriverCancelledSort, DriverDeclinedSort
} from './reports.enum';
import { ListSearchSortDto } from './reports.interface';
import { getIsoDateTime } from 'src/utils/get-timestamp';
import { CustomLogger } from 'src/logger/customLogger';
import { TripsEntity } from '../trips/entities/trips.entity';
// import { ReviewsService } from '../reviews/reviews.service';

@Injectable()
export class ReportsService {

  constructor(
    @InjectRepository(CustomerRepository)
    private customerRepository: CustomerRepository,
    @InjectRepository(TripsRepository)
    private tripsRepository: TripsRepository,
    private customLogger: CustomLogger,
    @Inject('CLIENT_REVIEW_SERVICE_TCP') private clientReviewTCP: ClientProxy,
    @Inject('CLIENT_PAYMENT_SERVICE_TCP') private clientPaymentTCP: ClientProxy
    // private reviewService: ReviewsService
  ) {
    this.customLogger.setContext(ReportsService.name);
  }

  private logger = new Logger(ReportsService.name);

  // @Client({
  //   ...reviewsKafkaConfig,
  //   options:
  //   {
  //     ...reviewsKafkaConfig.options,
  //     consumer: {
  //       groupId: "reviews-consumer-ts-reports"
  //     }
  //   }
  // })
  // clientReviewKafka: ClientKafka

  // @Client({
  //   ...paymentKafkaConfig,
  //   options:
  //   {
  //     ...paymentKafkaConfig.options,
  //     consumer: {
  //       groupId: "payment-consumer-ts-reports"
  //     }
  //   }
  // })
  // clientPaymentKafka: ClientKafka

  // @Client({
  //   ...captainKafkaConfig,
  //   options:
  //   {
  //     ...captainKafkaConfig.options,
  //     consumer: {
  //       groupId: "captain-consumer-ts-reports"
  //     }
  //   }
  // })
  // clientCaptainKafka: ClientKafka
  @Client(captainTCPConfig)
  clientCaptain: ClientProxy

  onModuleInit() {
    // this.clientCaptainKafka.subscribeToResponseOf(GET_SELECTED_CAPTAINS);
    // this.clientPaymentKafka.subscribeToResponseOf(GET_USER_SUBSCRIPTION_COUNT);
    // this.clientReviewKafka.subscribeToResponseOf(GET_META_REVIEW_BY_EXTERNAL);
    // this.clientReviewKafka.subscribeToResponseOf(GET_META_REVIEWS);
    // this.clientReviewKafka.subscribeToResponseOf(GET_REVIEWS);
  }

  async getRatingsReport(params: ListSearchSortDto, type: string) {
    try {
      this.customLogger.start(`[getRatingsReport] | params: ${JSON.stringify(params)}`)
      const fields = [
        'trips.id', 'trips.tripNo', 'trips.createdAt', 'trips.riderReviewId', 'trips.driverReviewId', 'trips.status',
        'driver.driverId', 'driver.userId', 'driver.firstName', 'driver.lastName',
        'rider.id', 'rider.userId', 'rider.firstName', 'rider.lastName',
        'pickup.address', 'pickup.addressType', 'pickup.latitude', 'pickup.longitude',
        'dropoff.address', 'dropoff.addressType', 'dropoff.latitude', 'dropoff.longitude',
        'destination.address', 'destination.addressType', 'destination.latitude', 'destination.longitude'
      ]
      const ratingQryInstance = this.tripsRepository.createQueryBuilder("trips");
      ratingQryInstance.select(fields);
      ratingQryInstance.innerJoin("trips.rider", "rider");
      ratingQryInstance.innerJoin("trips.driver", "driver");
      ratingQryInstance.leftJoin("trips.pickup", "pickup", "pickup.addressType = :pickupType", { pickupType: AddressType.PICK_UP });
      ratingQryInstance.leftJoin("trips.dropoff", "dropoff", "dropoff.addressType = :dropoffType", { dropoffType: AddressType.DROP_OFF });
      ratingQryInstance.leftJoin("trips.destination", "destination", "destination.addressType = :destinationType", { destinationType: AddressType.DESTINATION });
      if (type === 'riders') {
        ratingQryInstance.where("trips.riderReviewId IS NOT NULL");
      } else if (type === 'captains') {
        ratingQryInstance.where("trips.driverReviewId IS NOT NULL");
      }
      //Admin Filters
      if (params?.filters?.tripNo) {
        ratingQryInstance.andWhere("trips.tripNo = :tripNo", { tripNo: setTripNumber(params?.filters?.tripNo) })
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        ratingQryInstance.andWhere("trips.createdAt >= :fromDate", { fromDate })
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(new Date(new Date(params?.filters?.createdAt[1]).setUTCHours(23,59,59,999)));
        ratingQryInstance.andWhere("trips.createdAt <= :toDate", { toDate })
      }
      if (params?.filters?.pickup) {
        ratingQryInstance.andWhere("pickup.address LIKE :pickup", { pickup: `${params?.filters?.pickup}%` });
      }
      if (params?.filters?.dropoff) {
        ratingQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("dropoff.address LIKE :dropoff", { dropoff: `${params?.filters?.dropoff}%` });
          sqb.orWhere("destination.address LIKE :dropoff", { dropoff: `${params?.filters?.dropoff}%` });
        }));
      }
      if (params?.filters?.status) {
        ratingQryInstance.andWhere("trips.status = :status", { status: params?.filters?.status });
      } else {
        ratingQryInstance.andWhere("trips.status IN (:...status)", {
          status: [ TripStatus.COMPLETED ]
        });
      }
      if (params?.filters?.riderName) {
        ratingQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("rider.firstName LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
          sqb.orWhere("rider.lastName LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
          sqb.orWhere("CONCAT_WS(' ', rider.firstName, rider.lastName) LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
        }));
      }
      if (params?.filters?.driverName) {
        ratingQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("driver.firstName LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
          sqb.orWhere("driver.lastName LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
          sqb.orWhere("CONCAT_WS(' ', driver.firstName, driver.lastName) LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
        }));
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = RatingReportSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          ratingQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        ratingQryInstance.orderBy('trips.createdAt', 'DESC');
      }
      ratingQryInstance.skip(params.skip);
      ratingQryInstance.take(params.take);
      const [result, total] = await ratingQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      let riderReviewList = [];
      let driverReviewList = [];
      if (type === 'riders') {
        const riderReviewIds = trips.map((data) => data?.riderReviewId).filter((el) => {
          return el != null
        });
        if (riderReviewIds && riderReviewIds.length > 0) {
          const { data: reviewData } = await this.clientReviewTCP.send(GET_REVIEWS, JSON.stringify(riderReviewIds)).pipe().toPromise();
          // const { data: reviewData } = await this.reviewService.getReviews(riderReviewIds);
          if (reviewData && reviewData.length > 0) {
            riderReviewList = reviewData;
          }
        }
      } else if (type === 'captains') {
        const driverReviewIds = trips.map((data) => data?.driverReviewId).filter((el) => {
          return el != null
        });
        if (driverReviewIds && driverReviewIds.length > 0) {
          const { data: reviewData } = await this.clientReviewTCP.send(GET_REVIEWS, JSON.stringify(driverReviewIds)).pipe().toPromise();
          // const { data: reviewData } = await this.reviewService.getReviews(driverReviewIds);
          if (reviewData && reviewData.length > 0) {
            driverReviewList = reviewData;
          }
        }
      }
      trips.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        if (data.driver) {
          data['driver']['fullName'] = `${data['driver']['firstName']} ${data['driver']['lastName']}`;
          delete data['driver']['firstName'];
          delete data['driver']['lastName'];

          if (type === 'captains') {
            const ratingInfo = driverReviewList.filter((rec) => rec.id == data.driverReviewId);
            if (ratingInfo && ratingInfo.length > 0) {
              data['driverReview'] = ratingInfo[0]['rating'];
            } else {
              data['driverReview'] = 0
            }
          }
        } else {
          data['driver'] = {}
        }
        if (data.rider) {
          data['rider']['fullName'] = `${data['rider']['firstName']} ${data['rider']['lastName']}`;
          delete data['rider']['firstName'];
          delete data['rider']['lastName'];

          if (type === 'riders') {
            const ratingInfo = riderReviewList.filter((rec) => rec.id == data.riderReviewId);
            if (ratingInfo && ratingInfo.length > 0) {
              data['riderReview'] = ratingInfo[0]['rating'];
            } else {
              data['riderReview'] = 0
            }
          }
        } else {
          data['rider'] = {}
        }
        delete data['riderReviewId'];
        delete data['driverReviewId'];

        if(!data?.pickup) {
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
      this.customLogger.end(`[getRatingsReport]`)
      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.logger.error(`[getRatingsReport] -> error -> ${e.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getRidersReport(params: ListSearchSortDto) {
    try {
      this.logger.debug(`[getRidersReport] -> params -> ${JSON.stringify(params)}`);
      const fields = [
        "customer.id", "customer.userId", "customer.firstName", "customer.lastName", "customer.emailId",
        "customer.mobileNo", "customer.profileImage", "customer.driverId", "customer.creationDate",
        "customer.totalRides", "customer.upcomingRides", "customer.userType", "customer.userStatus"
      ];
      const riderQryInstance = this.customerRepository.createQueryBuilder("customer");
      riderQryInstance.select(fields);
      riderQryInstance.where('customer.isRider = :isRider', { isRider: true });
      //Admin Filters
      if (params?.filters?.userId) {
        riderQryInstance.andWhere("customer.userId = :userId", { userId: params?.filters?.userId })
      }
      if (params?.filters?.fullName) {
        riderQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("customer.firstName LIKE :fullName", { fullName: `${params?.filters?.fullName}%` });
          sqb.orWhere("customer.lastName LIKE :fullName", { fullName: `${params?.filters?.fullName}%` });
          sqb.orWhere("CONCAT_WS(' ', customer.firstName, customer.lastName) LIKE :fullName", { fullName: `${params?.filters?.fullName}%` });
        }));
      }
      if (params?.filters?.emailId) {
        riderQryInstance.andWhere("customer.emailId LIKE :emailId", { emailId: `${params?.filters?.emailId}%` })
      }
      if (params?.filters?.mobileNo) {
        riderQryInstance.andWhere("customer.mobileNo LIKE :mobileNo", { mobileNo: `${params?.filters?.mobileNo}%` })
      }
      if (params?.filters?.creationDate && params?.filters?.creationDate[0]) {
        const fromDate = new Date(params?.filters?.creationDate[0]).getTime();
        riderQryInstance.andWhere("customer.creationDate >= :fromDate", { fromDate })
      }
      if (params?.filters?.creationDate && params?.filters?.creationDate[1]) {
        const toDate = new Date(new Date(params?.filters?.creationDate[1])).getTime();
        riderQryInstance.andWhere("customer.creationDate <= :toDate", { toDate })
      }
      if (typeof params?.filters?.totalRides === "number") {
        riderQryInstance.andWhere("customer.totalRides = :totalRides", { totalRides: params?.filters?.totalRides })
      }
      if (typeof params?.filters?.upcomingRides === "number") {
        riderQryInstance.andWhere("customer.upcomingRides = :upcomingRides", { upcomingRides: params?.filters?.upcomingRides })
      }
      if (typeof params?.filters?.userType === "number") {
        riderQryInstance.andWhere("customer.userType = :userType", { userType: params?.filters?.userType })
      }
      if (params?.filters?.status) {
        riderQryInstance.andWhere("customer.userStatus = :status", { status: params?.filters?.status })
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = RidersReportSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          riderQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        riderQryInstance.orderBy('customer.creationDate', 'DESC');
      }
      riderQryInstance.skip(params.skip);
      riderQryInstance.take(params.take);
      const [result, total] = await riderQryInstance.getManyAndCount();
      this.logger.debug(`[getRidersReport] -> results with total ${total}`);

      const totalCount: number = total;
      const riders: any = result;

      let riderReviewList = [];
      const externalIds = riders.map((data) => data?.userId).filter((el) => {
        return el != null
      });
      this.logger.debug(`[getRidersReport] -> isReviewDetail START -> ${JSON.stringify(externalIds)}`);
      if (externalIds && externalIds.length > 0) {
        const { data: reviewData } = await this.clientReviewTCP.send(GET_META_REVIEWS, JSON.stringify({ externalIds: externalIds, externalType: ReviewExternalType.Rider })).pipe().toPromise();
        // const { data: reviewData } = await this.reviewService.getMetaReviewByExternal({ externalIds: externalIds, externalType: ReviewExternalType.Rider });
        if (reviewData && reviewData.length > 0) {
          riderReviewList = reviewData;
        }
      }
      this.logger.debug(`[getRidersReport] -> isReviewDetail END -> ${JSON.stringify(externalIds)}`);

      this.logger.debug(`[getRidersReport] -> loop riders START -> ${riders.length}`);
      riders.map((data) => {
        data['fullName'] = `${data['firstName']} ${data['lastName']}`;
        delete data['firstName'];
        delete data['lastName'];

        const ratingInfo = riderReviewList.filter((rec) => rec.externalId == data.userId);
        if (ratingInfo && ratingInfo.length > 0) {
          data['overallRating'] = ratingInfo[0]['rating'];
          data['overallReviews'] = ratingInfo[0]['reviewCount'];
        } else {
          data['overallRating'] = 0;
          data['overallReviews'] = 0;
        }
        if (data['creationDate']) {
          data['creationDate'] = getIsoDateTime(new Date(Number(data['creationDate'])));
        }
      });
      this.logger.debug(`[getRidersReport] -> loop riders END -> ${riders.length}`);

      return ResponseData.success(HttpStatus.OK, { riders, totalCount });
    } catch (err) {
      this.logger.error(`[getRidersReport] -> error -> ${err.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getCaptainsEarningsReport(params: ListSearchSortDto) {
    try {
      this.customLogger.start(`[getCaptainsEarningsReport] | params: ${JSON.stringify(params)}`)

      const fields = [
        'customer.id',  'customer.userId', 'customer.driverId',
        'customer.firstName', 'customer.lastName', 'customer.profileImage',
        "customer.totalEarned", "customer.totalTrips", 'customer.creationDate'
      ]
      const earningsQryInstance = this.customerRepository.createQueryBuilder("customer");
      earningsQryInstance.select(fields);
      // Admin Filters
      earningsQryInstance.where('customer.userType = :userType', { userType: UserExternalType.Captain });
      earningsQryInstance.andWhere('customer.totalEarned > 0');
      if (typeof params?.filters?.userId === "number") {
        earningsQryInstance.andWhere("customer.userId = :userId", { userId: params?.filters?.userId })
      }
      if (typeof params?.filters?.totalEarned === "number") {
        earningsQryInstance.andWhere("totalEarned = :totalEarned", { totalEarned: params?.filters?.totalEarned });
      }
      if (typeof params?.filters?.totalTrips === "number") {
        earningsQryInstance.andWhere("customer.totalTrips = :totalTrips", { totalTrips: params?.filters?.totalTrips })
      }
      if (params?.filters?.fullName) {
        earningsQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("customer.firstName LIKE :fullName", { fullName: `${params?.filters?.fullName}%` });
          sqb.orWhere("customer.lastName LIKE :fullName", { fullName: `${params?.filters?.fullName}%` });
          sqb.orWhere("CONCAT_WS(' ', customer.firstName, customer.lastName) LIKE :fullName", { fullName: `${params?.filters?.fullName}%` });
        }));
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0] && params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        const toDate = getIsoDateTime(new Date(new Date(params?.filters?.createdAt[1]).setUTCHours(23, 59, 59, 999)));
        earningsQryInstance.andWhere(qb => {
          const subQuery = qb.subQuery()
              .select("trips.driverId")
              .from(TripsEntity, "trips")
              .where("trips.createdAt >= :fromDate AND trips.createdAt <= :toDate", { fromDate, toDate })
              .getQuery();
          return "customer.userId IN " + subQuery;
        })
      } else if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        earningsQryInstance.andWhere(qb => {
          const subQuery = qb.subQuery()
              .select("trips.driverId")
              .from(TripsEntity, "trips")
              .where("trips.createdAt >= :fromDate", { fromDate })
              .getQuery();
          return "customer.userId IN " + subQuery;
        })
      }
      // TODO: Rating Filter
      // TODO: Subscription Status Filter
      // TODO: Driver Status Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = DriverEarningsSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          earningsQryInstance.orderBy(sortField, sortOrder);
        }
      }
      earningsQryInstance.skip(params.skip);
      earningsQryInstance.take(params.take);
      const [result, total] = await earningsQryInstance.getManyAndCount();

      const totalCount: number = total;
      const earnings: any = result;

      let driverReviewList = [];
      {
        const externalIds = earnings.map((data) => data?.userId).filter((el) => {
          return el != null
        });
        this.logger.debug(`[getCaptainsEarningsReport] -> reviewDetail START -> ${JSON.stringify(externalIds)}`);
        if (externalIds && externalIds.length > 0) {
          const { data: reviewData } = await this.clientReviewTCP.send(GET_META_REVIEWS, JSON.stringify({ externalIds: externalIds, externalType: ReviewExternalType.Captain })).pipe().toPromise();
          // const { data: reviewData } = await this.reviewService.getMetaReviews({ externalIds: externalIds, externalType: ReviewExternalType.Captain });
          if (reviewData && reviewData.length > 0) {
            driverReviewList = reviewData;
          }
        }
        this.logger.debug(`[getCaptainsEarningsReport] -> reviewDetail END -> ${JSON.stringify(externalIds)}`);
      }

      let subscriptionList = [];
      {
        const externalIds = earnings.map((data) => data?.userId).filter((el) => {
          return el != null
        });
        this.logger.debug(`[getCaptainsEarningsReport] -> subscriptionCount START -> ${JSON.stringify(externalIds)}`);
        if (externalIds && externalIds.length > 0) {
          const { data: subscriptionData } = await this.clientPaymentTCP.send(GET_USER_SUBSCRIPTION_COUNT, JSON.stringify({ userIds: externalIds })).pipe().toPromise();
          if (subscriptionData && subscriptionData.length > 0) {
            subscriptionList = subscriptionData;
          }
        }
        this.logger.debug(`[getCaptainsEarningsReport] -> subscriptionCount END -> ${JSON.stringify(externalIds)}`);
      }

      let driversList = [];
      {
        const driverIds = earnings.map((data) => data?.userId).filter((el) => {
          return el != null
        });
        if (driverIds && driverIds.length > 0) {
          const { data: driverData } = await this.clientCaptain.send(GET_SELECTED_CAPTAINS, JSON.stringify({ externalIds: driverIds })).pipe().toPromise();
          if (driverData && driverData.length > 0) {
            this.logger.debug('received details from captain service for the drivers :'+driverIds.join(','))
            driversList = driverData;
          }
        }
      }

      earnings.map((data) => {
        data['fullName'] = `${data['firstName']} ${data['lastName']}`;
        delete data['firstName'];
        delete data['lastName'];

        const ratingInfo = driverReviewList.filter((rec) => rec.externalId == data.userId);
        if (ratingInfo && ratingInfo.length > 0) {
          data['overallRating'] = ratingInfo[0]['rating'];
          data['overallReviews'] = ratingInfo[0]['reviewCount'];
        } else {
          data['overallRating'] = 0;
          data['overallReviews'] = 0;
        }

        const subscribeInfo = subscriptionList.filter((rec) => rec.userId == data.userId);
        if (subscribeInfo && subscribeInfo.length > 0) {
          data['totalSubscriptions'] = Number(subscribeInfo[0]['totalSubscriptions']);
        } else {
          data['totalSubscriptions'] = 0;
        }
        const driverInfo = driversList.filter((rec) => rec.externalId == data.userId);
        if (driverInfo && driverInfo.length > 0) {
          data['driverModeSwitch'] = driverInfo[0]['driverModeSwitch'];
          data['approved'] = driverInfo[0]['approved'];
        } else {
          data['driverModeSwitch'] = false;
          data['approved'] = false;
        }
      });

      const totalQryInstance = this.customerRepository.createQueryBuilder("customer");
      totalQryInstance.select("SUM(customer.totalEarned) as totalEarnings");
      totalQryInstance.where('customer.userType = :userType', { userType: UserExternalType.Captain });
      const earningsResult = await totalQryInstance.getRawOne();
      const totalEarnings = Number(earningsResult?.totalEarnings)||0;

      this.customLogger.end(`[getCaptainsEarningsReport] -> success`)

      return ResponseData.success(HttpStatus.OK, { earnings, totalCount, totalEarnings });
    } catch (e) {
      this.logger.error(`getCaptainsEarningsReport -> error -> ${e.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getTripsReport(params: ListSearchSortDto) {
    try {
      this.customLogger.log(`[getTripsReport] params: ${JSON.stringify(params)}`)

      const fields = [
        'trips.id', 'trips.tripNo', 'trips.createdAt', 'trips.tripType', 'trips.status',
        'trips.riderAmount', 'trips.driverReviewId', 'trips.riderReviewId',
        'driver.driverId', 'driver.userId', 'driver.firstName', 'driver.lastName',
        'rider.id', 'rider.userId', 'rider.firstName', 'rider.lastName',
        'pickup.address', 'pickup.addressType', 'pickup.latitude', 'pickup.longitude',
        'dropoff.address', 'dropoff.addressType', 'dropoff.latitude', 'dropoff.longitude',
        'destination.address', 'destination.addressType', 'destination.latitude', 'destination.longitude'
      ]
      const tripQryInstance = this.tripsRepository.createQueryBuilder("trips");
      tripQryInstance.select(fields);
      tripQryInstance.innerJoin("trips.rider", "rider");
      tripQryInstance.leftJoin("trips.driver", "driver");
      tripQryInstance.leftJoin("trips.pickup", "pickup", "pickup.addressType = :pickupType", { pickupType: AddressType.PICK_UP });
      tripQryInstance.leftJoin("trips.dropoff", "dropoff", "dropoff.addressType = :dropoffType", { dropoffType: AddressType.DROP_OFF });
      tripQryInstance.leftJoin("trips.destination", "destination", "destination.addressType = :destinationType", { destinationType: AddressType.DESTINATION });
      //Admin Filters
      if (typeof params?.filters?.status === "number") {
        tripQryInstance.where("trips.status = :status", { status: params?.filters?.status });
      } else {
        tripQryInstance.where("trips.status IN (:...status)", {
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
            TripStatus.COMPLETED
          ]
        });
      }
      if (params?.filters?.tripNo) {
        tripQryInstance.andWhere("trips.tripNo = :tripNo", { tripNo: setTripNumber(params?.filters?.tripNo) })
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        tripQryInstance.andWhere("trips.createdAt >= :fromDate", { fromDate })
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(new Date(new Date(params?.filters?.createdAt[1]).setUTCHours(23, 59, 59, 999)));
        tripQryInstance.andWhere("trips.createdAt <= :toDate", { toDate })
      }
      if (typeof params?.filters?.riderAmount === "number") {
        tripQryInstance.andWhere("trips.riderAmount = :riderAmount", { riderAmount: params?.filters?.riderAmount });
      }
      if (typeof params?.filters?.tripType === "number") {
        tripQryInstance.andWhere("trips.tripType LIKE :tripType", { tripType: params?.filters?.tripType });
      }
      if (params?.filters?.pickup) {
        tripQryInstance.andWhere("pickup.address LIKE :pickup", { pickup: `${params?.filters?.pickup}%` });
      }
      if (params?.filters?.dropoff) {
        tripQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("dropoff.address LIKE :dropoff", { dropoff: `${params?.filters?.dropoff}%` });
          sqb.orWhere("destination.address LIKE :dropoff", { dropoff: `${params?.filters?.dropoff}%` });
        }));
      }
      if (params?.filters?.riderId) {
        tripQryInstance.andWhere("rider.userId = :riderId", { riderId: params?.filters?.riderId });
      }
      if (params?.filters?.riderName) {
        tripQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("rider.firstName LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
          sqb.orWhere("rider.lastName LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
          sqb.orWhere("CONCAT_WS(' ', rider.firstName, rider.lastName) LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
        }));
      }
      if (params?.filters?.driverId) {
        tripQryInstance.andWhere("driver.userId = :driverId", { driverId: params?.filters?.driverId });
      }
      if (params?.filters?.driverName) {
        tripQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("driver.firstName LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
          sqb.orWhere("driver.lastName LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
          sqb.orWhere("CONCAT_WS(' ', driver.firstName, driver.lastName) LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
        }));
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = TripsReportSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          tripQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        tripQryInstance.orderBy('trips.createdAt', 'DESC');
      }
      tripQryInstance.skip(params.skip);
      tripQryInstance.take(params.take);
      const [result, total] = await tripQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      const driverReviewIds = trips.map((data) => data?.driverReviewId).filter((el) => {
        return el != null
      });
      const riderReviewIds = trips.map((data) => data?.riderReviewId).filter((el) => {
        return el != null
      });
      const allReviewIds = driverReviewIds.concat(riderReviewIds);
      let reviewsList = [];
      if (allReviewIds && allReviewIds.length > 0) {
        const { data: reviewData } = await this.clientReviewTCP.send(GET_REVIEWS, JSON.stringify(allReviewIds)).pipe().toPromise();
        // const { data: reviewData } = await this.reviewService.getReviews(allReviewIds);
        if (reviewData && reviewData.length > 0) {
          reviewsList = reviewData;
        }
      }
      trips.map((data) => {
        data['tripNo'] = getTripNumber(data['tripNo']);
        if (data.rider) {
          data['rider']['fullName'] = `${data['rider']['firstName']} ${data['rider']['lastName']}`;
          delete data['rider']['firstName'];
          delete data['rider']['lastName'];

          const riderRatingInfo = reviewsList.filter((rec) => rec.id == data.riderReviewId);
          if (riderRatingInfo && riderRatingInfo.length > 0) {
            data['rider']['riderReview'] = riderRatingInfo[0]['rating'];
          } else {
            data['rider']['riderReview'] = 0
          }
        } else {
          data['rider'] = {}
        }
        delete data['riderReviewId'];
        if (data.driver) {
          data['driver']['fullName'] = `${data['driver']['firstName']} ${data['driver']['lastName']}`;
          delete data['driver']['firstName'];
          delete data['driver']['lastName'];

          const driverRatingInfo = reviewsList.filter((rec) => rec.id == data.driverReviewId);
          if (driverRatingInfo && driverRatingInfo.length > 0) {
            data['driver']['driverReview'] = driverRatingInfo[0]['rating'];
          } else {
            data['driver']['driverReview'] = 0
          }
        } else {
          data['driver'] = {}
        }
        delete data['driverReviewId'];

        if(!data?.pickup) {
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

      this.customLogger.log(`[getTripsReport] success`)
      return ResponseData.success(HttpStatus.OK, { trips, totalCount })
    } catch (e) {
      this.customLogger.error(`[getTripsReport] -> error -> ${e.message}`)
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG)
    }
  }

  async getTripsCancelledByRider(params: ListSearchSortDto) {
    try {
      this.customLogger.start(`[getTripsCancelledByRider] | params: ${JSON.stringify(params)}`)

      const fields = [
        'customer.id',  'customer.userId', 'customer.firstName', 'customer.lastName',
        'customer.profileImage', "customer.ridesCancelled", "customer.totalRides",
      ]
      const riderQryInstance = this.customerRepository.createQueryBuilder("customer");
      riderQryInstance.select(fields);
      // Admin Filters
      riderQryInstance.where(new Brackets(sqb => {
        sqb.where("customer.totalRides > 0");
        sqb.orWhere("customer.ridesCancelled > 0");
      }));
      if (typeof params?.filters?.userId === "number") {
        riderQryInstance.andWhere("customer.userId = :userId", { userId: params?.filters?.userId })
      }
      if (typeof params?.filters?.completedRides === "number") {
        riderQryInstance.andWhere("customer.totalRides = :completedRides", { completedRides: params?.filters?.completedRides })
      }
      if (typeof params?.filters?.ridesCancelled === "number") {
        riderQryInstance.andWhere("customer.ridesCancelled = :ridesCancelled", { ridesCancelled: params?.filters?.ridesCancelled });
      }
      if (typeof params?.filters?.totalRides === "number") {
        riderQryInstance.andWhere("(customer.totalRides + customer.ridesCancelled) = :totalRides", { totalRides: params?.filters?.totalRides })
      }
      if (params?.filters?.riderName) {
        riderQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("customer.firstName LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
          sqb.orWhere("customer.lastName LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
          sqb.orWhere("CONCAT_WS(' ', customer.firstName, customer.lastName) LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
        }));
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0] && params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        const toDate = getIsoDateTime(new Date(new Date(params?.filters?.createdAt[1]).setUTCHours(23, 59, 59, 999)));
        riderQryInstance.andWhere(qb => {
          const subQuery = qb.subQuery()
              .select("trips.riderId")
              .from(TripsEntity, "trips")
              .where("trips.createdAt >= :fromDate AND trips.createdAt <= :toDate", { fromDate, toDate })
              .getQuery();
          return "customer.userId IN " + subQuery;
        })
      } else if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        riderQryInstance.andWhere(qb => {
          const subQuery = qb.subQuery()
              .select("trips.riderId")
              .from(TripsEntity, "trips")
              .where("trips.createdAt >= :fromDate", { fromDate })
              .getQuery();
          return "customer.userId IN " + subQuery;
        })
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = RidersCancelledSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          riderQryInstance.orderBy(sortField, sortOrder);
        }
      }
      riderQryInstance.skip(params.skip);
      riderQryInstance.take(params.take);
      const [result, total] = await riderQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      let riderReviewList = [];
      {
        const externalIds = trips.map((data) => data?.userId).filter((el) => {
          return el != null
        });
        this.logger.debug(`[getTripsCancelledByRider] -> reviewDetail START -> ${JSON.stringify(externalIds)}`);
        if (externalIds && externalIds.length > 0) {
          const { data: reviewData } = await this.clientReviewTCP.send(GET_META_REVIEWS, JSON.stringify({ externalIds: externalIds, externalType: ReviewExternalType.Rider })).pipe().toPromise();
          // const { data: reviewData } = await this.reviewService.getMetaReviews({ externalIds: externalIds, externalType: ReviewExternalType.Rider });
          if (reviewData && reviewData.length > 0) {
            riderReviewList = reviewData;
          }
        }
        this.logger.debug(`[getTripsCancelledByRider] -> reviewDetail END -> ${JSON.stringify(externalIds)}`);
      }

      trips.map((data) => {
        data['completedRides'] = data.totalRides;
        data['totalRides'] = Number(data?.completedRides||0) + Number(data?.ridesCancelled||0);
        if (data?.ridesCancelled) {
          data['cancellation'] = Math.round((data.ridesCancelled / data.totalRides) * 100);
        } else {
          data['cancellation'] = 0;
        }

        const ratingInfo = riderReviewList.filter((rec) => rec.externalId == data.userId);
        if (ratingInfo && ratingInfo.length > 0) {
          data['overallRating'] = ratingInfo[0]['rating'];
          data['overallReviews'] = ratingInfo[0]['reviewCount'];
        } else {
          data['overallRating'] = 0;
          data['overallReviews'] = 0;
        }

        data['fullName'] = `${data.firstName} ${data.lastName}`;
        delete data['firstName'];
        delete data['lastName'];
      });
      this.customLogger.end(`[getTripsCancelledByRider] -> success`)

      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.logger.error(`[getTripsCancelledByRider] -> error -> ${e.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getTripsCancelledByCaptain(params: ListSearchSortDto) {
    try {
      this.customLogger.start(`[getTripsCancelledByCaptain] | params: ${JSON.stringify(params)}`)

      const fields = [
        'customer.id',  'customer.userId', 'customer.firstName', 'customer.lastName',
        'customer.profileImage', "customer.tripsCancelled", "customer.totalTrips", 'customer.driverId'
      ]
      const driverQryInstance = this.customerRepository.createQueryBuilder("customer");
      driverQryInstance.select(fields);
      // Admin Filters
      driverQryInstance.where(new Brackets(sqb => {
        sqb.where("customer.totalTrips > 0");
        sqb.orWhere("customer.tripsCancelled > 0");
      }));
      if (typeof params?.filters?.userId === "number") {
        driverQryInstance.andWhere("customer.userId = :userId", { userId: params?.filters?.userId })
      }
      if (typeof params?.filters?.completedTrips === "number") {
        driverQryInstance.andWhere("customer.totalTrips = :completedTrips", { completedTrips: params?.filters?.completedTrips })
      }
      if (typeof params?.filters?.tripsCancelled === "number") {
        driverQryInstance.andWhere("customer.tripsCancelled = :tripsCancelled", { tripsCancelled: params?.filters?.tripsCancelled });
      }
      if (typeof params?.filters?.totalTrips === "number") {
        driverQryInstance.andWhere("(customer.totalTrips + customer.tripsCancelled) = :totalTrips", { totalTrips: params?.filters?.totalTrips })
      }
      if (params?.filters?.driverName) {
        driverQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("customer.firstName LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
          sqb.orWhere("customer.lastName LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
          sqb.orWhere("CONCAT_WS(' ', customer.firstName, customer.lastName) LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
        }));
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0] && params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        const toDate = getIsoDateTime(new Date(new Date(params?.filters?.createdAt[1]).setUTCHours(23, 59, 59, 999)));
        driverQryInstance.andWhere(qb => {
          const subQuery = qb.subQuery()
              .select("trips.driverId")
              .from(TripsEntity, "trips")
              .where("trips.createdAt >= :fromDate AND trips.createdAt <= :toDate", { fromDate, toDate })
              .getQuery();
          return "customer.userId IN " + subQuery;
        })
      } else if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        driverQryInstance.andWhere(qb => {
          const subQuery = qb.subQuery()
              .select("trips.driverId")
              .from(TripsEntity, "trips")
              .where("trips.createdAt >= :fromDate", { fromDate })
              .getQuery();
          return "customer.userId IN " + subQuery;
        })
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = DriverCancelledSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          driverQryInstance.orderBy(sortField, sortOrder);
        }
      }
      driverQryInstance.skip(params.skip);
      driverQryInstance.take(params.take);
      const [result, total] = await driverQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      let driverReviewList = [];
      {
        const externalIds = trips.map((data) => data?.userId).filter((el) => {
          return el != null
        });
        this.logger.debug(`[getTripsCancelledByCaptain] -> reviewDetail START -> ${JSON.stringify(externalIds)}`);
        if (externalIds && externalIds.length > 0) {
          const { data: reviewData } = await this.clientReviewTCP.send(GET_META_REVIEWS, JSON.stringify({ externalIds: externalIds, externalType: ReviewExternalType.Captain })).pipe().toPromise();
          // const { data: reviewData } = await this.reviewService.getMetaReviews({ externalIds: externalIds, externalType: ReviewExternalType.Captain });
          if (reviewData && reviewData.length > 0) {
            driverReviewList = reviewData;
          }
        }
        this.logger.debug(`[getTripsCancelledByCaptain] -> reviewDetail END -> ${JSON.stringify(externalIds)}`);
      }

      trips.map((data) => {
        data['completedTrips'] = data.totalTrips;
        data['totalTrips'] = Number(data?.completedTrips||0) + Number(data?.tripsCancelled||0);
        if (data?.tripsCancelled) {
          //data['cancellation'] = Math.round((data.totalTrips / data.tripsCancelled) * 100);
          data['cancellation'] = Math.round((data.tripsCancelled / data.totalTrips) * 100);
        } else {
          data['cancellation'] = 0;
        }

        const ratingInfo = driverReviewList.filter((rec) => rec.externalId == data.userId);
        if (ratingInfo && ratingInfo.length > 0) {
          data['overallRating'] = ratingInfo[0]['rating'];
          data['overallReviews'] = ratingInfo[0]['reviewCount'];
        } else {
          data['overallRating'] = 0;
          data['overallReviews'] = 0;
        }

        data['fullName'] = `${data.firstName} ${data.lastName}`;
        delete data['firstName'];
        delete data['lastName'];
      });
      this.customLogger.end(`[getTripsCancelledByCaptain] -> success`)

      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.logger.error(`[getTripsCancelledByCaptain] -> error -> ${e.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

  async getTripsDeclinedByCaptain(params: ListSearchSortDto) {
    try {
      this.customLogger.start(`[getTripsDeclinedByCaptain] | params: ${JSON.stringify(params)}`)

      const fields = [
        'customer.id',  'customer.userId', 'customer.firstName', 'customer.lastName', 'customer.userStatus',
        'customer.profileImage', "customer.tripsDeclined", "customer.totalTrips", 'customer.driverId'
      ]
      const driverQryInstance = this.customerRepository.createQueryBuilder("customer");
      driverQryInstance.select(fields);
      // Admin Filters
      driverQryInstance.where(new Brackets(sqb => {
        sqb.where("customer.totalTrips > 0");
        sqb.orWhere("customer.tripsDeclined > 0");
      }));
      if (typeof params?.filters?.userId === "number") {
        driverQryInstance.andWhere("customer.userId = :userId", { userId: params?.filters?.userId })
      }
      if (typeof params?.filters?.totalTrips === "number") {
        driverQryInstance.andWhere("customer.totalTrips = :totalTrips", { totalTrips: params?.filters?.totalTrips })
      }
      if (typeof params?.filters?.tripsDeclined === "number") {
        driverQryInstance.andWhere("customer.tripsDeclined = :tripsDeclined", { tripsDeclined: params?.filters?.tripsDeclined });
      }
      if (params?.filters?.driverName) {
        driverQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("customer.firstName LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
          sqb.orWhere("customer.lastName LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
          sqb.orWhere("CONCAT_WS(' ', customer.firstName, customer.lastName) LIKE :driverName", { driverName: `${params?.filters?.driverName}%` });
        }));
      }
      if (params?.filters?.status) {
        driverQryInstance.andWhere("customer.userStatus = :status", { status: params?.filters?.status })
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0] && params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        const toDate = getIsoDateTime(new Date(new Date(params?.filters?.createdAt[1]).setUTCHours(23, 59, 59, 999)));
        driverQryInstance.andWhere(qb => {
          const subQuery = qb.subQuery()
              .select("trips.driverId")
              .from(TripsEntity, "trips")
              .where("trips.createdAt >= :fromDate AND trips.createdAt <= :toDate", { fromDate, toDate })
              .getQuery();
          return "customer.userId IN " + subQuery;
        })
      } else if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        driverQryInstance.andWhere(qb => {
          const subQuery = qb.subQuery()
              .select("trips.driverId")
              .from(TripsEntity, "trips")
              .where("trips.createdAt >= :fromDate", { fromDate })
              .getQuery();
          return "customer.userId IN " + subQuery;
        })
      }
      // TODO: Rating Filter
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = DriverDeclinedSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          driverQryInstance.orderBy(sortField, sortOrder);
        }
      }
      driverQryInstance.skip(params.skip);
      driverQryInstance.take(params.take);
      const [result, total] = await driverQryInstance.getManyAndCount();

      const totalCount: number = total;
      const trips: any = result;

      let driverReviewList = [];
      {
        const externalIds = trips.map((data) => data?.userId).filter((el) => {
          return el != null
        });
        this.logger.debug(`[getTripsDeclinedByCaptain] -> reviewDetail START -> ${JSON.stringify(externalIds)}`);
        if (externalIds && externalIds.length > 0) {
          const { data: reviewData } = await this.clientReviewTCP.send(GET_META_REVIEWS, JSON.stringify({ externalIds: externalIds, externalType: ReviewExternalType.Captain })).pipe().toPromise();
          // const { data: reviewData } = await this.reviewService.getMetaReviews({ externalIds: externalIds, externalType: ReviewExternalType.Captain });
          if (reviewData && reviewData.length > 0) {
            driverReviewList = reviewData;
          }
        }
        this.logger.debug(`[getTripsDeclinedByCaptain] -> reviewDetail END -> ${JSON.stringify(externalIds)}`);
      }

      let driversList = [];
      {
        const driverIds = trips.map((data) => data?.userId).filter((el) => {
          return el != null
        });
        if (driverIds && driverIds.length > 0) {
          const { data: driverData } = await this.clientCaptain.send(GET_SELECTED_CAPTAINS, JSON.stringify({ externalIds: driverIds })).pipe().toPromise();
          if (driverData && driverData.length > 0) {
            this.logger.debug('received details from captain service for the drivers :'+driverIds.join(','))
            driversList = driverData;
          }
        }
      }

      trips.map((data) => {
        data['fullName'] = `${data.firstName} ${data.lastName}`;
        delete data['firstName'];
        delete data['lastName'];

        const ratingInfo = driverReviewList.filter((rec) => rec.externalId == data.userId);
        if (ratingInfo && ratingInfo.length > 0) {
          data['overallRating'] = ratingInfo[0]['rating'];
          data['overallReviews'] = ratingInfo[0]['reviewCount'];
        } else {
          data['overallRating'] = 0;
          data['overallReviews'] = 0;
        }

        const driverInfo = driversList.filter((rec) => rec.externalId == data.userId);
        if (driverInfo && driverInfo.length > 0) {
          data['driverModeSwitch'] = driverInfo[0]['driverModeSwitch'];
        } else {
          data['driverModeSwitch'] = false;
        }
      });
      this.customLogger.end(`[getTripsDeclinedByCaptain] -> success`)

      return ResponseData.success(HttpStatus.OK, { trips, totalCount });
    } catch (e) {
      this.logger.error(`[getTripsDeclinedByCaptain] -> error -> ${e.message}`);
      return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage.SOMETHING_WENT_WRONG);
    }
  }

}
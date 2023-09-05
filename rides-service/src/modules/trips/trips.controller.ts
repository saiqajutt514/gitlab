import { Controller, HttpStatus, Logger } from '@nestjs/common';

import { TripsService } from './trips.service';
import {
  AdminModeDTO,
  ScheduleTripsCreateDTO,
  TripIdParamDto,
  TripsCreateDTO,
  TripUploadPhotoDto,
} from './dto/trips.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { Transport } from '@nestjs/microservices';

import { TripScheduleRiderDto } from './dto/trip-schedule-rider.dto';
import {
  TRIP_INITIALIZE,
  CHANGE_TRIP_DESTINATION,
  CONFIRM_SCHEDULE_TRIP,
  CREATE_SCHEDULE_TRIP,
  CREATE_TRIP,
  DECLINE_SCHEDULE_TRIP,
  DRIVER_COMPLETED_TRIPS,
  GET_ALL_DRIVER_TRIPS,
  GET_ALL_RIDER_TRIPS,
  RIDER_CANCELLED_TRIPS,
  RIDER_COMPLETED_TRIPS,
  TRIP_COMPLETED,
  TRIP_STARTED,
  DRIVER_CANCELLED_TRIPS,
  TRIP_DETAIL_BY_ID,
  DRIVER_REACHED,
  DRIVER_ACCEPTS_TRIP,
  DRIVER_REJECTS_TRIP,
  DRIVER_CANCELS_TRIP,
  RIDER_CANCELS_TRIP,
  TRIP_ESTIMATE_COST,
  GET_RIDER_FUTURE_TRIPS,
  RIDER_RECENT_ADDRESS,
  CAN_REVIEW,
  CREATE_TRIP_REVIEW,
  TRIP_DETAIL,
  GET_ALL_TRIPS,
  UPLOAD_TRIP_PHOTO,
  DASHBOARD_TRIP_STATS,
  DASHBOARD_ACTIVE_RIDERS,
  DASHBOARD_STATUS_WISE_COUNT,
  DASHBOARD_STATS,
  DASHBOARD_CANCEL_SUMMARY,
  ACCEPT_TRIP_WITH_ALL_CABS,
  DECLINE_TRIP_WITH_ALL_CABS,
  ADMIN_CANCELS_TRIP,
  RIDER_CANCELS_BOOKING,
  CHECK_TRIP_DETAIL,
  GET_ALL_EMERGENCY_TRIPS,
  GET_ALL_DISPATCHER_TRIPS,
  GET_ALL_INCOMPLETE_TRIPS,
  GET_TRIP_ESTIMATED_COST,
  GET_TRIP_ESTIMATED_COST_SOCKET,
  TRIP_INVOICE_BY_ID,
  GET_CHAT_USER_LAST_SEEN_AND_LOC,
} from './constants/kafka-constants';
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
import { TripStartedBodyDto } from './dto/trip-started.dto';
import { DistanceDto, CabIdDto, TimeDto } from './dto/estimate-cost.dto';
import { ChangeTripDestinationDto } from './dto/change-destination.dto';
import { SaveReviewDto } from './dto/save-review.dto';
import {
  ListSearchSortDto,
  TripChangeDestinationInterface,
  StatsParams,
  DriverIdInterface,
  TripEstimatedCostForAdmin,
  CabCalcParams,
  TripEstimatedCostForSocket,
} from './interface/trips.interface';
import { LoggerHandler } from 'src/helpers/logger.handler';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';

@Controller('trips')
export class TripsController {
  private customLogger = new LoggerHandler(TripsController.name).getInstance();
  constructor(private tripsService: TripsService) {}

  // ----------------- START MessagePattern ------------------//

  @MessagePattern(GET_ALL_TRIPS, Transport.TCP)
  async showAllPaginatedTrips(@Payload() payload) {
    this.customLogger.msgPattern('GET_ALL_TRIPS');
    const message: ListSearchSortDto = JSON.parse(payload);
    return await this.tripsService.findAll(message);
  }

  @MessagePattern(CREATE_TRIP, Transport.TCP)
  async createTripHandler(@Payload() payload) {
    this.customLogger.msgPattern('CREATE_TRIP');
    const message: TripsCreateDTO & CabCalcParams = JSON.parse(payload);
    return await this.tripsService.createTrip(message);
  }

  // @MessagePattern(CREATE_SCHEDULE_TRIP, Transport.TCP)
  // async createScheduleTripHandler(@Payload() payload) {
  //   this.customLogger.msgPattern('CREATE_SCHEDULE_TRIP');
  //   const message: ScheduleTripsCreateDTO = JSON.parse(payload);
  //   return await this.tripsService.createScheduleTrip(message);
  // }

  @MessagePattern(ACCEPT_TRIP_WITH_ALL_CABS, Transport.TCP)
  async acceptTripWithAllCabsHandler(@Payload() payload) {
    this.customLogger.msgPattern('ACCEPT_TRIP_WITH_ALL_CABS');
    const message: TripIdParamDto & RiderIdDto = JSON.parse(payload);
    return await this.tripsService.acceptTripWithAllCabs(message);
  }

  @MessagePattern(DECLINE_TRIP_WITH_ALL_CABS, Transport.TCP)
  async declineTripWithAllCabsHandler(@Payload() payload) {
    this.customLogger.msgPattern('DECLINE_TRIP_WITH_ALL_CABS');
    const message: TripIdParamDto & RiderIdDto = JSON.parse(payload);
    return await this.tripsService.declineTripWithAllCabs(message);
  }

  @MessagePattern(CONFIRM_SCHEDULE_TRIP, Transport.TCP)
  async confirmScheduleTripHandler(@Payload() payload) {
    this.customLogger.msgPattern('CONFIRM_SCHEDULE_TRIP');
    const message: TripScheduleRiderDto = JSON.parse(payload);
    return await this.tripsService.acceptScheduledTrip(message);
  }

  @MessagePattern(DECLINE_SCHEDULE_TRIP, Transport.TCP)
  async declineScheduleTrip(@Payload() payload) {
    this.customLogger.msgPattern('DECLINE_SCHEDULE_TRIP');
    const message: TripScheduleRiderDto = JSON.parse(payload);
    return await this.tripsService.declineScheduledTrip(message);
  }

  @MessagePattern(RIDER_RECENT_ADDRESS, Transport.TCP)
  async getRecentAddressesHandler(@Payload() payload) {
    this.customLogger.msgPattern('RIDER_RECENT_ADDRESS');
    const message: RiderIdDto = JSON.parse(payload);
    return await this.tripsService.getRecentAddresses(message);
  }

  @MessagePattern(GET_RIDER_FUTURE_TRIPS, Transport.TCP)
  async getFutureTripsHandler(@Payload() payload) {
    this.customLogger.msgPattern('GET_RIDER_FUTURE_TRIPS');
    const message: RiderIdDto = JSON.parse(payload);
    return await this.tripsService.getFutureTrips(message);
  }

  @MessagePattern(RIDER_COMPLETED_TRIPS, Transport.TCP)
  async completedTripsByRiderHandler(@Payload() payload) {
    this.customLogger.msgPattern('RIDER_COMPLETED_TRIPS');
    const message: RiderIdDto = JSON.parse(payload);
    return await this.tripsService.getCompletedTripsByRider(message);
  }

  @MessagePattern(DRIVER_COMPLETED_TRIPS, Transport.TCP)
  async completedTripsByDriverHandler(@Payload() payload) {
    this.customLogger.msgPattern('DRIVER_COMPLETED_TRIPS');
    const message: DriverIdDto = JSON.parse(payload);
    return await this.tripsService.getCompletedTripsByDriver(message);
  }

  @MessagePattern(GET_ALL_RIDER_TRIPS, Transport.TCP)
  async getAllTripsByRiderHandler(@Payload() payload) {
    this.customLogger.msgPattern('GET_ALL_RIDER_TRIPS');
    const message: RiderIdDto = JSON.parse(payload);
    return await this.tripsService.getAllTripsByRider(message);
  }

  @MessagePattern(GET_ALL_DRIVER_TRIPS, Transport.TCP)
  async getAllTripsByDriverHandler(@Payload() payload) {
    this.customLogger.msgPattern('GET_ALL_DRIVER_TRIPS');
    const message: DriverIdDto = JSON.parse(payload);
    return await this.tripsService.getAllTripsByDriver(message);
  }

  @MessagePattern(RIDER_CANCELLED_TRIPS, Transport.TCP)
  async getCancelledTripsByRiderHandler(@Payload() payload) {
    this.customLogger.msgPattern('RIDER_CANCELLED_TRIPS');
    const message: RiderIdDto = JSON.parse(payload);
    return await this.tripsService.getCancelledTripsByRider(message);
  }

  @MessagePattern(DRIVER_CANCELLED_TRIPS, Transport.TCP)
  async getCancelledTripsByDriverHandler(@Payload() payload) {
    this.customLogger.msgPattern('DRIVER_CANCELLED_TRIPS');
    const message: DriverIdDto = JSON.parse(payload);
    return await this.tripsService.getCancelledTripsByDriver(message);
  }

  @MessagePattern(CHECK_TRIP_DETAIL, Transport.TCP)
  async checkTripDetailsHandler(@Payload() payload) {
    this.customLogger.msgPattern('CHECK_TRIP_DETAIL');
    const message: RiderIdDto & DriverIdInterface = JSON.parse(payload);
    return await this.tripsService.checkTripDetails(message);
  }

  @MessagePattern(TRIP_DETAIL_BY_ID, Transport.TCP)
  async getTripDetailsHandler(@Payload() payload) {
    this.customLogger.msgPattern('TRIP_DETAIL_BY_ID');
    const message: TripIdParamDto & AdminModeDTO = JSON.parse(payload);
    return await this.tripsService.getTripDetails(message);
  }

  @MessagePattern(TRIP_INVOICE_BY_ID, Transport.TCP)
  async getTripInvoiceByIdHandler(@Payload() payload) {
    this.customLogger.msgPattern('TRIP_INVOICE_BY_ID');
    const message: TripIdParamDto & AdminModeDTO = JSON.parse(payload);
    return await this.tripsService.getTripInvoice(message);
  }

  @MessagePattern(DRIVER_REACHED, Transport.TCP)
  async driverReachedAtPickUpPointHandler(@Payload() payload) {
    this.customLogger.msgPattern('DRIVER_REACHED');
    const message: TripIdParamDto & DriverIdDto = JSON.parse(payload);
    return await this.tripsService.driverReachedAtPickUpPoint(message);
  }

  // Trip Accepted By Driver
  @MessagePattern(DRIVER_ACCEPTS_TRIP, Transport.TCP)
  async tripAcceptedByDriver(@Payload() payload) {
    this.customLogger.msgPattern('DRIVER_ACCEPTS_TRIP');
    const message: TripIdParamDto & DriverIdDto & SessionIdDto = JSON.parse(
      payload,
    );
    return await this.tripsService.tripAcceptedByDriver(message);
  }

  // Trip Declined By Driver
  @MessagePattern(DRIVER_REJECTS_TRIP, Transport.TCP)
  async tripRejectedByDriver(@Payload() payload) {
    this.customLogger.msgPattern('DRIVER_REJECTS_TRIP');
    const message: TripIdParamDto & DriverTripRejectCancelDto = JSON.parse(
      payload,
    );
    return await this.tripsService.tripRejectedByDriver(message);
  }

  // Trip Cancelled By Driver
  @MessagePattern(DRIVER_CANCELS_TRIP, Transport.TCP)
  async tripCancelledByDriver(@Payload() payload) {
    this.customLogger.msgPattern('DRIVER_CANCELS_TRIP');
    const message: TripIdParamDto &
      DriverTripRejectCancelDto &
      SessionIdDto = JSON.parse(payload);
    return await this.tripsService.tripCancelledByDriver(message);
  }

  @MessagePattern(TRIP_STARTED, Transport.TCP)
  async tripStartedHandler(@Payload() payload) {
    this.customLogger.msgPattern('TRIP_STARTED');
    const message: TripIdParamDto &
      TripStartedBodyDto &
      DriverIdDto = JSON.parse(payload);
    return await this.tripsService.tripStarted(message);
  }

  @MessagePattern(RIDER_CANCELS_TRIP, Transport.TCP)
  async tripCancelledByRider(@Payload() payload) {
    this.customLogger.msgPattern('RIDER_CANCELS_TRIP');
    const message: TripIdParamDto &
      RiderTripCancelDto &
      RiderIdDto = JSON.parse(payload);
    return await this.tripsService.tripCancelledByRider(message);
  }

  @MessagePattern(ADMIN_CANCELS_TRIP, Transport.TCP)
  async tripCancelledByAdmin(@Payload() payload) {
    this.customLogger.msgPattern('ADMIN_CANCELS_TRIP');
    const message: TripIdParamDto &
      AdminTripCancelDto &
      AdminIdDto = JSON.parse(payload);
    return await this.tripsService.tripCancelledByAdmin(message);
  }

  @MessagePattern(TRIP_COMPLETED, Transport.TCP)
  async tripCompleted(@Payload() payload) {
    this.customLogger.msgPattern('TRIP_COMPLETED');
    const message: TripChangeDestinationInterface & SessionIdDto = JSON.parse(
      payload,
    );
    return await this.tripsService.tripCompleted(message);
  }

  @MessagePattern(TRIP_ESTIMATE_COST, Transport.TCP)
  async estimateFareAmount(@Payload() payload) {
    this.customLogger.msgPattern('TRIP_ESTIMATE_COST');
    const message: CabIdDto &
      DistanceDto &
      TimeDto &
      CabCalcParams = JSON.parse(payload);
    const { distance, time = 0, country = '', city = '' } = message;
    const amount = await this.tripsService.estimateFareAmount(message?.cabId, {
      distance,
      time,
      country,
      city,
    });
    return ResponseData.success({ amount });
  }

  @MessagePattern(CAN_REVIEW, Transport.TCP)
  async canReview(@Payload() message) {
    this.customLogger.msgPattern('CAN_REVIEW');
    message = JSON.parse(message);
    const { externalId, externalType, driverId } = message;
    return await this.tripsService.canReview(
      externalId,
      externalType,
      driverId,
    );
  }

  @MessagePattern(CREATE_TRIP_REVIEW, Transport.TCP)
  async saveReviewHandler(@Payload() payload) {
    this.customLogger.msgPattern('CREATE_TRIP_REVIEW');
    const message: SaveReviewDto & TripIdParamDto = JSON.parse(payload);
    return await this.tripsService.saveReview(message);
  }

  @MessagePattern(CHANGE_TRIP_DESTINATION, Transport.TCP)
  async changeTripDestination(@Payload() payload) {
    this.customLogger.msgPattern('CHANGE_TRIP_DESTINATION');
    const message: TripIdParamDto &
      ChangeTripDestinationDto &
      RiderIdDto &
      SessionIdDto = JSON.parse(payload);
    return await this.tripsService.changeTripDestination(message);
  }

  @MessagePattern(UPLOAD_TRIP_PHOTO, Transport.TCP)
  async uploadPhotoHandler(@Payload() payload) {
    this.customLogger.msgPattern('UPLOAD_TRIP_PHOTO');
    const message: TripIdParamDto & TripUploadPhotoDto = JSON.parse(payload);
    return await this.tripsService.uploadPhoto(message);
  }

  @MessagePattern(DASHBOARD_STATS, Transport.TCP)
  async getDashboardStats(@Payload() payload) {
    this.customLogger.msgPattern('DASHBOARD_STATS');
    const message: StatsParams = JSON.parse(payload);
    return await this.tripsService.getDashboardStats(message);
  }

  @MessagePattern(DASHBOARD_TRIP_STATS, Transport.TCP)
  async getStats(@Payload() payload) {
    this.customLogger.msgPattern('DASHBOARD_TRIP_STATS');
    const message: StatsParams = JSON.parse(payload);
    return await this.tripsService.getTripStats(message);
  }

  @MessagePattern(DASHBOARD_ACTIVE_RIDERS, Transport.TCP)
  async getActiveRiders(@Payload() payload) {
    this.customLogger.msgPattern('DASHBOARD_ACTIVE_RIDERS');
    const message: StatsParams = JSON.parse(payload);
    return await this.tripsService.getActiveRiders(message);
  }

  @MessagePattern(DASHBOARD_STATUS_WISE_COUNT, Transport.TCP)
  async getStatuswiseStats(@Payload() payload) {
    this.customLogger.msgPattern('DASHBOARD_STATUS_WISE_COUNT');
    const message: StatsParams = JSON.parse(payload);
    return await this.tripsService.getStatuswiseCount(message);
  }

  @MessagePattern(DASHBOARD_CANCEL_SUMMARY, Transport.TCP)
  async getCancelSummary(@Payload() payload) {
    this.customLogger.msgPattern('DASHBOARD_CANCEL_SUMMARY');
    const message: StatsParams = JSON.parse(payload);
    return await this.tripsService.getCancelSummary(message);
  }

  @MessagePattern(TRIP_DETAIL, Transport.TCP)
  async fetchTripDetail(@Payload() payload) {
    this.customLogger.msgPattern('TRIP_DETAIL');
    const message: TripIdParamDto & DriverIdInterface = JSON.parse(payload);
    return await this.tripsService.getRunningTripDetail(message);
  }

  // Trip Declined By Driver
  @MessagePattern(RIDER_CANCELS_BOOKING, Transport.TCP)
  async tripReqCancelByRider(@Payload() payload) {
    this.customLogger.msgPattern('RIDER_CANCELS_BOOKING');
    const message: TripIdParamDto & RiderIdDto = JSON.parse(payload);
    return await this.tripsService.tripReqCancelByRider(message);
  }

  // Emergency Trips
  @MessagePattern(GET_ALL_EMERGENCY_TRIPS, Transport.TCP)
  async getAllEmergencyTrips(@Payload() payload) {
    this.customLogger.msgPattern('GET_ALL_EMERGENCY_TRIPS');
    const message: ListSearchSortDto = JSON.parse(payload);
    return await this.tripsService.findAllEmergencyTrips(message);
  }

  // Dispatcher Trips
  @MessagePattern(GET_ALL_DISPATCHER_TRIPS, Transport.TCP)
  async showAllPaginatedDispatcherTrips(@Payload() payload) {
    this.customLogger.msgPattern('GET_ALL_DISPATCHER_TRIPS');
    const message: ListSearchSortDto = JSON.parse(payload);
    return await this.tripsService.findAllDispatcherTrips(message);
  }

  @MessagePattern(GET_ALL_INCOMPLETE_TRIPS, Transport.TCP)
  async showAllPaginatedIncompleteTrips(@Payload() payload) {
    this.customLogger.msgPattern('GET_ALL_INCOMPLETE_TRIPS');
    const message: ListSearchSortDto = JSON.parse(payload);
    return await this.tripsService.findAllIncompleteTrips(message);
  }

  @MessagePattern(GET_TRIP_ESTIMATED_COST, Transport.TCP)
  async getEstimatedTripCost(@Payload() payload) {
    this.customLogger.msgPattern('GET_TRIP_ESTIMATED_COST');
    const message: TripEstimatedCostForAdmin = JSON.parse(payload);
    return await this.tripsService.getTripEstimatedCostForAdmin(message);
  }

  @MessagePattern(GET_TRIP_ESTIMATED_COST_SOCKET, Transport.TCP)
  async getEstimatedCost(@Payload() payload) {
    this.customLogger.msgPattern('GET_TRIP_ESTIMATED_COST_SOCKET');
    const message: any = JSON.parse(payload);
    return await this.tripsService.getEstimatedCost(message);
  }

  @MessagePattern(GET_CHAT_USER_LAST_SEEN_AND_LOC, Transport.TCP)
  async gegetLastSeenAndLoc(@Payload() payload) {
    this.customLogger.msgPattern('GET_CHAT_USER_LAST_SEEN_AND_LOC');
    console.log(payload);
    return await this.tripsService.getLastSeenAndLoc(payload.userId);
  }

  // ----------------- END MessagePattern ------------------/

  // ----------------- START EventPattern ------------------//

  @EventPattern(TRIP_INITIALIZE, Transport.KAFKA)
  processTripFromKafka(@Payload() message) {
    this.customLogger.eventPattern('TRIP_INITIALIZE');
    try {
      Logger.log('Message received', JSON.stringify({ message }));
      this.tripsService.processTripFromKafka(message.value);
    } catch (e) {
      Logger.error('error', e);
    }
  }

  // ----------------- END EventPattern ------------------//
}

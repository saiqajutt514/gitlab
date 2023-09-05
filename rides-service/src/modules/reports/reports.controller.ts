import { Controller, HttpStatus, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from "@nestjs/microservices";

import { Transport } from "@nestjs/microservices";

import {
  GET_RIDERS_RATING ,
  GET_CAPTAINS_RATING,
  GET_RIDERS_REPORT,
  GET_CAPTAINS_EARNINGS_REPORT,
  GET_TRIPS_REPORT,
  GET_TRIPS_CANCELLED_BY_RIDER_REPORT,
  GET_TRIPS_CANCELLED_BY_CAPTAIN_REPORT,
  GET_TRIPS_DECLINED_BY_CAPTAIN_REPORT
} from './kafka-constants';

import { ReportsService } from './reports.service';
import { ListSearchSortDto } from './reports.interface';
import { CustomLogger } from 'src/logger/customLogger';

@Controller('reports')
export class ReportsController {

  constructor(
    private reportsService: ReportsService,
    private customLogger: CustomLogger
  ) {
    this.customLogger.setContext(ReportsController.name);
  }

  private logger = new Logger(ReportsController.name);

  @MessagePattern(GET_RIDERS_RATING, Transport.TCP)
  async getRidersRatingReport(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_RIDERS_RATING}::recv -> ${message}`);
    const criteria: ListSearchSortDto = JSON.parse(message);
    const type: string = 'riders';
    return await this.reportsService.getRatingsReport(criteria, type);
  }

  @MessagePattern(GET_CAPTAINS_RATING, Transport.TCP)
  async getCaptainsRatingReport(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_CAPTAINS_RATING}::recv -> ${message}`);
    const criteria: ListSearchSortDto = JSON.parse(message)
    const type: string = 'captains';
    return await this.reportsService.getRatingsReport(criteria, type);
  }

  @MessagePattern(GET_RIDERS_REPORT, Transport.TCP)
  async getRidersReport(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_RIDERS_REPORT}::recv -> ${message}`);
    const criteria: ListSearchSortDto = JSON.parse(message);
    return await this.reportsService.getRidersReport(criteria);
  }

  @MessagePattern(GET_CAPTAINS_EARNINGS_REPORT, Transport.TCP)
  async getCaptainsEarningsReport(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_CAPTAINS_EARNINGS_REPORT}::recv -> ${message}`);
    const criteria: ListSearchSortDto = JSON.parse(message);
    return await this.reportsService.getCaptainsEarningsReport(criteria);
  }

  @MessagePattern(GET_TRIPS_REPORT, Transport.TCP)
  async getTripsReport(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_TRIPS_REPORT}::recv -> ${message}`);
    const criteria: ListSearchSortDto = JSON.parse(message);
    return await this.reportsService.getTripsReport(criteria);
  }

  @MessagePattern(GET_TRIPS_CANCELLED_BY_RIDER_REPORT, Transport.TCP)
  async getTripsCancelledByRider(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_TRIPS_CANCELLED_BY_RIDER_REPORT}::recv -> ${message}`);
    const criteria: ListSearchSortDto = JSON.parse(message);
    return await this.reportsService.getTripsCancelledByRider(criteria);
  }

  @MessagePattern(GET_TRIPS_CANCELLED_BY_CAPTAIN_REPORT, Transport.TCP)
  async getTripsCancelledByCaptain(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_TRIPS_CANCELLED_BY_CAPTAIN_REPORT}::recv -> ${message}`);
    const criteria: ListSearchSortDto = JSON.parse(message);
    return await this.reportsService.getTripsCancelledByCaptain(criteria);
  }

  @MessagePattern(GET_TRIPS_DECLINED_BY_CAPTAIN_REPORT, Transport.TCP)
  async getTripsDeclinedByCaptain(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_TRIPS_DECLINED_BY_CAPTAIN_REPORT}::recv -> ${message}`);
    const criteria: ListSearchSortDto = JSON.parse(message);
    return await this.reportsService.getTripsDeclinedByCaptain(criteria);
  }

}
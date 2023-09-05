import { Controller, Get, HttpStatus, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { Transport } from '@nestjs/microservices';

import {
  UPSERT_CUSTOMER,
  CREATE_CUSTOMER,
  UPDATE_CUSTOMER,
  GET_ALL_CUSTOMERS,
  GET_CUSTOMER_DETAIL,
  GET_SELECTED_CUSTOMERS,
  GET_ALL_CUSTOMERS_BY_USER_TYPE,
  GET_RIDER_TRIP_HISTORY,
  GET_RIDER_TRIP_SCHEDULED,
  GET_DRIVER_TRIP_HISTORY,
  GET_DRIVER_EARNINGS,
  DASHBOARD_CUSTOMER_STATS,
  UPDATE_RIDER_LOCATION,
  SEARCH_RIDERS_LIST,
  CREATE_RIDER_OTP,
  VERIFY_RIDER_OTP,
  CUSTOMER_UPDATE_PICTURE,
  GET_CUSTOMER_KYC_STATUS,
  KYC_INITIATE,
  GET_ALL_ACTIVE_LOCATIONS,
  UPSERT_APP_USAGE,
  GET_USER_APP_USAGE_TIME,
  GET_ACTIVE_USERS_PERCENTAGE,
  CHANGE_CUSTOMER_APPROVAL_STATUS,
  GET_CUSTOMER_DETAILS_FOR_OTP_LOGS,
  CHECK_IF_CUSTOMER_EXIST_BY_MOBILE_AND_TYPE,
} from './kafka-constants';

import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto, UpdatePictureDto } from './dto/update-customer.dto';
import { ConditionsInterface, ListSearchSortDto } from './customer.interface';
import { StatsParams } from '../trips/interface/trips.interface';
import { CustomLogger } from 'src/logger/customLogger';
import { LoggerHandler } from 'src/helpers/logger.handler';
import { ResponseData } from 'src/helpers/responseHandler';
import { errorMessage } from 'src/constants/errorMessage';

@Controller()
export class CustomerController {
  private customLogger = new LoggerHandler(
    CustomerController.name,
  ).getInstance();

  constructor(
    private customerService: CustomerService, // private customLogger: CustomLogger
  ) {
    // this.customLogger.setContext(CustomerController.name);
  }

  private logger = new Logger(CustomerController.name);

  @MessagePattern(CUSTOMER_UPDATE_PICTURE, Transport.TCP)
  async adminUpdatePicture(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(
      `tcp::admin-user::${CUSTOMER_UPDATE_PICTURE}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const params: UpdatePictureDto = message.value;
    return await this.customerService.updatePicture(params);
  }

  @EventPattern(UPSERT_CUSTOMER, Transport.KAFKA)
  async upsert(@Payload() message) {
    this.customLogger.msgPattern(UPSERT_CUSTOMER);
    const data: CreateCustomerDto = message.value;
    if (data.userId) {
      this.logger.log(
        `kafka::trip::${UPSERT_CUSTOMER}::recv -> ${data.userId}`,
      );
      const response: any = await this.customerService.findOne({
        userId: data.userId,
      });
      if (response.statusCode == HttpStatus.OK) {
        return await this.customerService.updateCustomer(
          response.data.id,
          data,
        );
      } else if (response.statusCode == HttpStatus.NOT_FOUND) {
        return await this.customerService.createCustomer(data);
      }
    }
  }

  @MessagePattern(UPSERT_CUSTOMER, Transport.TCP)
  async UpdateKycInfo(@Payload() message) {
    this.customLogger.msgPattern(UPSERT_CUSTOMER);
    const data: CreateCustomerDto = JSON.parse(message);
    if (data.userId) {
      this.logger.log(
        `kafka::trip::${UPSERT_CUSTOMER}::recv -> ${data.userId}`,
      );
      const response: any = await this.customerService.findOne({
        userId: data.userId,
      });
      // console.log(response);
      if (response.statusCode == HttpStatus.OK) {
        return await this.customerService.updateCustomer(
          response.data.id,
          data,
        );
      } else {
        if (Number(data.userId) == 96611) {
          const lastId = Number(
            await this.customerService.lastUserId(966110000000, 966220000000),
          );
          if (lastId) {
            data.userId = lastId + 1;
          } else data.userId = 0;
        } else if (Number(data.userId) == 96622) {
          const lastId = Number(
            await this.customerService.lastUserId(966220000000, 966330000000),
          );
          if (lastId) {
            data.userId = lastId + 1;
          } else data.userId = 0;
        }
        this.logger.log(`New Customer signup new userId: ${data.userId}`);
        if (data.userId) {
          data.userId = `${data.userId}`;
          return await this.customerService.createCustomer(data);
        } else {
          return ResponseData.error(
            HttpStatus.SERVICE_UNAVAILABLE,
            errorMessage.SOMETHING_WENT_WRONG,
          );
        }
      }
    }
  }

  @MessagePattern(CREATE_CUSTOMER, Transport.TCP)
  async create(@Payload() message) {
    this.logger.log(`kafka::trip::${CREATE_CUSTOMER}::recv -> ${message}`);
    const data: CreateCustomerDto = JSON.parse(message).body;
    return await this.customerService.createCustomer(data);
  }

  @EventPattern(UPDATE_CUSTOMER, Transport.KAFKA)
  async update(@Payload() message) {
    this.logger.log(
      `kafka::trip::${UPDATE_CUSTOMER}::recv -> ${message.value}`,
    );
    const data: UpdateCustomerDto = message.value.data;
    const response: any = await this.customerService.findOne({
      userId: message.value.id,
    });
    if (response.statusCode == HttpStatus.OK) {
      return await this.customerService.updateCustomer(response.data.id, data);
    } else {
      this.logger.log(`update -> error -> ${response.message}`);
      return response;
    }
  }

  @MessagePattern(GET_CUSTOMER_DETAIL, Transport.TCP)
  async findOne(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_CUSTOMER_DETAIL}::recv -> ${message}`);
    message = JSON.parse(message);
    let find;
    if (message?.id) {
      find = { id: message?.id };
    } else if (message?.userId) {
      find = { userId: message.userId };
    } else if (message?.driverId) {
      find = { driverId: message?.driverId };
    } else if (message?.mobileNo) {
      find = { mobileNo: message?.mobileNo };
    } else if (message?.idNumber) {
      find = { idNumber: message?.idNumber };
    }
    const data: ConditionsInterface = message?.data;
    return await this.customerService.findOne(find, data);
  }

  @MessagePattern(KYC_INITIATE, Transport.TCP)
  async kycInitiate(@Payload() message) {
    this.logger.log(`kafka::trip::${KYC_INITIATE}::recv -> ${message}`);
    message = JSON.parse(message);
    const userId = message.userId;
    return await this.customerService.kycInitiate(userId);
  }

  @MessagePattern(GET_CUSTOMER_KYC_STATUS, Transport.TCP)
  async riderKycStatus(@Payload() message) {
    this.logger.log(
      `kafka::trip::${GET_CUSTOMER_KYC_STATUS}::recv -> ${message}`,
    );
    message = JSON.parse(message);
    const userId = message.userId;
    return await this.customerService.riderKycStatus(userId);
  }

  @MessagePattern(GET_ALL_CUSTOMERS, Transport.TCP)
  async findAll(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_ALL_CUSTOMERS}::recv -> ${message}`);
    message = JSON.parse(message);
    return await this.customerService.findAll(message?.criteria, message?.data);
  }

  // heloo
  @MessagePattern(GET_SELECTED_CUSTOMERS, Transport.TCP)
  async getSelectedCustomers(@Payload() message) {
    this.logger.log(
      `kafka::trip::${GET_SELECTED_CUSTOMERS}::recv -> ${message}`,
    );
    message = JSON.parse(message);
    const userIds = message?.userIds;
    const select = message?.select;
    return await this.customerService.getSelectedCustomers(userIds, select);
  }

  @MessagePattern(GET_ALL_CUSTOMERS_BY_USER_TYPE, Transport.TCP)
  async getAllCustomersByUserType(@Payload() message) {
    this.logger.log(
      `kafka::trip::${GET_ALL_CUSTOMERS_BY_USER_TYPE}::recv -> ${message}`,
    );
    message = JSON.parse(message);
    const userType = message?.userType;
    return await this.customerService.getAllCustomersByUserType(userType);
  }

  @MessagePattern(GET_RIDER_TRIP_HISTORY, Transport.TCP)
  async getRiderTripHistory(@Payload() message) {
    this.logger.log(
      `kafka::trip::${GET_RIDER_TRIP_HISTORY}::recv -> ${message}`,
    );
    message = JSON.parse(message);
    const id: string = message.id;
    const criteria: ListSearchSortDto = message?.criteria;
    return await this.customerService.getRiderTripHistory(id, criteria);
  }

  @MessagePattern(GET_RIDER_TRIP_SCHEDULED, Transport.TCP)
  async getRiderTripScheduled(@Payload() message) {
    this.logger.log(
      `kafka::trip::${GET_RIDER_TRIP_SCHEDULED}::recv -> ${message}`,
    );
    message = JSON.parse(message);
    const id: string = message.id;
    const criteria: ListSearchSortDto = message?.criteria;
    return await this.customerService.getRiderTripScheduled(id, criteria);
  }

  @MessagePattern(GET_DRIVER_TRIP_HISTORY, Transport.TCP)
  async getDriverTripHistory(@Payload() message) {
    this.logger.log(
      `kafka::trip::${GET_DRIVER_TRIP_HISTORY}::recv -> ${message}`,
    );
    message = JSON.parse(message);
    const id: string = message.id;
    const criteria: ListSearchSortDto = message?.criteria;
    return await this.customerService.getDriverTripHistory(id, criteria);
  }

  @MessagePattern(GET_DRIVER_EARNINGS, Transport.TCP)
  async getDriverEarnings(@Payload() message) {
    this.logger.log(`kafka::trip::${GET_DRIVER_EARNINGS}::recv -> ${message}`);
    message = JSON.parse(message);
    const id: string = message.id;
    const criteria: ListSearchSortDto = message?.criteria;
    return await this.customerService.getDriverEarnings(id, criteria);
  }

  @MessagePattern(DASHBOARD_CUSTOMER_STATS, Transport.TCP)
  async customerStats(@Payload() message) {
    this.logger.log(
      `kafka::trip::${DASHBOARD_CUSTOMER_STATS}::recv -> ${JSON.stringify(
        message,
      )}`,
    );
    message = JSON.parse(message);
    return await this.customerService.getCustomerStats(message);
  }

  // Update rider location as mobile requests
  @EventPattern(UPDATE_RIDER_LOCATION, Transport.KAFKA)
  async updateRiderLocation(@Payload() message) {
    this.logger.log(
      `kafka::trip:customer::${UPDATE_RIDER_LOCATION}::recv -> ${message.value}`,
    );
    return await this.customerService.updateCustomerLocation(message.value);
  }

  @EventPattern(UPSERT_APP_USAGE, Transport.KAFKA)
  async upsertAppUsage(@Payload() message) {
    this.logger.log(
      `kafka::trip:customer::${UPSERT_APP_USAGE}::recv -> ${message.value}`,
    );
    return await this.customerService.upsertAppUsage(message.value);
  }

  @MessagePattern(SEARCH_RIDERS_LIST, Transport.TCP)
  async findRidersForAdmin(@Payload() message) {
    this.logger.log(`kafka::trip::${SEARCH_RIDERS_LIST}::recv -> ${message}`);
    message = JSON.parse(message);
    const keyword = message?.keyword;
    return await this.customerService.findRidersForAdmin(keyword);
  }

  @MessagePattern(CREATE_RIDER_OTP, Transport.TCP)
  async createOtpForRider(@Payload() message) {
    this.logger.log(`kafka::trip::${CREATE_RIDER_OTP}::recv -> ${message}`);
    message = JSON.parse(message);
    return await this.customerService.createOtpForRider(message);
  }

  @MessagePattern(VERIFY_RIDER_OTP, Transport.TCP)
  async verifyOtpForRider(@Payload() message) {
    this.logger.log(`kafka::trip::${VERIFY_RIDER_OTP}::recv -> ${message}`);
    message = JSON.parse(message);
    return await this.customerService.verifyOtpForRider(message);
  }

  @MessagePattern(GET_ALL_ACTIVE_LOCATIONS, Transport.TCP)
  async getAllLocationsWithInDesireTime() {
    this.logger.log(`kafka::trip::${GET_ALL_ACTIVE_LOCATIONS}::recv -> `);
    return await this.customerService.getAllLocationsWithInDesireTime();
  }

  @MessagePattern(GET_USER_APP_USAGE_TIME, Transport.TCP)
  async getUserTimeConsumption(@Payload() message) {
    //this.logger.log(`TCP::trip::${CHECK_IF_ANY_CUSTOMER_EXISTS}::recv -> ${}`);
    message = JSON.parse(message);
    const userId = message.userId;
    const param = message.param;
    let response = await this.customerService.appUsageGraph(userId, param);
    return response;
  }

  @MessagePattern(GET_ACTIVE_USERS_PERCENTAGE, Transport.TCP)
  async activeUsersPercentage(@Payload() message) {
    message = JSON.parse(message);
    const userType = message.userType;
    let response = await this.customerService.activeUsersPercentage(userType);
    return response;
  }

  @MessagePattern(CHANGE_CUSTOMER_APPROVAL_STATUS, Transport.TCP)
  async changeApprovalStatus(@Payload() paramDto) {
    paramDto = JSON.parse(paramDto);
    const userId = paramDto.userId;
    const status = paramDto.status;
    let response = await this.customerService.changeApprovalStatus(
      userId,
      status,
    );
    return response;
  }

  @MessagePattern(CHECK_IF_CUSTOMER_EXIST_BY_MOBILE_AND_TYPE, Transport.TCP)
  async checkIfUserAllreadyExist(@Payload() params) {
    params = JSON.parse(params);
    const mobileNo = params.mobileNo;
    const userType = params.userType;
    let response = await this.customerService.checkIfUserAllReadyExist(
      mobileNo,
      userType,
    );
    return response;
  }

  @MessagePattern(GET_CUSTOMER_DETAILS_FOR_OTP_LOGS, Transport.TCP)
  async getUserDetailsForOtpLogs(@Payload() data) {
    data = JSON.parse(data);
    let response = await this.customerService.getUserDetailsForOtpLogs(data);
    return response;
  }
}

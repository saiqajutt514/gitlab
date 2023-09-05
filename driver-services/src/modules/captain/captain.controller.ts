import { Controller, Logger, Post } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';

import {
  CREATE_CAPTAIN,
  FIND_NEAREST_DRIVERS,
  UPDATE_CAPTAIN_LOCATION,
  CHANGE_DRIVER_MODE,
  GET_DRIVER_MODE,
  CHANGE_DRIVER_STATUS,
  CHANGE_DRIVER_AVAILABILITY,
  CAPTAIN_DETAIL,
  WASL_CAPTAIN_CHECK,
  GET_ALL_CAPTAINS,
  UPDATE_CAPTAIN,
  GET_SELECTED_CAPTAINS,
  DASHBOARD_ACTIVE_DRIVERS,
  GET_CAPTAIN_SUBSCRIPTIONS,
  GET_CAPTAIN_EARNINGS,
  GET_CAPTAINS_REPORT,
  UPDATE_CAPTAIN_SUBSCRIPTION,
  ACTIVATE_CAPTAIN_SUBSCRIPTION,
  CANCEL_CAPTAIN_SUBSCRIPTION,
  VERIFY_CAPTAIN_SUBSCRIPTION,
  SEARCH_DRIVERS_LIST,
  CHANGE_WASL_STATUS,
  PURCHASE_SUBSCRIPTION,
  GET_CAPTAIN_SELECTED_SUBSCRIPTION,
  SUBSCRIPTION_INVOICE,
  VALIDATE_IBAN,
  GET_IBAN,
  ADD_USER_SUBSCRIPTION,
  UPDATE_SUBSCRIPTION_PACKAGE,
  WASL_APPROVED_COUNT,
  UPDATE_CAB_ID,
  ALL_DRIVER_WASL_CHECK,
  CHANGE_ONLINE_STATUS,
  DRIVER_ONLINE_STATUS,
} from 'src/constants/kafka-constant';
import { CaptainService } from './captain.service';
import { EventPattern } from '@nestjs/microservices';
import { PaginationCommonDto } from './dto/pagination.dto';
import { SubscriptionEarningDto } from './dto/subscription-earning.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { purchaseSubscriptionDto } from './interface/captain.interface';

@Controller('captain')
export class CaptainController {
  private readonly logger = new LoggerHandler(
    CaptainController.name,
  ).getInstance();
  constructor(private captainService: CaptainService) {}

  // @MessagePattern("raw_entry", Transport.TCP)
  // async createCaptains(@Payload() payload) {
  //   const message = { value: JSON.parse(payload) };
  //   return await this.captainService.createrawuser(message);
  // }

  @MessagePattern(CREATE_CAPTAIN, Transport.TCP)
  async createCaptain(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${CREATE_CAPTAIN}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const { body, userData, sessionId } = message.value;
    if (body?.drivingModes) {
      body.drivingModes = body.drivingModes.map(
        (driveModeRow) => driveModeRow.drivingMode,
      );
    } else {
      body.drivingModes = [];
    }
    return await this.captainService.create(body, userData, sessionId);
  }

  @MessagePattern(WASL_CAPTAIN_CHECK, Transport.TCP)
  async captainWaslCheck(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${WASL_CAPTAIN_CHECK}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const { body, userData } = message.value;
    return await this.captainService.waslCheck(body, userData);
  }

  @MessagePattern(CHANGE_DRIVER_STATUS, Transport.TCP)
  async changeWaslStatus(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${CHANGE_DRIVER_STATUS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.changeDriverStatus(
      message.value?.id,
      message.value?.data,
    );
  }

  @MessagePattern(CHANGE_DRIVER_MODE, Transport.TCP)
  async changeDriverMode(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${CHANGE_DRIVER_MODE}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const captainId = message?.value?.captainId;
    return await this.captainService.changeDriverMode(captainId);
  }

  @MessagePattern(CHANGE_ONLINE_STATUS, Transport.TCP)
  async changeDriverOnline(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${CHANGE_ONLINE_STATUS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const captainId = message?.value?.captainId;
    return await this.captainService.changeDriverOnline(captainId);
  }

  @MessagePattern(GET_DRIVER_MODE, Transport.TCP)
  async getDriverMode(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_DRIVER_MODE}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const captainId = message?.value?.userId;
    return await this.captainService.getDriverMode(captainId);
  }

  @EventPattern(CHANGE_DRIVER_AVAILABILITY, Transport.KAFKA)
  async changeDriverAvailability(@Payload() message) {
    this.logger.log(
      `kafka::captain::${CHANGE_DRIVER_AVAILABILITY}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const id = message.value?.id;
    const status = message.value?.status ?? null;
    return await this.captainService.changeDriverAvailability(id, status);
  }

  // Update captain location as mobile requests
  @EventPattern(UPDATE_CAPTAIN_LOCATION, Transport.KAFKA)
  async updateCaptainLocation(@Payload() message) {
    this.logger.log(
      `kafka::captain::${UPDATE_CAPTAIN_LOCATION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    await this.captainService.updateCaptainLocation(message.value);
  }
  //Validate Iban

  @MessagePattern(VALIDATE_IBAN)
  updateOrAddIban(@Payload() Payload) {
    console.debug(Payload);
    return this.captainService.validateIban(JSON.parse(Payload).param);
  }
  @MessagePattern(UPDATE_CAB_ID)
  updateCabsId(@Payload() Payload) {
    console.debug(Payload);
    return this.captainService.updateCabsId(JSON.parse(Payload));
  }

  @MessagePattern(GET_IBAN)
  getIban(@Payload() Payload) {
    // console.debug(Payload);
    return this.captainService.getIban(JSON.parse(Payload).param);
  }

  // Finds all nearby drivers based on the input criteria
  @MessagePattern(FIND_NEAREST_DRIVERS, Transport.TCP)
  async findNearestDriversHandler(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${FIND_NEAREST_DRIVERS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.findCaptainList(message.value);
  }

  @MessagePattern(CHANGE_WASL_STATUS, Transport.TCP)
  async changeDriverStatus(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${CHANGE_WASL_STATUS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.changeWaslStatus(message.value?.id);
  }

  @MessagePattern(CAPTAIN_DETAIL, Transport.TCP)
  async findOneCaptain(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `[findOneCaptain]::${CAPTAIN_DETAIL}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const captainId = message?.value?.id;
    const conditions = message?.value?.data;
    return await this.captainService.findOne(captainId, conditions);
  }

  @MessagePattern(GET_ALL_CAPTAINS, Transport.TCP)
  async getAllCaptains(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_ALL_CAPTAINS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.findAll(
      message.value?.criteria,
      message?.value?.data,
    );
  }

  @EventPattern(UPDATE_CAPTAIN, Transport.KAFKA)
  async updateCaptain(@Payload() message) {
    this.logger.log(
      `kafka::captain::${UPDATE_CAPTAIN}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.updateCaptain(
      message.value?.id,
      message.value?.data,
    );
  }

  @MessagePattern(GET_SELECTED_CAPTAINS, Transport.TCP)
  async getSelectedCaptains(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_SELECTED_CAPTAINS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const externalIds = message?.value?.externalIds;
    return await this.captainService.getSelectedCaptains(externalIds);
  }

  @MessagePattern(DASHBOARD_ACTIVE_DRIVERS, Transport.TCP)
  async getActiveDriverStats() {
    this.logger.log(
      `kafka::captain::${DASHBOARD_ACTIVE_DRIVERS}::recv -> count`,
    );
    return await this.captainService.getActiveDriverStats();
  }

  @MessagePattern(GET_CAPTAIN_SUBSCRIPTIONS, Transport.TCP)
  async findAllSubscriptions(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_CAPTAIN_SUBSCRIPTIONS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const userId: string = message.value?.userId;
    const pagination: PaginationCommonDto = message.value?.pagination;
    return await this.captainService.findAllSubscriptions(userId, pagination);
  }

  @MessagePattern(GET_CAPTAIN_EARNINGS, Transport.TCP)
  async findAllEarnings(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_CAPTAIN_EARNINGS}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const userId: string = message.value?.userId;
    const body: SubscriptionEarningDto = message.value?.body;
    return await this.captainService.findAllEarnings(userId, body);
  }

  @MessagePattern(GET_CAPTAINS_REPORT, Transport.TCP)
  async getDriversReport(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${GET_CAPTAINS_REPORT}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.getDriversReport(message.value);
  }

  @EventPattern(UPDATE_CAPTAIN_SUBSCRIPTION, Transport.KAFKA)
  async updateSubscriptionDetail(@Payload() message) {
    this.logger.log(
      `kafka::captain::${UPDATE_CAPTAIN_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.updateSubscriptionDetail(message.value);
  }

  @MessagePattern(CANCEL_CAPTAIN_SUBSCRIPTION, Transport.TCP)
  async cancelSubscription(@Payload() payload) {
    const message = { value: payload };
    this.logger.log(
      `[cancelSubscription]::${CANCEL_CAPTAIN_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const userId: string = message.value;
    return await this.captainService.cancelSubscription(userId);
  }

  @MessagePattern(ACTIVATE_CAPTAIN_SUBSCRIPTION, Transport.TCP)
  async activateSubscription(@Payload() payload) {
    const message = { value: payload };
    this.logger.log(
      `[activateSubscription]::${ACTIVATE_CAPTAIN_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const userId: string = message.value;
    return await this.captainService.activateSubscription(userId);
  }

  @MessagePattern(PURCHASE_SUBSCRIPTION, Transport.TCP)
  async purchase(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `[purchase]::${PURCHASE_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const params: purchaseSubscriptionDto = message.value;
    return await this.captainService.purchase(params);
  }

  @MessagePattern(SUBSCRIPTION_INVOICE, Transport.TCP)
  async subInvoice(@Payload() payload) {
    const message = { value: payload };
    this.logger.log(
      `[purchase]::${SUBSCRIPTION_INVOICE}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const userId: string = message.value;
    return await this.captainService.getPackageInvoice(userId);
  }

  @MessagePattern(VERIFY_CAPTAIN_SUBSCRIPTION, Transport.TCP)
  async verifyCaptain(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${VERIFY_CAPTAIN_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const { userId, data } = message.value;
    return await this.captainService.verifyCaptain(userId, data);
  }

  // Search driver list for Admin
  @MessagePattern(SEARCH_DRIVERS_LIST, Transport.TCP)
  async findDriversForAdmin(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${SEARCH_DRIVERS_LIST}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.findDriversForAdmin(message.value);
  }

  @MessagePattern(ADD_USER_SUBSCRIPTION, Transport.TCP)
  async addUserSubscription(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${ADD_USER_SUBSCRIPTION}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.addUserSubscription(message.value);
  }

  @MessagePattern(UPDATE_SUBSCRIPTION_PACKAGE, Transport.TCP)
  async updateSubsriptionPackage(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${UPDATE_SUBSCRIPTION_PACKAGE}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.captainService.updateSubsriptionPackage(message.value);
  }

  @MessagePattern(WASL_APPROVED_COUNT, Transport.TCP)
  async waslApprovedCount() {
    this.logger.log(`kafka::captain::${WASL_APPROVED_COUNT}`);
    return await this.captainService.waslApprovedCount();
  }

   @MessagePattern(ALL_DRIVER_WASL_CHECK, Transport.TCP)
  async findAndNotifyDriversForWASLEligibilityOneByOne() {
    this.logger.log(`kafka::captain::${ALL_DRIVER_WASL_CHECK}`);
    return await this.captainService.findAndNotifyDriversForWASLEligibilityOneByOne();
  }

  @EventPattern(DRIVER_ONLINE_STATUS, Transport.KAFKA)
  async updateDriverOnlineStatus(@Payload() message) {
    this.logger.log(
      `kafka::trip:captain::${DRIVER_ONLINE_STATUS}::recv -> ${message.value}`,
    );
    return await this.captainService.updateDriverOnlineStatus(message.value);
  }
}

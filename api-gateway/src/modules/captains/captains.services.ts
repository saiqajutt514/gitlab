import {
  BadGatewayException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  ClientKafka,
  Client,
  Transport,
  ClientProxy,
} from '@nestjs/microservices';
import {
  captainRequestPatterns,
  CREATE_CAPTAIN,
  FIND_NEAREST_DRIVERS,
  CHANGE_DRIVER_MODE,
  CAPTAIN_DETAIL,
  GET_ALL_CAB_TYPES,
  UPDATE_CAPTAIN_LOCATION,
  WASL_CAPTAIN_CHECK,
  GET_CAPTAIN_SUBSCRIPTIONS,
  GET_CAPTAIN_EARNINGS,
  CANCEL_CAPTAIN_SUBSCRIPTION,
  ACTIVATE_CAPTAIN_SUBSCRIPTION,
  VERIFY_CAPTAIN_SUBSCRIPTION,
  PURCHASE_SUBSCRIPTION,
  SUBSCRIPTION_INVOICE,
  UPDATE_SUBSCRIPTION_PACKAGE,
  CHANGE_AUTO_RENEWAL_STATUS,
} from './kafka-constants';
import {
  BecomeCaptainDto,
  BecomeCaptainWASLDto,
} from './dto/become-captain.dto';

import {
  captainKafkaConfig,
  captainTCPConfig,
  paymentTCPConfig,
} from 'src/microServiceConfigs';
import { UpdateLocationDto } from './dto/update-lcoation.dto';
import { RedisUserInterface } from './captain.interface';
import { PaginationCommonDto } from 'src/helpers/dto/pagination';
import { subscriptionEarningDto } from './dto/subscription-earning.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { GetCabTypeQueryDto } from './dto/get-cab-type.dto';
import {
  purchaseSubscriptionDto,
  userDto,
} from './dto/purchase-subscription.dto';
import {
  GET_SELECTED_VEHICLE_DETAILS_FOR_APP,
  GET_SETTING,
  SHOW_SELECT_MENU_FOR_APP,
} from '../admin/kafka-constants';
import { adminTCPConfig } from 'config/adminServiceConfig';
import { ShowSelectedVehicleDetailsForAppDto } from '../admin/dto/rar.dto';

@Injectable()
export class CaptainService {
  // @Client(captainKafkaConfig)
  // clientCaptainKafka: ClientKafka;

  @Client(paymentTCPConfig)
  clientPaymentTCP: ClientProxy;

  @Client(captainTCPConfig)
  clientCaptain: ClientProxy;

  constructor(
    @Inject('CLIENT_CAPTAIN_SERVICE_KAFKA')
    private clientCaptainKafka: ClientKafka,
  ) {}
  @Client(adminTCPConfig)
  clientAdminTCP: ClientProxy;
  onModuleInit() {
    // captainRequestPatterns.forEach((pattern) => {
    //   this.clientCaptainKafka.subscribeToResponseOf(pattern);
    // });
  }

  private readonly logger = new LoggerHandler(
    CaptainService.name,
  ).getInstance();

  // Captain Service

  async waslCheck(body: BecomeCaptainWASLDto, userData: RedisUserInterface) {
    const { drivingModes } = body;
    const drivingModeTypes = drivingModes.map((data) => data.drivingMode);
    if (drivingModeTypes[0] === drivingModeTypes[1]) {
      this.logger.error(
        `waslCheck -> same driving modes -> ${JSON.stringify(
          drivingModeTypes,
        )}`,
      );
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Same driver modes',
      };
    }

    this.logger.log(
      `kafka::captain::${WASL_CAPTAIN_CHECK}::send -> ${JSON.stringify(body)}`,
    );
    return await this.clientCaptain
      .send(WASL_CAPTAIN_CHECK, JSON.stringify({ body, userData }))
      .pipe()
      .toPromise();
  }

  async becomeCaptain(
    body: BecomeCaptainDto,
    userData: RedisUserInterface,
    sessionId: string = '',
  ) {
    const { drivingModes } = body;
    const drivingModeTypes = drivingModes.map((data) => data.drivingMode);
    if (drivingModeTypes[0] === drivingModeTypes[1]) {
      this.logger.error(
        `becomeCaptain -> same driving modes -> ${JSON.stringify(
          drivingModeTypes,
        )}`,
      );
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Same driver modes',
      };
    }

    this.logger.log(
      `kafka::captain::${CREATE_CAPTAIN}::send -> ${JSON.stringify(body)}`,
    );
    return await this.clientCaptain
      .send(CREATE_CAPTAIN, JSON.stringify({ body, userData, sessionId }))
      .pipe()
      .toPromise();
  }

  async changeDriverMode(captainId: string) {
    this.logger.log(
      `kafka::captain::${CHANGE_DRIVER_MODE}::send -> ${JSON.stringify(
        captainId,
      )}`,
    );
    return await this.clientCaptain
      .send(CHANGE_DRIVER_MODE, JSON.stringify({ captainId }))
      .pipe()
      .toPromise();
  }

  async findNearestDriversService(body) {
    this.logger.log(
      `kafka::captain::${FIND_NEAREST_DRIVERS}::send -> ${JSON.stringify(
        body,
      )}`,
    );
    return await this.clientCaptain
      .send(FIND_NEAREST_DRIVERS, JSON.stringify(body))
      .pipe()
      .toPromise();
  }

  async getCaptain(id: string) {
    this.logger.log(
      `kafka::captain::${CAPTAIN_DETAIL}::send -> ${JSON.stringify(id)}`,
    );
    return await this.clientCaptain
      .send(
        CAPTAIN_DETAIL,
        JSON.stringify({
          id,
          data: {
            isFullDetail: true,
            isReviewDetail: true,
            isUserDetail: true,
            isSubscription: true,
            transCheck: true,
          },
        }),
      )
      .pipe()
      .toPromise();
  }

  async getAllCabTypes(
    query?: GetCabTypeQueryDto,
    options?: { adminList: boolean },
  ) {
    this.logger.log(
      `kafka::captain::${GET_ALL_CAB_TYPES}::send -> ${JSON.stringify(query)}`,
    );
    try {
      return await this.clientCaptain
        .send(GET_ALL_CAB_TYPES, JSON.stringify({ query, options }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateLocation(driverId: string, body: UpdateLocationDto) {
    this.logger.log(
      `kafka::captain::${UPDATE_CAPTAIN_LOCATION}::send -> ${JSON.stringify({
        driverId,
        body,
      })}`,
    );
    return await this.clientCaptainKafka
      .emit(UPDATE_CAPTAIN_LOCATION, JSON.stringify({ driverId, ...body }))
      .pipe()
      .toPromise();
  }

  // Captain renewals subscriptions
  async findAllSubscriptions(userId: string, pagination: PaginationCommonDto) {
    return await this.clientCaptain
      .send(GET_CAPTAIN_SUBSCRIPTIONS, JSON.stringify({ userId, pagination }))
      .pipe()
      .toPromise();
  }

  // Captain earnings
  async findAllEarnings(userId: string, body: subscriptionEarningDto) {
    return await this.clientCaptain
      .send(GET_CAPTAIN_EARNINGS, JSON.stringify({ userId, body }))
      .pipe()
      .toPromise();
  }

  // Captain Subscription Cancel
  async cancel(userId: string) {
    try {
      return await this.clientCaptain
        .send(CANCEL_CAPTAIN_SUBSCRIPTION, userId)
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Captain Subscription Active
  async activate(userId: string) {
    try {
      return await this.clientCaptain
        .send(ACTIVATE_CAPTAIN_SUBSCRIPTION, userId)
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Captain Subscription Active
  async purchase(params: purchaseSubscriptionDto & userDto) {
    try {
      return await this.clientCaptain
        .send(PURCHASE_SUBSCRIPTION, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getSubInvoice(userId: string) {
    try {
      return await this.clientCaptain
        .send(SUBSCRIPTION_INVOICE, userId)
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async updateSubsriptionPackage(data) {
    try {
      return await this.clientCaptain
        .send(UPDATE_SUBSCRIPTION_PACKAGE, JSON.stringify(data))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async changeAutoRenewalStatus(userId) {
    try {
      return await this.clientPaymentTCP
        .send(CHANGE_AUTO_RENEWAL_STATUS, JSON.stringify(userId))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async verifySubscription(userId, data) {
    this.logger.log(
      `kafka::captain::${VERIFY_CAPTAIN_SUBSCRIPTION}::send -> ${JSON.stringify(
        { userId, data },
      )}`,
    );
    return await this.clientCaptain
      .send(VERIFY_CAPTAIN_SUBSCRIPTION, JSON.stringify({ userId, data }))
      .pipe()
      .toPromise();
  }

  async getSetting(name: string) {
    this.logger.log(
      `kafka::admin::${GET_SETTING}::send -> ${JSON.stringify(name)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_SETTING, JSON.stringify({ name }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Ride a Ride
  //A1 Show list of vehicle in apps
  async showSelectMenuForApp() {
    try {
      this.logger.log(
        `kafka::captain::${SHOW_SELECT_MENU_FOR_APP}::send -> ${JSON.stringify(
          'no params',
        )}`,
      );
      let response = await this.clientAdminTCP
        .send(SHOW_SELECT_MENU_FOR_APP, JSON.stringify({}))
        .pipe()
        .toPromise();
      return response;
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //A2 show selected vehicle details.
  async getSelectedVehicleDetailsForApp(
    body: ShowSelectedVehicleDetailsForAppDto,
  ) {
    try {
      this.logger.log(
        `kafka::captain::${GET_SELECTED_VEHICLE_DETAILS_FOR_APP}::send -> ${JSON.stringify(
          body,
        )}`,
      );
      return await this.clientAdminTCP
        .send(GET_SELECTED_VEHICLE_DETAILS_FOR_APP, JSON.stringify({ body }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
}

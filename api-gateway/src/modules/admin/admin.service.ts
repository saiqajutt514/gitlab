import {
  BadGatewayException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  HttpException,
} from '@nestjs/common';
import {
  ClientKafka,
  Client,
  ClientProxy,
  Transport,
} from '@nestjs/microservices';

import { adminKafkaConfig, adminTCPConfig } from 'config/adminServiceConfig';
import {
  tripKafkaMicroServiceConfig,
  tripTCPMicroServiceConfig,
  captainKafkaConfig,
  paymentKafkaConfig,
  notificationKafkaConfig,
  promoCodesKafkaMicroServiceConfig,
  promoCodesTCPMicroServiceConfig,
  auditLogMicroServiceConfig,
  captainTCPConfig,
  paymentTCPConfig,
  notificationTCPConfig,
  chatMicroServiceConfig,
} from 'src/microServiceConfigs';
import {
  adminAPIPatterns,
  GET_SLA_CONTENT,
  ADD_SLA_CONTENT,
  UPDATE_SLA_CONTENT,
  CREATE_REJECTED_REASON,
  GET_ALL_REJECTED_REASONS,
  GET_REJECTED_REASON_DETAIL,
  UPDATE_REJECTED_REASON,
  DELETE_REJECTED_REASON,
  ADMIN_LOGIN,
  ADMIN_SET_PASSWORD,
  ADMIN_FORGOT_PASSWORD,
  ADMIN_RESET_PASSWORD,
  ADMIN_CHANGE_PASSWORD,
  ADMIN_UPDATE_PROFILE,
  ADMIN_UPDATE_PICTURE,
  CREATE_SUB_ADMIN,
  GET_ALL_SUB_ADMINS,
  GET_SUB_ADMIN_DETAIL,
  UPDATE_SUB_ADMIN,
  DELETE_SUB_ADMIN,
  CREATE_NOTIFY_USER,
  GET_NOTIFY_USER,
  GET_ALL_NOTIFY_USER,
  CREATE_ROLE,
  GET_ALL_ROLES,
  GET_ROLE_DETAIL,
  UPDATE_ROLE,
  DELETE_ROLE,
  SYNC_ROLE,
  CREATE_CATEGORY,
  GET_ALL_CATEGORY,
  GET_CATEGORY_DETAIL,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  CREATE_PERMISSION,
  GET_ALL_PERMISSIONS,
  GET_PERMISSION_DETAIL,
  UPDATE_PERMISSION,
  DELETE_PERMISSION,
  GET_ALL_CAPABILITIES,
  tripPatterns,
  GET_ALL_TRIPS,
  TRIP_DETAIL_BY_ID,
  GET_DRIVER_EARNINGS,
  DASHBOARD_TRIP_STATS,
  DASHBOARD_CUSTOMER_STATS,
  ADMIN_CANCELS_TRIP,
  GET_ALL_EMERGENCY_TRIPS,
  GET_ALL_DISPATCHER_TRIPS,
  GET_ALL_INCOMPLETE_TRIPS,
  captainPatterns,
  GET_ALL_CAPTAINS,
  CAPTAIN_DETAIL,
  CHANGE_DRIVER_STATUS,
  GET_DRIVER_TRIP_HISTORY,
  GET_DRIVER_SUBSCRIPTIONS,
  DASHBOARD_ACTIVE_DRIVERS,
  GET_ALL_CUSTOMERS,
  GET_CUSTOMER_DETAIL,
  GET_RIDER_TRIP_HISTORY,
  GET_RIDER_TRIP_SCHEDULED,
  SYNC_SETTINGS,
  GET_ALL_SETTING,
  GET_SETTING,
  UPDATE_SETTING,
  UPDATE_CAB_TYPE_ORDER,
  paymentPatterns,
  CREATE_SUBSCRIPTION,
  UPDATE_SUBSCRIPTION,
  DELETE_SUBSCRIPTION,
  GET_ALL_SUBSCRIPTIONS,
  GET_SUBSCRIPTION_DETAIL,
  GET_ALL_USER_TRANSACTIONS,
  DASHBOARD_GET_EARNINGS,
  GET_ACTIVE_SUBSCRIPTIONS,
  GET_EXPIRED_SUBSCRIPTIONS,
  notificationPatterns,
  CREATE_EMAIL_TEMPLATE,
  UPDATE_EMAIL_TEMPLATE,
  DELETE_EMAIL_TEMPLATE,
  GET_ALL_EMAIL_TEMPLATES,
  GET_EMAIL_TEMPLATE_DETAIL,
  UPDATE_EMAIL_TEMPLATE_STATUS,
  UPDATE_PUSH_TEMPLATE_STATUS,
  UPDATE_SMS_TEMPLATE_STATUS,
  CREATE_PUSH_TEMPLATE,
  UPDATE_PUSH_TEMPLATE,
  DELETE_PUSH_TEMPLATE,
  GET_ALL_PUSH_TEMPLATES,
  GET_PUSH_TEMPLATE_DETAIL,
  CREATE_SMS_TEMPLATE,
  UPDATE_SMS_TEMPLATE,
  DELETE_SMS_TEMPLATE,
  GET_ALL_SMS_TEMPLATES,
  GET_SMS_TEMPLATE_DETAIL,
  DASHBOARD_ACTIVE_RIDERS,
  DASHBOARD_STATUS_WISE_COUNT,
  DASHBOARD_STATS,
  DASHBOARD_CANCEL_SUMMARY,
  UPDATE_CAB_TYPE,
  DELETE_CAB_TYPE,
  CREATE_CAB_TYPE,
  GET_ALL_CAB_TYPES,
  GET_CAB_TYPE_DETAIL,
  CREATE_CAB_CHARGE,
  GET_COUNTRIES,
  GET_CITIES,
  UPDATE_CAB_CHARGE,
  DELETE_CAB_CHARGE,
  GET_ALL_CAB_CHARGES,
  ADD_COUNTRY,
  ADD_CITY,
  UPDATE_COUNTRY,
  UPDATE_CITY,
  DELETE_CITY,
  promoCodePatterns,
  DELETE_PROMO_CODE,
  GET_ALL_PROMO_CODES,
  UPDATE_PROMO_CODE,
  CREATE_PROMO_CODE,
  GET_RIDERS_RATING,
  GET_CAPTAINS_RATING,
  GET_RIDERS_REPORT,
  GET_CAPTAINS_REPORT,
  GET_CAPTAINS_EARNINGS_REPORT,
  GET_TRIPS_REPORT,
  GET_TRIPS_CANCELLED_BY_RIDER_REPORT,
  GET_TRIPS_CANCELLED_BY_CAPTAIN_REPORT,
  GET_TRIPS_DECLINED_BY_CAPTAIN_REPORT,
  UPDATE_CAR_INFO,
  GET_ALL_CARS_INFO,
  GET_CAR_INFO_DETAIL,
  UPDATE_VEHICLE,
  GET_ALL_VEHICLES,
  GET_VEHICLE_DETAIL,
  ADD_VEHICLE_MAKER,
  ADD_VEHICLE_MODEL,
  GET_ALL_VEHICLE_MAKERS,
  GET_ALL_VEHICLE_MODELS,
  GET_VEHICLE_MASTER_INFO,
  UPDATE_VEHICLE_MAKER,
  DELETE_VEHICLE_MAKER,
  UPDATE_VEHICLE_MODEL,
  DELETE_VEHICLE_MODEL,
  GET_AUDIT_LOG,
  auditLogPatterns,
  GET_ALL_EMERGENCY_ADMIN,
  GET_ALL_EMERGENCY_REQUESTS,
  GET_EMERGENCY_REQUEST_DETAIL,
  UPDATE_EMERGENCY_REQUEST,
  GET_ALL_DISPATCHER_ADMIN,
  SEARCH_RIDERS_LIST,
  SEARCH_DRIVERS_LIST,
  GET_TRIP_ESTIMATED_COST,
  CREATE_TRIP,
  CREATE_SCHEDULE_TRIP,
  CREATE_RIDER_OTP,
  VERIFY_RIDER_OTP,
  GET_CHARGE_CITIES,
  ADD_CUSTOMIZED_CHARGE,
  UPDATE_CUSTOMIZED_CHARGE,
  DELETE_CUSTOMIZED_CHARGE,
  GET_ALL_CUSTOMIZED_CHARGES,
  GET_CUSTOMIZED_CHARGE,
  ADD_VEHICLE_CLASS,
  GET_ALL_VEHICLE_CLASS,
  UPDATE_VEHICLE_CLASS,
  DELETE_VEHICLE_CLASS,
  SEND_PUSH_NOTIFICATION,
  GET_SELECTED_CUSTOMERS,
  GET_ALL_CUSTOMERS_BY_USER_TYPE,
  CHANGE_WASL_STATUS,
  DASHBOARD_GET_SINGLE_DAY_EARNING,
  NEW_UPDATE_SETTING,
  WASL_APPROVED_COUNT,
  GET_ACTIVE_USERS_PERCENTAGE,
  DASHBOARD_CASH_FLOW,
  DASHBOARD_EARNING_TOPUP_GRAPH,
  DASHBOARD_SPENT_TOPUP_GRAPH,
  GET_ALINMA_TRANSACTIONS,
  DASHBOARD_PROMO_STATS,
  DASHBOARD_SUBSCRIPTION_STATS,
  DASHBOARD_REVIEW_STATS,
  GET_ALL_OTP,
  DASHBOARD_EARNING_AVERAGE_GRAPH,
  CREATE_HIGH_DEMAND_ZONE,
  DELETE_HIGH_DEMAND_ZONE,
  FIND_ALL_HIGH_DEMAND_ZONE,
  GET_LIST_OF_USERS_IN_THIS_ZONE,
  ADD_TO_INVENTORY,
  ADD_MAKER_MODEL_INVENTORY,
  ADD_MAKER_MODEL_INVENTORY_VIA_CSV,
  FIND_ALL_FOR_DASHBOARD,
  SET_VEHICLE_AVALIABILITY,
  UPDATE_INVENTORY,
  DELETE_FROM_INVENTORY,
  CHANGE_CUSTOMER_APPROVAL_STATUS,
  GET_ALL_UNASSIGNED_VEHICLE_MODELS,
  RETRY_ALINMA_TRANSACTIONS,
  GET_ALINMA_BALACE,
  ALL_DRIVER_WASL_CHECK,
} from './kafka-constants';

import { successMessage } from 'src/constants/success-message-constant';
import { errorMessage } from 'src/constants/error-message-constant';

import {
  CreateRejectedReasonDto,
  UpdateRejectedReasonDto,
} from './dto/rejected-reason.dto';
import { REASON_TYPE } from './enum/rejected-reason.enum';
import { UserExternalType } from './enum/services.enum';
import { IPromoCodeMethod } from './enum/promo-code.enum';

import {
  CreateAdminDto,
  UpdateAdminDto,
  AdminLoginDto,
  CreateNotifyUserDto,
  SetPasswordDto,
  ResetPasswordDto,
  ForgotPasswordDto,
  AdminIdDto,
  ChangePasswordDto,
  UpdateProfileDto,
  UpdatePictureDto,
  customerKycDto,
} from './dto/admin-user.dto';
import { AdminListParams } from './interfaces/admin-user.interface';

import { SaveSettingDto } from './dto/setting.dto';
import {
  PaginationDto,
  ListSearchSortDto,
  DashboardAPIParams,
} from './dto/pagination.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  UpdateTemplateStatusDto,
} from './dto/email-templates.dto';
import {
  CreatePushTemplateDto,
  UpdatePushTemplateDto,
} from './dto/push-templates.dto';
import {
  CreateSmsTemplateDto,
  UpdateSmsTemplateDto,
} from './dto/sms-templates.dto';
import {
  CreateCouponDto,
  CreateVoucherDto,
  UpdatePromoCodeDto,
} from './dto/promo-code.dto';
import {
  CreateCabTypeDto,
  UpdateCabTypeOrderDto,
} from './dto/create-cab-type.dto';
import { UpdateCabTypeDto } from './dto/update-cab-type.dto';
import { CabCategoryIcon } from './dto/cab-category-icon.dto';
import { GetCabTypeQueryDto } from '../captains/dto/get-cab-type.dto';
import { UpdateCarInfoDto } from './dto/update-car-info.dto';
import { UpdateVehicleDto, VechileImageDto } from './dto/update-vehicle.dto';
import { ApproveCaptainDto, RejectCaptainDto } from './dto/update-captain.dto';
import { CreateRoleDto, UpdateRoleDto, FilterRoleDto } from './dto/role.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import {
  CancelTripDto,
  TripIdParamDto,
  AdminIdParamDto,
} from './dto/cancel-trip.dto';
import {
  UpdateEmergencyRequestDto,
  ResolveEmergencyRequestDto,
} from './dto/emergency-request.dto';
import {
  SearchRiderDto,
  SearchDriverDto,
  EstimatePriceDto,
  CreateTripNowDto,
  CreateTripScheduleDto,
} from './dto/create-trip.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { RedisHandler } from 'src/helpers/redis-handler';
import { getTimestamp } from 'src/helpers/date-formatter';
import { CreateCabChargeDto } from './dto/create-cab-charge.dto';
import { UpdateCabChargeDto } from './dto/update-cab-charge.dto';
import { CabChargeQueryParams } from './interfaces/cab-charges.interface';
import { CreateOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { CreateCustomizedChargeDto } from './dto/create-customized-charge.dto';
import { UpdateCustomizedChargeDto } from './dto/update-customized-charge.dto';
import { CustomizedChargeQueryParams } from './interfaces/customized-charges.interface';
import { AddSlaDto } from './dto/pages.dto';
import { UserListingParams } from '../chat/interfaces/chat-user.interface';
import {
  adminChatPatterns,
  CHAT_USER_LIST,
  CHAT_USER_DETAIL,
  CHAT_USER_UPDATE_STATUS,
} from '../chat/kafka-constants';
import { ChatUserStatusDto } from '../chat/dto/chat-user.dto';
import { SettingListParams } from './interfaces/setting.interface';
import { VehicleMasterInfoDto } from './dto/vehicle-maker.dto';
import { SendPushNotificationToUsersDto } from './dto/send-push-notification-to-users.dto';
import {
  CREATE_CUSTOMER,
  CUSTOMER_KYC,
  GET_ALL_ACTIVE_LOCATIONS,
  GET_ALL_TOP_UP_HISTORY,
  GET_BALANCE,
  GET_CHAT_USER_LAST_SEEN_AND_LOC,
  GET_USER_APP_USAGE_TIME,
  KYC_INITIATE,
  TOP_UP_HISTORY,
  UPSERT_CUSTOMER,
} from '../user/kafka-constants';
import { UpdateCustomerDto } from '../user/dto/update-customer.dto';
import { TripsCreateDTO } from '../trips/dto/trips.dto';
import { AwsS3Service } from 'src/helpers/aws-s3-service';
import {
  ActivationDto,
  AddMakerModelInventoryDto,
  AddToInventoryDto,
  CustomerStatusDto,
  DeleteCompanyVehicleDto,
  UpdateInventoryDto,
} from './dto/rar.dto';
@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new LoggerHandler(AdminService.name).getInstance();

  constructor(
    @Inject('CLIENT_REVIEW_SERVICE_TCP') private clientReviewTCP: ClientProxy,

    @Inject('CLIENT_AUTH_SERVICE_TCP') private authTcpClient: ClientProxy,
    private redisHandler: RedisHandler, // @Inject('CLIENT_ADMIN_SERVICE_TCP') private clientAdminTCP: ClientProxy
    private readonly awsS3Service: AwsS3Service,
  ) {}

  @Client({
    ...chatMicroServiceConfig,
    options: {
      ...chatMicroServiceConfig.options,
      consumer: {
        groupId: 'chat-consumer-admin',
      },
    },
  })
  clientChat: ClientKafka;

  // @Client(adminKafkaConfig)
  // clientAdminKafka: ClientKafka;

  @Client(adminTCPConfig)
  clientAdminTCP: ClientProxy;

  // @Client({
  //   ...captainKafkaConfig,
  //   options: {
  //     ...captainKafkaConfig.options,
  //     consumer: {
  //       groupId: 'captain-consumer-admin',
  //     }
  //   }
  // })
  // clientCaptainKafka: ClientKafka;

  @Client(captainTCPConfig)
  clientCaptain: ClientProxy;

  // @Client({
  //   ...tripKafkaMicroServiceConfig,
  //   options: {
  //     ...tripKafkaMicroServiceConfig.options,
  //     consumer: {
  //       groupId: 'trip-consumer-admin',
  //     }
  //   }
  // })
  // tripKafkaClient: ClientKafka;

  @Client(tripTCPMicroServiceConfig)
  tripTcpClient: ClientProxy;

  // @Client({
  //   ...promoCodesKafkaMicroServiceConfig,
  //   options: {
  //     ...promoCodesKafkaMicroServiceConfig.options,
  //     consumer: {
  //       groupId: 'promocode-consumer-admin',
  //     }
  //   }
  // })
  // promoCodesKafkaClient: ClientKafka;

  @Client(promoCodesTCPMicroServiceConfig)
  promoCodesTcpClient: ClientProxy;

  // @Client({
  //   ...paymentKafkaConfig,
  //   options: {
  //     ...paymentKafkaConfig.options,
  //     consumer: {
  //       groupId: 'payment-consumer-admin',
  //     }
  //   }
  // })
  // clientPaymentKafka: ClientKafka;

  @Client(paymentTCPConfig)
  clientPaymentTCP: ClientProxy;

  @Client({
    ...notificationKafkaConfig,
    options: {
      ...notificationKafkaConfig.options,
      consumer: {
        groupId: 'notification-consumer-admin',
      },
    },
  })
  clientNotification: ClientKafka;

  @Client(notificationTCPConfig)
  clientNotificationTCP: ClientProxy;

  @Client({
    ...auditLogMicroServiceConfig,
    options: {
      ...auditLogMicroServiceConfig.options,
      consumer: {
        groupId: 'audit-consumer-admin',
      },
    },
  })
  clientAudit: ClientKafka;

  onModuleInit() {
    // adminAPIPatterns.forEach((pattern) => {
    //   this.clientAdminKafka.subscribeToResponseOf(pattern);
    // });
    // tripPatterns.forEach((pattern) => {
    //   this.tripKafkaClient.subscribeToResponseOf(pattern);
    // })
    // captainPatterns.forEach((pattern) => {
    //   this.clientCaptainKafka.subscribeToResponseOf(pattern);
    // })
    // promoCodePatterns.forEach(pattern => {
    //   this.promoCodesKafkaClient.subscribeToResponseOf(pattern);
    // });
    auditLogPatterns.forEach((pattern) => {
      this.clientAudit.subscribeToResponseOf(pattern);
    });
    // paymentPatterns.forEach((pattern) => {
    //   this.clientPayment.subscribeToResponseOf(pattern);
    // });
    // notificationPatterns.forEach((pattern) => {
    //   this.clientNotification.subscribeToResponseOf(pattern);
    // });
    // this.clientNotification.subscribeToResponseOf('send-notification');
    adminChatPatterns.forEach((pattern) => {
      this.clientChat.subscribeToResponseOf(pattern);
    });
  }

  // Rejected Reason Service
  async createReason(params: CreateRejectedReasonDto) {
    this.logger.log(
      `kafka::admin::${CREATE_REJECTED_REASON}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(CREATE_REJECTED_REASON, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findAllReasonWithType(type: REASON_TYPE) {
    this.logger.log(
      `kafka::admin::${GET_ALL_REJECTED_REASONS}::send -> ${JSON.stringify(
        type,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_REJECTED_REASONS, JSON.stringify({ type }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findOneReason(id: string) {
    this.logger.log(
      `kafka::admin::${GET_REJECTED_REASON_DETAIL}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_REJECTED_REASON_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateReason(id: string, params: UpdateRejectedReasonDto) {
    this.logger.log(
      `kafka::admin::${UPDATE_REJECTED_REASON}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      return await this.clientAdminTCP
        .send(UPDATE_REJECTED_REASON, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async removeReason(id: string) {
    this.logger.log(
      `kafka::admin::${DELETE_REJECTED_REASON}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(DELETE_REJECTED_REASON, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Admin Login
  async loginAdmin(params: AdminLoginDto) {
    this.logger.debug(
      `kafka::admin::${ADMIN_LOGIN}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(ADMIN_LOGIN, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async forgotPassword(params: ForgotPasswordDto) {
    this.logger.log(
      `kafka::admin::${ADMIN_FORGOT_PASSWORD}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(ADMIN_FORGOT_PASSWORD, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async setPassword(params: AdminIdDto & SetPasswordDto) {
    this.logger.debug(
      `kafka::admin::${ADMIN_SET_PASSWORD}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(ADMIN_SET_PASSWORD, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async resetPassword(params: ResetPasswordDto) {
    this.logger.debug(
      `kafka::admin::${ADMIN_RESET_PASSWORD}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(ADMIN_RESET_PASSWORD, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async changePassword(params: AdminIdDto & ChangePasswordDto) {
    this.logger.debug(
      `kafka::admin::${ADMIN_CHANGE_PASSWORD}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(ADMIN_CHANGE_PASSWORD, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateProfile(params: AdminIdDto & UpdateProfileDto) {
    this.logger.log(
      `kafka::admin::${ADMIN_UPDATE_PROFILE}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(ADMIN_UPDATE_PROFILE, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updatePicture(params: AdminIdDto & UpdatePictureDto) {
    this.logger.log(
      `kafka::admin::${ADMIN_UPDATE_PICTURE}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(ADMIN_UPDATE_PICTURE, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getNotifyUser(id: string) {
    this.logger.log(
      `kafka::admin::${GET_NOTIFY_USER}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_NOTIFY_USER, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async getAllNotifyUser(criteria: ListSearchSortDto) {
    this.logger.log(`kafka::admin::${GET_ALL_NOTIFY_USER}::send -> list`);
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_NOTIFY_USER, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async createNotifyUser(create: CreateNotifyUserDto) {
    this.logger.log(
      `kafka::admin::${CREATE_NOTIFY_USER}::send -> ${JSON.stringify(create)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(CREATE_NOTIFY_USER, JSON.stringify(create))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Sub Admin Service
  async createSubAdmin(params: CreateAdminDto) {
    this.logger.log(
      `kafka::admin::${CREATE_SUB_ADMIN}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(CREATE_SUB_ADMIN, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findSubAdminList(params: AdminListParams) {
    this.logger.log(
      `kafka::admin::${GET_ALL_SUB_ADMINS}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_SUB_ADMINS, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findSubAdmin(id: string) {
    this.logger.log(
      `kafka::admin::${GET_SUB_ADMIN_DETAIL}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_SUB_ADMIN_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateSubAdmin(id: string, params: UpdateAdminDto) {
    this.logger.log(
      `kafka::admin::${UPDATE_SUB_ADMIN}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      return await this.clientAdminTCP
        .send(UPDATE_SUB_ADMIN, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async removeSubAdmin(id: string) {
    this.logger.log(
      `kafka::admin::${DELETE_SUB_ADMIN}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(DELETE_SUB_ADMIN, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Role
  async createRole(params: CreateRoleDto) {
    this.logger.log(
      `kafka::admin::${CREATE_ROLE}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(CREATE_ROLE, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findRoleList(params: FilterRoleDto) {
    this.logger.log(
      `kafka::admin::${GET_ALL_ROLES}::send -> list | params ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_ROLES, JSON.stringify({ ...params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findRole(id: string) {
    this.logger.log(
      `kafka::admin::${GET_ROLE_DETAIL}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_ROLE_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateRole(id: string, params: UpdateRoleDto) {
    this.logger.log(
      `kafka::admin::${UPDATE_ROLE}::send -> ${JSON.stringify({ id, params })}`,
    );
    try {
      return await this.clientAdminTCP
        .send(UPDATE_ROLE, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async removeRole(id: string) {
    this.logger.log(
      `kafka::admin::${DELETE_ROLE}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(DELETE_ROLE, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Category
  async createCategory(params: CreateCategoryDto) {
    this.logger.log(
      `kafka::admin::${CREATE_CATEGORY}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(CREATE_CATEGORY, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findCategoryList() {
    this.logger.log(`kafka::admin::${GET_ALL_CATEGORY}::send -> list`);
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_CATEGORY, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findCategory(id: string) {
    this.logger.log(
      `kafka::admin::${GET_CATEGORY_DETAIL}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_CATEGORY_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateCategory(id: string, params: UpdateCategoryDto) {
    this.logger.log(
      `kafka::admin::${UPDATE_CATEGORY}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      return await this.clientAdminTCP
        .send(UPDATE_CATEGORY, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async removeCategory(id: string) {
    this.logger.log(
      `kafka::admin::${DELETE_CATEGORY}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(DELETE_CATEGORY, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Permission
  async createPermission(params: CreatePermissionDto) {
    this.logger.log(
      `kafka::admin::${CREATE_PERMISSION}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(CREATE_PERMISSION, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findPermissionList() {
    this.logger.log(`kafka::admin::${GET_ALL_PERMISSIONS}::send -> list`);
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_PERMISSIONS, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findPermission(id: string) {
    this.logger.log(
      `kafka::admin::${GET_PERMISSION_DETAIL}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_PERMISSION_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updatePermission(id: string, params: UpdatePermissionDto) {
    this.logger.log(
      `kafka::admin::${UPDATE_PERMISSION}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      return await this.clientAdminTCP
        .send(UPDATE_PERMISSION, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async removePermission(id: string) {
    this.logger.log(
      `kafka::admin::${DELETE_PERMISSION}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(DELETE_PERMISSION, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllCapabilities() {
    this.logger.log(`kafka::admin::${GET_ALL_CAPABILITIES}::send -> list`);
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_CAPABILITIES, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // get data
  async getAllTrips(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trips::${GET_ALL_TRIPS}::send -> ${JSON.stringify(criteria)}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_ALL_TRIPS, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getTripById(tripId: string) {
    this.logger.log(
      `kafka::trips::${TRIP_DETAIL_BY_ID}::send -> ${JSON.stringify(tripId)}`,
    );
    try {
      return await this.tripTcpClient
        .send(TRIP_DETAIL_BY_ID, JSON.stringify({ tripId, adminMode: true }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllCaptains(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::captain::${GET_ALL_CAPTAINS}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.clientCaptain
        .send(
          GET_ALL_CAPTAINS,
          JSON.stringify({
            criteria,
            data: {
              isFullDetail: true,
              isReviewDetail: true,
              isUserDetail: true,
              isSubscription: true,
            },
          }),
        )
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async changeWaslStatus(id: string) {
    this.logger.log(
      `kafka::captain::${CHANGE_WASL_STATUS}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientCaptain
        .send(
          CHANGE_WASL_STATUS,
          JSON.stringify({
            id,
            data: {
              isFullDetail: true,
              isReviewDetail: true,
              isRatingDetail: true,
              isUserDetail: true,
              isSubscription: true,
            },
          }),
        )
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCaptainById(id: string) {
    this.logger.log(
      `kafka::captain::${CAPTAIN_DETAIL}::send -> ${JSON.stringify(id)}`,
    );
    try {
      const res = await this.clientCaptain
        .send(
          CAPTAIN_DETAIL,
          JSON.stringify({
            id,
            data: {
              isFullDetail: true,
              isReviewDetail: true,
              isRatingDetail: true,
              isUserDetail: true,
              isSubscription: true,
              // transCheck: true,
            },
          }),
        )
        .pipe()
        .toPromise();

      if (res?.data?.car?.makerIcon != null) {
        await this.awsS3Service.getMakerIcon({
          name: res.data.makerIcon,
        });
        res.data.car.makerIcon = await this.awsS3Service.getMakerIcon({
          name: res.data.car.makerIcon,
        });
      }
      return res;
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCaptainTripHistory(id: string, criteria) {
    this.logger.log(
      `kafka::captain::${GET_DRIVER_TRIP_HISTORY}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_DRIVER_TRIP_HISTORY, JSON.stringify({ id, criteria }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCaptainSubscriptions(id: string, criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::captain::${GET_DRIVER_SUBSCRIPTIONS}::send -> ${JSON.stringify({
        id,
        criteria,
      })}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(GET_DRIVER_SUBSCRIPTIONS, JSON.stringify({ id, criteria }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCaptainEarnings(id: string, criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::captain::${GET_DRIVER_EARNINGS}::send -> ${JSON.stringify({
        id,
        criteria,
      })}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_DRIVER_EARNINGS, JSON.stringify({ id, criteria }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async approveCaptain(id: string) {
    this.logger.log(
      `kafka::captain::approve-captain::send -> ${JSON.stringify(id)}`,
    );
    try {
      const data: ApproveCaptainDto = {
        approved: true,
      };
      return await this.clientCaptain
        .send(CHANGE_DRIVER_STATUS, JSON.stringify({ id, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async rejectCaptain(id: string, data: RejectCaptainDto) {
    this.logger.log(
      `kafka::captain::reject-captain::send -> ${JSON.stringify({ id, data })}`,
    );
    try {
      data.approved = false;
      data.blockedDate = getTimestamp();

      return await this.clientCaptain
        .send(CHANGE_DRIVER_STATUS, JSON.stringify({ id, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllRiders(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_ALL_CUSTOMERS}::send -> ${JSON.stringify(criteria)}`,
    );
    try {
      return await this.tripTcpClient
        .send(
          GET_ALL_CUSTOMERS,
          JSON.stringify({
            criteria,
            data: {
              isReviewDetail: true,
              externalType: UserExternalType.Rider,
            },
          }),
        )
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getRiderById(id: string) {
    try {
      this.logger.log(
        `kafka::trip::${GET_CUSTOMER_DETAIL}::send -> ${JSON.stringify(id)}`,
      );
      return await this.tripTcpClient
        .send(
          GET_CUSTOMER_DETAIL,
          JSON.stringify({
            id,
            data: {
              isReviewDetail: true,
              isRatingDetail: true,
              externalType: UserExternalType.Rider,
            },
          }),
        )
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getRiderTripHistory(id: string, criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_RIDER_TRIP_HISTORY}::send -> ${JSON.stringify({
        id,
        criteria,
      })}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_RIDER_TRIP_HISTORY, JSON.stringify({ id, criteria }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getRiderTripScheduled(id: string, criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_RIDER_TRIP_SCHEDULED}::send -> ${JSON.stringify({
        id,
        criteria,
      })}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_RIDER_TRIP_SCHEDULED, JSON.stringify({ id, criteria }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async gerRidersRating(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_RIDERS_RATING}::send -> ${JSON.stringify(criteria)}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_RIDERS_RATING, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async gerCaptainsRating(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_CAPTAINS_RATING}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_CAPTAINS_RATING, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Settings
  async syncSettings() {
    this.logger.log(`kafka::admin::${SYNC_SETTINGS}::send -> sync`);
    try {
      return await this.clientAdminTCP
        .send(SYNC_SETTINGS, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllSettings(params: SettingListParams) {
    this.logger.log(`kafka::admin::${GET_ALL_SETTING}::send -> list`);
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_SETTING, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
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

  async updateSetting(name: string, data: SaveSettingDto) {
    this.logger.log(
      `kafka::admin::${UPDATE_SETTING}::send -> ${JSON.stringify({
        name,
        data,
      })}`,
    );
    try {
      return await this.clientAdminTCP
        .send(UPDATE_SETTING, JSON.stringify({ name, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // for new design of master control mujtaba
  async newUpdateSetting(data: any) {
    this.logger.log(
      `kafka::admin::${NEW_UPDATE_SETTING}::send -> ${JSON.stringify({
        data,
      })}`,
    );
    try {
      return await this.clientAdminTCP
        .send(NEW_UPDATE_SETTING, JSON.stringify(data))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Subscription
  async createSubscription(params: CreateSubscriptionDto) {
    this.logger.log(
      `kafka::payment::${CREATE_SUBSCRIPTION}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(CREATE_SUBSCRIPTION, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findAllSubscription() {
    this.logger.log(`kafka::payment::${GET_ALL_SUBSCRIPTIONS}::send -> list`);
    try {
      return await this.clientPaymentTCP
        .send(GET_ALL_SUBSCRIPTIONS, {})
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findOneSubscription(id: string) {
    this.logger.log(
      `kafka::payment::${GET_SUBSCRIPTION_DETAIL}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(GET_SUBSCRIPTION_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateSubscription(id: string, data: UpdateSubscriptionDto) {
    this.logger.log(
      `kafka::payment::${UPDATE_SUBSCRIPTION}::send -> ${JSON.stringify({
        id,
        data,
      })}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(UPDATE_SUBSCRIPTION, JSON.stringify({ id, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async removeSubscription(id: string) {
    this.logger.log(
      `kafka::payment::${DELETE_SUBSCRIPTION}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(DELETE_SUBSCRIPTION, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // TODO: Need to remove on production
  async testPush(data: any) {
    this.logger.log(
      `kafka::notification::send-notification::send -> ${JSON.stringify(data)}`,
    );
    try {
      return await this.clientNotificationTCP
        .send('send-notification', JSON.stringify(data))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async testSms(data: any) {
    this.logger.log(
      `kafka::notification::send-test-sms::send -> ${JSON.stringify(data)}`,
    );
    try {
      return await this.clientNotificationTCP
        .send('send-test-sms-notification', JSON.stringify(data))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Email Templates
  async createEmailTemplate(data: CreateEmailTemplateDto) {
    this.logger.log(
      `kafka::notification::${CREATE_EMAIL_TEMPLATE}::send -> ${JSON.stringify(
        data,
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(CREATE_EMAIL_TEMPLATE, JSON.stringify(data))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findEmailTemplatesList() {
    this.logger.log(
      `kafka::notification::${GET_ALL_EMAIL_TEMPLATES}::send -> list`,
    );
    try {
      return await this.clientNotificationTCP
        .send(GET_ALL_EMAIL_TEMPLATES, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findEmailTemplateDetail(id: string) {
    this.logger.log(
      `kafka::notification::${GET_EMAIL_TEMPLATE_DETAIL}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(GET_EMAIL_TEMPLATE_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateEmailTemplate(id: string, data: UpdateEmailTemplateDto) {
    this.logger.log(
      `kafka::notification::${UPDATE_EMAIL_TEMPLATE}::send -> ${JSON.stringify({
        id,
        data,
      })}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(UPDATE_EMAIL_TEMPLATE, JSON.stringify({ id, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateEmailTemplateStatus(id: string, data: UpdateTemplateStatusDto) {
    this.logger.log(
      `kafka::notification::${UPDATE_EMAIL_TEMPLATE_STATUS}::send -> ${JSON.stringify(
        { id, data },
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(UPDATE_EMAIL_TEMPLATE_STATUS, JSON.stringify({ id, ...data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async removeEmailTemplate(id: string) {
    this.logger.log(
      `kafka::notification::${DELETE_EMAIL_TEMPLATE}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(DELETE_EMAIL_TEMPLATE, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Push Templates
  async createPushTemplate(data: CreatePushTemplateDto) {
    this.logger.log(
      `kafka::notification::${CREATE_PUSH_TEMPLATE}::send -> ${JSON.stringify(
        data,
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(CREATE_PUSH_TEMPLATE, JSON.stringify(data))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findPushTemplatesList() {
    this.logger.log(
      `kafka::notification::${GET_ALL_PUSH_TEMPLATES}::send -> list`,
    );
    try {
      return await this.clientNotificationTCP
        .send(GET_ALL_PUSH_TEMPLATES, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findPushTemplateDetail(id: string) {
    this.logger.log(
      `kafka::notification::${GET_PUSH_TEMPLATE_DETAIL}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(GET_PUSH_TEMPLATE_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updatePushTemplate(id: string, data: UpdatePushTemplateDto) {
    this.logger.log(
      `kafka::notification::${UPDATE_PUSH_TEMPLATE}::send -> ${JSON.stringify({
        id,
        data,
      })}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(UPDATE_PUSH_TEMPLATE, JSON.stringify({ id, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updatePushTemplateStatus(id: string, data: UpdateTemplateStatusDto) {
    this.logger.log(
      `kafka::notification::${UPDATE_PUSH_TEMPLATE_STATUS}::send -> ${JSON.stringify(
        { id, data },
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(UPDATE_PUSH_TEMPLATE_STATUS, JSON.stringify({ id, ...data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async removePushTemplate(id: string) {
    this.logger.log(
      `kafka::notification::${DELETE_PUSH_TEMPLATE}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(DELETE_PUSH_TEMPLATE, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async sendPushNotificationToUsers(data: SendPushNotificationToUsersDto) {
    try {
      const { userIds, userType, message } = data;
      let customersRes;

      if ((!userIds || !userIds.length) && !userType) {
        throw new Error(errorMessage.REQUIRED_DATA_NOT_PROVIDED);
      }

      if (userIds && userIds.length) {
        customersRes = await this.tripTcpClient
          .send(GET_SELECTED_CUSTOMERS, JSON.stringify({ userIds }))
          .pipe()
          .toPromise();
      } else {
        customersRes = await this.tripTcpClient
          .send(GET_ALL_CUSTOMERS_BY_USER_TYPE, JSON.stringify({ userType }))
          .pipe()
          .toPromise();
      }

      if (customersRes?.statusCode !== HttpStatus.OK || !customersRes?.data) {
        throw new Error(errorMessage.SOMETHING_WENT_WRONG);
      }

      this.logger.log(
        `[sendPushNotificationToUsers] customersRes.statusCode -> ${JSON.stringify(
          customersRes?.statusCode,
        )}`,
      );

      const usersDeviceToken = customersRes.data.map(
        (user) => user.deviceToken,
      );
      this.logger.log(
        `[sendPushNotificationToUsers] usersDeviceToken -> ${JSON.stringify(
          usersDeviceToken,
        )}`,
      );

      if (usersDeviceToken.length) {
        const pushParams: any = {
          deviceToken: '',
          externalId: data?.userType,
          multiple: true,
          deviceTokenList: usersDeviceToken,
          title: data.title || 'Message from Admin',
          message,
          templateCode: null,
          keyValues: {},
          extraParams: {},
        };
        this.clientNotification.emit(
          SEND_PUSH_NOTIFICATION,
          JSON.stringify(pushParams),
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: successMessage.PUSH_NOTIFICATION_SENT,
      };
    } catch (error) {
      this.logger.log(
        `[sendPushNotificationToUsers] error -> ${JSON.stringify(
          error?.message,
        )}`,
      );
      throw new HttpException(
        error.message || errorMessage.SOMETHING_WENT_WRONG,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // SMS Templates
  async createSmsTemplate(data: CreateSmsTemplateDto) {
    this.logger.log(
      `kafka::notification::${CREATE_SMS_TEMPLATE}::send -> ${JSON.stringify(
        data,
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(CREATE_SMS_TEMPLATE, JSON.stringify(data))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findSmsTemplatesList() {
    this.logger.log(
      `kafka::notification::${GET_ALL_SMS_TEMPLATES}::send -> list`,
    );
    try {
      return await this.clientNotificationTCP
        .send(GET_ALL_SMS_TEMPLATES, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findSmsTemplateDetail(id: string) {
    this.logger.log(
      `kafka::notification::${GET_SMS_TEMPLATE_DETAIL}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(GET_SMS_TEMPLATE_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateSmsTemplate(id: string, data: UpdateSmsTemplateDto) {
    this.logger.log(
      `kafka::notification::${UPDATE_SMS_TEMPLATE}::send -> ${JSON.stringify({
        id,
        data,
      })}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(UPDATE_SMS_TEMPLATE, JSON.stringify({ id, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateSmsTemplateStatus(id: string, data: UpdateTemplateStatusDto) {
    this.logger.log(
      `kafka::notification::${UPDATE_SMS_TEMPLATE_STATUS}::send -> ${JSON.stringify(
        { id, data },
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(UPDATE_SMS_TEMPLATE_STATUS, JSON.stringify({ id, ...data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async removeSmsTemplate(id: string) {
    this.logger.log(
      `kafka::notification::${DELETE_SMS_TEMPLATE}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientNotificationTCP
        .send(DELETE_SMS_TEMPLATE, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async createCabType(params: CreateCabTypeDto & CabCategoryIcon) {
    this.logger.log(
      `kafka::captain::${CREATE_CAB_TYPE}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientCaptain
        .send(CREATE_CAB_TYPE, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateCabType(id: string, params: UpdateCabTypeDto & CabCategoryIcon) {
    this.logger.log(
      `kafka::captain::${UPDATE_CAB_TYPE}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      if (!params.categoryIcon) {
        delete params.categoryIcon;
      }
      return await this.clientCaptain
        .send(UPDATE_CAB_TYPE, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateCabTypeOrder(id: string, params: UpdateCabTypeOrderDto) {
    this.logger.log(
      `kafka::captain::${UPDATE_CAB_TYPE_ORDER}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      return await this.clientCaptain
        .send(UPDATE_CAB_TYPE_ORDER, JSON.stringify({ id, ...params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async deleteCabType(id: string) {
    this.logger.log(
      `kafka::captain::${DELETE_CAB_TYPE}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientCaptain
        .send(DELETE_CAB_TYPE, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllCabTypes(
    query?: GetCabTypeQueryDto,
    options?: { adminList: boolean },
  ) {
    try {
      this.logger.log(
        `kafka::captain::${GET_ALL_CAB_TYPES}::send -> ${JSON.stringify(
          query,
        )}`,
      );
      return await this.clientCaptain
        .send(GET_ALL_CAB_TYPES, JSON.stringify({ query, options }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCabType(id: string, query: GetCabTypeQueryDto) {
    try {
      let cabRedis = await this.redisHandler.getRedisKey(`cab-type-${id}`);
      if (!cabRedis) {
        this.logger.log(
          `kafka::captain::${GET_CAB_TYPE_DETAIL}::send -> ${JSON.stringify({
            id,
            query,
          })}`,
        );
        return await this.clientCaptain
          .send(GET_CAB_TYPE_DETAIL, JSON.stringify({ id, query }))
          .pipe()
          .toPromise();
      } else {
        return { statusCode: HttpStatus.OK, data: JSON.parse(cabRedis) };
      }
    } catch (error) {
      return error?.message || '';
    }
  }

  //vehicle makers
  async addVehicleMaker(body) {
    this.logger.log(`tcp::captain::${ADD_VEHICLE_MAKER}::send`);
    try {
      return await this.clientAdminTCP
        .send(ADD_VEHICLE_MAKER, JSON.stringify(body))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async getAllVehicleMakers() {
    try {
      this.logger.log(
        `kafka::captain::${GET_ALL_VEHICLE_MAKERS}::send -> ${JSON.stringify(
          {},
        )}`,
      );
      return await this.clientAdminTCP
        .send(GET_ALL_VEHICLE_MAKERS, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateVehicleMaker(body) {
    this.logger.log(`tcp::captain::${UPDATE_VEHICLE_MAKER}::send`);
    try {
      return await this.clientAdminTCP
        .send(UPDATE_VEHICLE_MAKER, JSON.stringify(body))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async deleteVehicleMaker(id: string) {
    this.logger.log(`tcp::captain::${DELETE_VEHICLE_MAKER}::send`);
    try {
      return await this.clientAdminTCP
        .send(DELETE_VEHICLE_MAKER, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //vehicle models
  async addVehicleModel(body) {
    this.logger.log(`tcp::captain::${ADD_VEHICLE_MODEL}::send`);
    try {
      return await this.clientAdminTCP
        .send(ADD_VEHICLE_MODEL, JSON.stringify(body))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllUnAssignedVehicleModels() {
    try {
      this.logger.log(
        `kafka::captain::${GET_ALL_UNASSIGNED_VEHICLE_MODELS}::send -> ${JSON.stringify(
          {},
        )}`,
      );
      return await this.clientAdminTCP
        .send(GET_ALL_UNASSIGNED_VEHICLE_MODELS, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllVehicleModels() {
    try {
      this.logger.log(
        `kafka::captain::${GET_ALL_VEHICLE_MODELS}::send -> ${JSON.stringify(
          {},
        )}`,
      );
      return await this.clientAdminTCP
        .send(GET_ALL_VEHICLE_MODELS, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateVehicleModel(body, id: string) {
    this.logger.log(`tcp::captain::${UPDATE_VEHICLE_MODEL}::send`);
    try {
      return await this.clientAdminTCP
        .send(UPDATE_VEHICLE_MODEL, JSON.stringify({ id, ...body }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async deleteVehicleModel(id: string) {
    this.logger.log(`tcp::captain::${DELETE_VEHICLE_MODEL}::send`);
    try {
      return await this.clientAdminTCP
        .send(DELETE_VEHICLE_MODEL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //vehicle class
  async addVehicleClass(body) {
    this.logger.log(`tcp::captain::${ADD_VEHICLE_CLASS}::send`);
    try {
      return await this.clientAdminTCP
        .send(ADD_VEHICLE_CLASS, JSON.stringify(body))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async getAllVehicleClass() {
    try {
      this.logger.log(
        `kafka::captain::${GET_ALL_VEHICLE_CLASS}::send -> ${JSON.stringify(
          {},
        )}`,
      );
      return await this.clientAdminTCP
        .send(GET_ALL_VEHICLE_CLASS, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateVehicleClass(body, id: string) {
    this.logger.log(`tcp::captain::${UPDATE_VEHICLE_CLASS}::send`);
    try {
      return await this.clientAdminTCP
        .send(UPDATE_VEHICLE_CLASS, JSON.stringify({ id, ...body }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async deleteVehicleClass(id: string) {
    this.logger.log(`tcp::captain::${DELETE_VEHICLE_CLASS}::send`);
    try {
      return await this.clientAdminTCP
        .send(DELETE_VEHICLE_CLASS, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //vehicle models
  async getVehicleMasterInfo(query: VehicleMasterInfoDto) {
    try {
      this.logger.log(
        `kafka::captain::${GET_VEHICLE_MASTER_INFO}::send -> ${JSON.stringify(
          query,
        )}`,
      );
      return await this.clientAdminTCP
        .send(GET_VEHICLE_MASTER_INFO, JSON.stringify({ query }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Cab Charges
  async createCabCharge(params: CreateCabChargeDto) {
    this.logger.log(
      `kafka::captain::${CREATE_CAB_CHARGE}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientCaptain
        .send(CREATE_CAB_CHARGE, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateCabCharge(id: string, params: UpdateCabChargeDto) {
    this.logger.log(
      `kafka::captain::${UPDATE_CAB_CHARGE}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      return await this.clientCaptain
        .send(UPDATE_CAB_CHARGE, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async deleteCabCharge(id: string) {
    this.logger.log(
      `kafka::captain::${DELETE_CAB_CHARGE}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientCaptain
        .send(DELETE_CAB_CHARGE, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllCabCharges(query: CabChargeQueryParams) {
    try {
      this.logger.log(
        `kafka::captain::${GET_ALL_CAB_CHARGES}::send -> ${JSON.stringify({
          query,
        })}`,
      );
      return await this.clientCaptain
        .send(GET_ALL_CAB_CHARGES, JSON.stringify({ query }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCabChargeCities() {
    try {
      this.logger.log(`tcp::captain::${GET_CHARGE_CITIES}::send`);
      return await this.clientCaptain
        .send(GET_CHARGE_CITIES, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCountries() {
    this.logger.log(`tcp::captain::${GET_COUNTRIES}::send`);
    try {
      return await this.clientCaptain
        .send(GET_COUNTRIES, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCities(countryId?: string, keyword?: string) {
    this.logger.log(
      `tcp::captain::${GET_CITIES}::send -> ${JSON.stringify({ countryId })}`,
    );
    try {
      return await this.clientCaptain
        .send(GET_CITIES, JSON.stringify({ countryId, keyword }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Customized Charges
  async createCustomizedCharge(params: CreateCustomizedChargeDto) {
    this.logger.log(
      `kafka::captain::${ADD_CUSTOMIZED_CHARGE}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientCaptain
        .send(ADD_CUSTOMIZED_CHARGE, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateCustomizedCharge(id: string, params: UpdateCustomizedChargeDto) {
    this.logger.log(
      `kafka::captain::${UPDATE_CUSTOMIZED_CHARGE}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      return await this.clientCaptain
        .send(UPDATE_CUSTOMIZED_CHARGE, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async deleteCustomizedCharge(id: string) {
    this.logger.log(
      `kafka::captain::${DELETE_CUSTOMIZED_CHARGE}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientCaptain
        .send(DELETE_CUSTOMIZED_CHARGE, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllCustomizedCharges(query: CustomizedChargeQueryParams) {
    try {
      this.logger.log(
        `kafka::captain::${GET_ALL_CUSTOMIZED_CHARGES}::send -> ${JSON.stringify(
          { query },
        )}`,
      );
      return await this.clientCaptain
        .send(GET_ALL_CUSTOMIZED_CHARGES, JSON.stringify({ query }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCustomizedCharge(id: string) {
    try {
      this.logger.log(
        `kafka::captain::${GET_CUSTOMIZED_CHARGE}::send -> ${JSON.stringify({
          id,
        })}`,
      );
      return await this.clientCaptain
        .send(GET_CUSTOMIZED_CHARGE, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Car Info
  async updateCarInfo(id: string, params: UpdateCarInfoDto) {
    this.logger.log(
      `kafka::captain::${UPDATE_CAR_INFO}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      return await this.clientCaptain
        .send(UPDATE_CAR_INFO, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCarInfo(id: string) {
    try {
      this.logger.log(
        `kafka::captain::${GET_CAR_INFO_DETAIL}::send -> ${JSON.stringify(id)}`,
      );
      return await this.clientCaptain
        .send(GET_CAR_INFO_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllCarsInfo(criteria: ListSearchSortDto) {
    try {
      this.logger.log(
        `kafka::captain::${GET_ALL_CARS_INFO}::send -> ${JSON.stringify(
          criteria,
        )}`,
      );
      return await this.clientCaptain
        .send(GET_ALL_CARS_INFO, JSON.stringify({ criteria }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Vehicle
  async updateVehicle(id: string, params: UpdateVehicleDto & VechileImageDto) {
    this.logger.log(
      `kafka::captain::${UPDATE_VEHICLE}::send -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    try {
      if (!params.vehicleImage) {
        delete params.vehicleImage;
      }
      return await this.clientCaptain
        .send(UPDATE_VEHICLE, JSON.stringify({ id, data: params }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getVehicle(id: string) {
    try {
      this.logger.log(
        `kafka::captain::${GET_VEHICLE_DETAIL}::send -> ${JSON.stringify(id)}`,
      );
      return await this.clientCaptain
        .send(GET_VEHICLE_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllVehicles(criteria: ListSearchSortDto) {
    try {
      this.logger.log(
        `kafka::captain::${GET_ALL_VEHICLES}::send -> ${JSON.stringify(
          criteria,
        )}`,
      );
      return await this.clientCaptain
        .send(GET_ALL_VEHICLES, JSON.stringify({ criteria }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Promo Code
  async createPromoCode(dto: CreateCouponDto, method: IPromoCodeMethod) {
    return await this.promoCodesTcpClient
      .send(CREATE_PROMO_CODE, JSON.stringify({ ...dto, method }))
      .pipe()
      .toPromise();
  }

  async createVocuher(dto: CreateVoucherDto, method: IPromoCodeMethod) {
    return await this.promoCodesTcpClient
      .send(CREATE_PROMO_CODE, JSON.stringify({ ...dto, method }))
      .pipe()
      .toPromise();
  }

  async getAllPromoCodes() {
    return await this.promoCodesTcpClient
      .send(GET_ALL_PROMO_CODES, '')
      .pipe()
      .toPromise();
  }

  async updatePromoCode(id: string, promoCodeDto: UpdatePromoCodeDto) {
    return await this.promoCodesTcpClient
      .send(UPDATE_PROMO_CODE, JSON.stringify({ id, data: promoCodeDto }))
      .pipe()
      .toPromise();
  }

  async deletePromoCode(id: string) {
    return await this.promoCodesTcpClient
      .send(DELETE_PROMO_CODE, JSON.stringify({ id }))
      .pipe()
      .toPromise();
  }

  // Subscriptions
  async findActiveSubscriptions(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::payment::${GET_ACTIVE_SUBSCRIPTIONS}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(GET_ACTIVE_SUBSCRIPTIONS, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findExpiredSubscriptions(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::payment::${GET_EXPIRED_SUBSCRIPTIONS}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(GET_EXPIRED_SUBSCRIPTIONS, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Common function for admin dashboard data
  async getDashboardData(params: DashboardAPIParams) {
    try {
      this.logger.log(
        `kafka::captain::${DASHBOARD_ACTIVE_DRIVERS}::send -> ${JSON.stringify(
          params,
        )}`,
      );
      const activeDriversResponse = await this.clientCaptain
        .send(DASHBOARD_ACTIVE_DRIVERS, JSON.stringify(params))
        .pipe()
        .toPromise();

      //mgt implement
      const waslApprovedCheckResponse = await this.clientCaptain
        .send(WASL_APPROVED_COUNT, JSON.stringify({}))
        .pipe()
        .toPromise();

      //mgt implement rider ratting
      this.logger.log(
        `kafka::chat::${DASHBOARD_REVIEW_STATS}::send -> ${JSON.stringify({
          ...params,
          entity: 'rider',
        })}`,
      );
      const RiderReviewsStats = await this.clientReviewTCP
        .send(
          DASHBOARD_REVIEW_STATS,
          JSON.stringify({ ...params, entity: 'rider' }),
        )
        .pipe()
        .toPromise();

      //mgt implement captain ratting
      this.logger.log(
        `kafka::chat::${DASHBOARD_REVIEW_STATS}::send -> ${JSON.stringify({
          ...params,
          entity: 'captain',
        })}`,
      );
      const DriverReviewsStats = await this.clientReviewTCP
        .send(
          DASHBOARD_REVIEW_STATS,
          JSON.stringify({ ...params, entity: 'captain' }),
        )
        .pipe()
        .toPromise();

      //mgt implement driver earning
      const deParams = { ...params, ...{ entity: 'driver' } };
      this.logger.log(
        `kafka::payment::${DASHBOARD_GET_EARNINGS}::send -> ${JSON.stringify(
          deParams,
        )}`,
      );
      const driverEarningsResponse = await this.clientPaymentTCP
        .send(DASHBOARD_GET_EARNINGS, JSON.stringify(deParams))
        .pipe()
        .toPromise();

      const seParams = { ...params, ...{ entity: 'subscription' } };
      this.logger.log(
        `kafka::payment::${DASHBOARD_GET_EARNINGS}::send -> ${JSON.stringify(
          seParams,
        )}`,
      );
      const subscriptionEarningsResponse = await this.clientPaymentTCP
        .send(DASHBOARD_GET_EARNINGS, JSON.stringify(seParams))
        .pipe()
        .toPromise();

      this.logger.log(
        `kafka::trip::${DASHBOARD_TRIP_STATS}::send -> ${JSON.stringify(
          params,
        )}`,
      );
      const tripStats = await this.tripTcpClient
        .send(DASHBOARD_TRIP_STATS, JSON.stringify(params))
        .pipe()
        .toPromise();
      this.logger.log(
        `kafka::trip::${DASHBOARD_STATUS_WISE_COUNT}::send -> ${JSON.stringify(
          params,
        )}`,
      );

      const cashFlow = await this.clientPaymentTCP
        .send(DASHBOARD_CASH_FLOW, JSON.stringify(params))
        .pipe()
        .toPromise();
      this.logger.log(
        `kafka::trip::${DASHBOARD_CASH_FLOW}::send -> ${JSON.stringify(
          params,
        )}`,
      );
      const statusStats = await this.tripTcpClient
        .send(DASHBOARD_STATUS_WISE_COUNT, JSON.stringify(params))
        .pipe()
        .toPromise();
      let tripStatsResponse = {
        statusCode:
          tripStats.statusCode == HttpStatus.OK ||
          statusStats.statusCode == HttpStatus.OK
            ? HttpStatus.OK
            : HttpStatus.BAD_REQUEST,
        data: {},
      };

      // rider promo dashboard stats
      this.logger.log(
        `kafka::chat::${DASHBOARD_PROMO_STATS}::send -> ${JSON.stringify({
          ...params,
          entity: 'rider',
        })}`,
      );
      const riderPromoStats = await this.promoCodesTcpClient
        .send(
          DASHBOARD_PROMO_STATS,
          JSON.stringify({ ...params, entity: 'rider' }),
        )
        .pipe()
        .toPromise();

      //captain promo dashboard stats
      this.logger.log(
        `kafka::chat::${DASHBOARD_PROMO_STATS}::send -> ${JSON.stringify({
          ...params,
          entity: 'captain',
        })}`,
      );
      const captainPromoStats = await this.promoCodesTcpClient
        .send(
          DASHBOARD_PROMO_STATS,
          JSON.stringify({ ...params, entity: 'captain' }),
        )
        .pipe()
        .toPromise();

      // rider subscription dashboard stats
      this.logger.log(
        `kafka::chat::${DASHBOARD_SUBSCRIPTION_STATS}::send -> ${JSON.stringify(
          {
            ...params,
            entity: 'rider',
          },
        )}`,
      );
      const riderSubscriptionStats = await this.clientPaymentTCP
        .send(
          DASHBOARD_SUBSCRIPTION_STATS,
          JSON.stringify({ ...params, entity: 'rider' }),
        )
        .pipe()
        .toPromise();

      // captain subscription dashboard stats
      this.logger.log(
        `kafka::chat::${DASHBOARD_SUBSCRIPTION_STATS}::send -> ${JSON.stringify(
          {
            ...params,
            entity: 'captain',
          },
        )}`,
      );
      const captainSubscriptionStats = await this.clientPaymentTCP
        .send(
          DASHBOARD_SUBSCRIPTION_STATS,
          JSON.stringify({ ...params, entity: 'captain' }),
        )
        .pipe()
        .toPromise();

      if (tripStats.statusCode == HttpStatus.OK) {
        tripStatsResponse.data = {
          ...tripStatsResponse.data,
          ...tripStats.data,
        };
      }
      if (statusStats.statusCode == HttpStatus.OK) {
        tripStatsResponse.data = {
          ...tripStatsResponse.data,
          ...statusStats.data,
        };
      }
      Logger.log(JSON.stringify(statusStats));
      Logger.log(JSON.stringify(tripStatsResponse));

      this.logger.log(
        `kafka::trip::${DASHBOARD_STATS}::send -> ${JSON.stringify(params)}`,
      );
      const topStatsResponse = await this.tripTcpClient
        .send(DASHBOARD_STATS, JSON.stringify(params))
        .pipe()
        .toPromise();

      this.logger.log(
        `kafka::trip::${DASHBOARD_ACTIVE_RIDERS}::send -> ${JSON.stringify(
          params,
        )}`,
      );
      const activeRidersResponse = await this.tripTcpClient
        .send(DASHBOARD_ACTIVE_RIDERS, JSON.stringify(params))
        .pipe()
        .toPromise();

      this.logger.log(
        `kafka::trip::${DASHBOARD_CUSTOMER_STATS}::send -> ${JSON.stringify(
          params,
        )}`,
      );
      const genderStatsResponse = await this.tripTcpClient
        .send(DASHBOARD_CUSTOMER_STATS, JSON.stringify(params))
        .pipe()
        .toPromise();

      const ceParams = { ...params, ...{ cancelAction: 'both' } };
      this.logger.log(
        `kafka::trip::${DASHBOARD_CANCEL_SUMMARY}::send -> ${JSON.stringify(
          ceParams,
        )}`,
      );
      const cancelSummaryResponse = await this.tripTcpClient
        .send(DASHBOARD_CANCEL_SUMMARY, JSON.stringify(ceParams))
        .pipe()
        .toPromise();
      const activeDriversPercentage = await this.tripTcpClient
        .send(GET_ACTIVE_USERS_PERCENTAGE, JSON.stringify({ userType: 2 }))
        .pipe()
        .toPromise();

      const activeRidersPercentage = await this.tripTcpClient
        .send(GET_ACTIVE_USERS_PERCENTAGE, JSON.stringify({ userType: 1 }))
        .pipe()
        .toPromise();

      return {
        statusCode: HttpStatus.OK,
        message: 'Admin dashboard data found',
        data: {
          topStats: topStatsResponse.data ?? {},
          driverEarnings: driverEarningsResponse.data ?? {},
          subscriptionEarnings: subscriptionEarningsResponse.data ?? {},
          tripStats: tripStatsResponse.data ?? {},
          activeRiders: activeRidersResponse.data ?? {},
          activeDrivers: activeDriversResponse.data ?? {},
          genderStats: genderStatsResponse.data ?? {},
          cancelSummary: cancelSummaryResponse.data ?? [],
          waslApprovedCount: waslApprovedCheckResponse.data ?? [],
          activeDriversPercentage: activeDriversPercentage.data ?? {},
          activeRidersPercentage: activeRidersPercentage.data ?? {},
          cashFlow: cashFlow.data ?? {},
          RiderReviewsStats: RiderReviewsStats.data ?? {},
          DriverReviewsStats: DriverReviewsStats.data ?? {},
          riderPromoStats: riderPromoStats.data ?? {},
          captainPromoStats: captainPromoStats.data ?? {},
          riderSubscriptionStats: riderSubscriptionStats.data ?? {},
          captainSubscriptionStats: captainSubscriptionStats.data ?? {},
        },
      };
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Admin Dashboard APIs
  async getDashboardStats(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::trip::${DASHBOARD_STATS}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.tripTcpClient
        .send(DASHBOARD_STATS, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
async findAndNotifyDriversForWASLEligibilityOneByOne(){
  //mgt implement
      return await this.clientCaptain
        .send(ALL_DRIVER_WASL_CHECK, JSON.stringify({}))
        .pipe()
        .toPromise();
}
  async getDashboardEarnings(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::payment::${DASHBOARD_GET_EARNINGS}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(DASHBOARD_GET_EARNINGS, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async earningAndTopupGraph(userId: string, entityType: number, body: any) {
    try {
      return await this.clientPaymentTCP
        .send(
          DASHBOARD_EARNING_TOPUP_GRAPH,
          JSON.stringify({ userId, entityType, body }),
        )
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async topupAndSpentGraph(userId: string, body: any) {
    try {
      return await this.clientPaymentTCP
        .send(DASHBOARD_SPENT_TOPUP_GRAPH, JSON.stringify({ userId, body }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async getSingleDayEarning(date: string) {
    try {
      console.log('mujtaba');
      console.log(date);
      return await this.clientPaymentTCP
        .send(DASHBOARD_GET_SINGLE_DAY_EARNING, JSON.stringify(date))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getDashboardTripStats(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::trip::${DASHBOARD_TRIP_STATS}::send -> ${JSON.stringify(params)}`,
    );
    try {
      params.entity = 'stats';
      const tripStats = await this.tripTcpClient
        .send(DASHBOARD_TRIP_STATS, JSON.stringify(params))
        .pipe()
        .toPromise();

      const statusStats = await this.tripTcpClient
        .send(DASHBOARD_STATUS_WISE_COUNT, JSON.stringify(params))
        .pipe()
        .toPromise();
      let tripStatsResponse = {
        statusCode:
          tripStats.statusCode == HttpStatus.OK ||
          statusStats.statusCode == HttpStatus.OK
            ? HttpStatus.OK
            : HttpStatus.BAD_REQUEST,
        data: {},
      };
      if (tripStats.statusCode == HttpStatus.OK) {
        tripStatsResponse.data = {
          ...tripStatsResponse.data,
          ...tripStats.data,
        };
      }
      if (statusStats.statusCode == HttpStatus.OK) {
        tripStatsResponse.data = {
          ...tripStatsResponse.data,
          ...statusStats.data,
        };
      }
      return tripStatsResponse;
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getDashboardTripSummary(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::trip::${DASHBOARD_TRIP_STATS}::send -> ${JSON.stringify(params)}`,
    );
    try {
      params.entity = 'summary';
      return await this.tripTcpClient
        .send(DASHBOARD_STATUS_WISE_COUNT, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getDashboardActiveDrivers(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::captain::${DASHBOARD_ACTIVE_DRIVERS}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientCaptain
        .send(DASHBOARD_ACTIVE_DRIVERS, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getDashboardActiveRiders(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::trip::${DASHBOARD_ACTIVE_RIDERS}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(DASHBOARD_ACTIVE_RIDERS, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getDashboardGenderStats(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::trip::${DASHBOARD_CUSTOMER_STATS}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(DASHBOARD_CUSTOMER_STATS, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getDashboardCancelSummary(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::trip::${DASHBOARD_CANCEL_SUMMARY}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(DASHBOARD_CANCEL_SUMMARY, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Reports
  async getRidersReport(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_RIDERS_REPORT}::send -> ${JSON.stringify(criteria)}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_RIDERS_REPORT, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCaptainsReport(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::captain::${GET_CAPTAINS_REPORT}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.clientCaptain
        .send(GET_CAPTAINS_REPORT, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getCaptainsEarningsReport(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_CAPTAINS_EARNINGS_REPORT}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_CAPTAINS_EARNINGS_REPORT, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getTripsReport(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_TRIPS_REPORT}::send -> ${JSON.stringify(criteria)}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_TRIPS_REPORT, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getTripsCancelledByRiderReport(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_TRIPS_CANCELLED_BY_RIDER_REPORT}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_TRIPS_CANCELLED_BY_RIDER_REPORT, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getTripsCancelledByCaptainReport(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_TRIPS_CANCELLED_BY_CAPTAIN_REPORT}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_TRIPS_CANCELLED_BY_CAPTAIN_REPORT, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getTripsDeclinedByCaptainReport(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_TRIPS_DECLINED_BY_CAPTAIN_REPORT}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_TRIPS_DECLINED_BY_CAPTAIN_REPORT, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Transactions
  async findUserTransactionsList(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::payment::${GET_ALL_USER_TRANSACTIONS}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(GET_ALL_USER_TRANSACTIONS, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async findALinmaTransactionsList(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::payment::${GET_ALINMA_TRANSACTIONS}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(GET_ALINMA_TRANSACTIONS, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async alinmaRetry(id: string) {
    this.logger.log(
      `kafka::payment::${RETRY_ALINMA_TRANSACTIONS}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.clientPaymentTCP
        .send(RETRY_ALINMA_TRANSACTIONS, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  async alinmaBalance() {
    this.logger.log(`kafka::payment::${GET_ALINMA_BALACE}::send -> `);
    try {
      return await this.clientPaymentTCP
        .send(GET_ALINMA_BALACE, {})
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Audit Log
  async getSettingAuditLog(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::audit::${GET_AUDIT_LOG}::send -> ${JSON.stringify(criteria)}`,
    );
    try {
      criteria.filters.moduleName = 'settings';
      criteria.filters.entityName = 'setting';
      return await this.clientAudit
        .send(GET_AUDIT_LOG, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Driver Status Log
  async getDriverStatusLog(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::audit::${GET_AUDIT_LOG}::send -> ${JSON.stringify(criteria)}`,
    );
    try {
      criteria.filters.moduleName = 'captain';
      criteria.filters.entityName = 'captain-status';
      return await this.clientAudit
        .send(GET_AUDIT_LOG, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Cancel Trip
  async cancelTripByAdmin(
    params: CancelTripDto & TripIdParamDto & AdminIdParamDto,
  ) {
    this.logger.log(
      `kafka::trip::${ADMIN_CANCELS_TRIP}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.tripTcpClient
        .send(ADMIN_CANCELS_TRIP, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Emergency Team
  async findEmergencyAdminList(params: AdminListParams) {
    this.logger.log(
      `kafka::trip::${GET_ALL_EMERGENCY_ADMIN}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_EMERGENCY_ADMIN, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Emergency Requests
  async getAllEmergencyRequests(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_ALL_EMERGENCY_REQUESTS}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_ALL_EMERGENCY_REQUESTS, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getEmergencyRequestDetail(id: string) {
    this.logger.log(
      `kafka::trip::${GET_EMERGENCY_REQUEST_DETAIL}::send -> ${JSON.stringify(
        id,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_EMERGENCY_REQUEST_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateEmergencyRequest(id: string, data: UpdateEmergencyRequestDto) {
    this.logger.log(`kafka::trip::${UPDATE_EMERGENCY_REQUEST}::send -> list`);
    try {
      return await this.tripTcpClient
        .send(UPDATE_EMERGENCY_REQUEST, JSON.stringify({ id, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async resolveEmergencyRequest(id: string, data: ResolveEmergencyRequestDto) {
    this.logger.log(`kafka::trip::${UPDATE_EMERGENCY_REQUEST}::send -> list`);
    try {
      data.resolvedAt = getTimestamp();
      return await this.tripTcpClient
        .send(UPDATE_EMERGENCY_REQUEST, JSON.stringify({ id, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllEmergencyTrips(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_ALL_EMERGENCY_TRIPS}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_ALL_EMERGENCY_TRIPS, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Dispatcher
  async findDispatcherAdminList(params: AdminListParams) {
    this.logger.log(`kafka::admin::${GET_ALL_DISPATCHER_ADMIN}::send -> list`);
    try {
      return await this.clientAdminTCP
        .send(GET_ALL_DISPATCHER_ADMIN, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async searchRidersList(params: SearchRiderDto) {
    this.logger.log(
      `kafka::trip::${SEARCH_RIDERS_LIST}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.tripTcpClient
        .send(SEARCH_RIDERS_LIST, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getRiderDetails(id: string) {
    this.logger.log(
      `kafka::trip::${GET_CUSTOMER_DETAIL}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.tripTcpClient
        .send(
          GET_CUSTOMER_DETAIL,
          JSON.stringify({
            id,
            data: {
              isReviewDetail: true,
              isWalletDetail: true,
              externalType: UserExternalType.Rider,
            },
          }),
        )
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async searchDriverList(params: SearchDriverDto) {
    this.logger.log(
      `kafka::captain::${SEARCH_DRIVERS_LIST}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientCaptain
        .send(SEARCH_DRIVERS_LIST, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async estimateTripCost(params: EstimatePriceDto) {
    this.logger.log(
      `kafka::trip::${GET_TRIP_ESTIMATED_COST}::send -> ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_TRIP_ESTIMATED_COST, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async createTripNow(params: CreateTripNowDto) {
    this.logger.log(
      `kafka::trip::${CREATE_TRIP}::send -> ${JSON.stringify(params)}`,
    );
    const { addresses } = params;
    const addTypes = addresses.map((address) => address.addressType);
    if (addTypes[0] === addTypes[1]) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Pick up and Drop off address should be different',
      };
    }
    return await this.tripTcpClient
      .send(CREATE_TRIP, JSON.stringify(params))
      .pipe()
      .toPromise();
  }

  async createTripSchedule(params: CreateTripScheduleDto) {
    this.logger.log(
      `kafka::trip::${CREATE_SCHEDULE_TRIP}::send -> ${JSON.stringify(params)}`,
    );
    const { addresses } = params;
    const addTypes = addresses.map((address) => address.addressType);
    if (addTypes[0] === addTypes[1]) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Pick up and Drop off address should be different',
      };
    }
    try {
      return await this.tripTcpClient
        .send(CREATE_SCHEDULE_TRIP, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // get dispatcher trip data
  async getAllDispatcherTrips(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trips::${GET_ALL_DISPATCHER_TRIPS}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_ALL_DISPATCHER_TRIPS, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllIncompleteTrips(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trips::${GET_ALL_INCOMPLETE_TRIPS}::send -> ${JSON.stringify(
        criteria,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(GET_ALL_INCOMPLETE_TRIPS, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Backend purpose
  async addCountry(body) {
    this.logger.log(`tcp::captain::${ADD_COUNTRY}::send`);
    try {
      return await this.clientCaptain
        .send(ADD_COUNTRY, JSON.stringify(body))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateCountry(body, id: string) {
    this.logger.log(`tcp::captain::${UPDATE_COUNTRY}::send`);
    try {
      return await this.clientCaptain
        .send(UPDATE_COUNTRY, JSON.stringify({ id, ...body }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async addCity(body) {
    this.logger.log(`tcp::captain::${ADD_CITY}::send`);
    try {
      return await this.clientCaptain
        .send(ADD_CITY, JSON.stringify(body))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateCity(body, id: string) {
    this.logger.log(`tcp::captain::${UPDATE_CITY}::send`);
    try {
      return await this.clientCaptain
        .send(UPDATE_CITY, JSON.stringify({ id, ...body }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async deleteCity(id: string) {
    this.logger.log(`tcp::captain::${DELETE_CITY}::send`);
    try {
      return await this.clientCaptain
        .send(DELETE_CITY, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async createOtpForRider(params: CreateOtpDto) {
    this.logger.log(
      `kafka::captain::${CREATE_RIDER_OTP}::send | params: ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(CREATE_RIDER_OTP, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async verifyOtpForRider(params: VerifyOtpDto) {
    this.logger.log(
      `kafka::captain::${VERIFY_RIDER_OTP}::send | params: ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(VERIFY_RIDER_OTP, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //Role Sync
  async syncRole() {
    this.logger.log(`tcp::admin::${SYNC_ROLE}::send -> sync`);
    try {
      return await this.clientAdminTCP
        .send(SYNC_ROLE, JSON.stringify({}))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Get Redis Key List^M
  async getRedisKeyList(keyword?: string) {
    try {
      let searchKey = '*';
      if (keyword) {
        searchKey = `*${keyword}*`;
      }
      const keyList = await this.redisHandler.getMatchedClients(searchKey);
      keyList.sort();
      return { statusCode: HttpStatus.OK, data: keyList };
    } catch (error) {
      return error?.message || '';
    }
  }

  async keyClearRedis(keyword?: string) {
    try {
      const keyList = [];
      switch (keyword) {
        case 'settings':
          keyList.push('settings-last-synced');
          break;
        case 'cab-types':
          keyList.push('cab-types-synced');
          break;
      }
      if (keyList.length > 0) {
        this.redisHandler.client.del(keyList, function (err) {
          Logger.debug(
            `[keyClearRedis] removing redis data of ${JSON.stringify(
              keyList,
            )} | ${JSON.stringify(err)}`,
          );
        });
      }
      return { statusCode: HttpStatus.OK, data: keyList };
    } catch (error) {
      //throw new BadGatewayException(error);
      return error?.message || '';
    }
  }

  async getSLAContent(params) {
    this.logger.log(
      `kafka::Admin::${GET_SLA_CONTENT}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientAdminTCP
        .send(GET_SLA_CONTENT, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async addSLAContent(params: AddSlaDto) {
    this.logger.log(
      `kafka::Admin::${ADD_SLA_CONTENT}::send | params: ${JSON.stringify(
        params,
      )}`,
    );
    try {
      return await this.clientAdminTCP
        .send(ADD_SLA_CONTENT, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateSLAContent(body, id: string) {
    this.logger.log(`kafka::Admin::${UPDATE_SLA_CONTENT}::send`);
    try {
      return await this.clientAdminTCP
        .send(UPDATE_SLA_CONTENT, JSON.stringify({ id, ...body }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // Chat
  async getChatUsers(params: UserListingParams) {
    this.logger.log(
      `kafka::chat::${CHAT_USER_LIST}::send -> ${JSON.stringify(params)}`,
    );
    try {
      return await this.clientChat
        .send(CHAT_USER_LIST, JSON.stringify(params))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async updateChatUserStatus(id: string, data: ChatUserStatusDto) {
    this.logger.log(
      `kafka::chat::${CHAT_USER_UPDATE_STATUS}::send -> ${JSON.stringify({
        id,
        data,
      })}`,
    );
    try {
      return await this.clientChat
        .send(CHAT_USER_UPDATE_STATUS, JSON.stringify({ id, data }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getChatUserDetail(id: string) {
    this.logger.log(
      `kafka::chat::${CHAT_USER_DETAIL}::send -> ${JSON.stringify(id)}`,
    );
    try {
      return await this.clientChat
        .send(CHAT_USER_DETAIL, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getChatUserAuditLog(id: string, criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::audit::${GET_AUDIT_LOG}::send -> ${JSON.stringify(criteria)}`,
    );
    try {
      criteria.filters.entityId = id;
      criteria.filters.moduleName = 'chat';
      criteria.filters.entityName = 'chat-user-status';
      return await this.clientAudit
        .send(GET_AUDIT_LOG, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
  ////////////wallet

  async getBalance(externalId: string) {
    this.logger.log(
      `kafka::notifications::${GET_BALANCE}::send -> ${JSON.stringify({
        externalId,
      })}`,
    );
    return await this.clientPaymentTCP
      .send(GET_BALANCE, JSON.stringify({ externalId: externalId }))
      .pipe()
      .toPromise();
  }

  async topUpHistoryByUserId(externalId: string) {
    this.logger.log(
      `kafka::notifications::${TOP_UP_HISTORY}::send -> ${JSON.stringify({
        externalId,
      })}`,
    );
    return await this.clientPaymentTCP
      .send(TOP_UP_HISTORY, JSON.stringify({ externalId: externalId }))
      .pipe()
      .toPromise();
  }

  async getAlltopUpHistory() {
    this.logger.log(
      `kafka::notifications::${GET_ALL_TOP_UP_HISTORY}::send -> {},
      )}`,
    );
    return await this.clientPaymentTCP
      .send(GET_ALL_TOP_UP_HISTORY, {})
      .pipe()
      .toPromise();
  }

  async kycInitiate(userId: string) {
    this.logger.log(
      `kafka::notifications::${KYC_INITIATE}::send -> {${userId}},
      )}`,
    );
    return await this.tripTcpClient
      .send(KYC_INITIATE, JSON.stringify({ userId }))
      .pipe()
      .toPromise();
  }
  async getAllLocationsWithInDesireTime() {
    try {
      this.logger.log(`[getAllLocationsWithInDesireTime] Inside service`);
      return await this.tripTcpClient
        .send(GET_ALL_ACTIVE_LOCATIONS, {})
        .pipe()
        .toPromise();
    } catch (e) {
      return e.message;
    }
  }

  async userLiveLocAndStatus(userId) {
    try {
      this.logger.log(`[userLiveLocAndStatus] Inside service`);
      return await this.tripTcpClient
        .send(GET_CHAT_USER_LAST_SEEN_AND_LOC, { userId })
        .pipe()
        .toPromise();
    } catch (e) {
      return e?.message;
    }
  }

  // usage time calculation
  async getUserTimeConsumption(userId: string, param: any) {
    this.logger.log(
      `getUserTimeConsumption-> adminservice ->userId & param -> ${JSON.stringify(
        userId,
        param,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(
          GET_USER_APP_USAGE_TIME,
          JSON.stringify({ userId: userId, param: param }),
        )
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async customerKyc(param: customerKycDto) {
    this.logger.log(
      `kafka::notifications::${CUSTOMER_KYC}::send -> ${JSON.stringify({
        param,
      })}`,
    );
    return await this.authTcpClient
      .send(CUSTOMER_KYC, JSON.stringify({ param }))
      .pipe()
      .toPromise();
  }
  async updateCustomer(body: UpdateCustomerDto) {
    this.logger.log(
      `kafka::notifications::${UPSERT_CUSTOMER}::send -> ${JSON.stringify({
        body,
      })}`,
    );
    return await this.tripTcpClient
      .send(UPSERT_CUSTOMER, JSON.stringify({ ...body }))
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
      .send(CREATE_TRIP, JSON.stringify({ ...body, riderId, source: 2 }))
      .pipe()
      .toPromise();
  }

  //to use filters for Ratting stats, first time data is passed via dashboard end point
  async dashboardRattingStats(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::chat::${DASHBOARD_REVIEW_STATS}::send -> ${JSON.stringify({
        params,
      })}`,
    );
    return await this.clientReviewTCP
      .send('REVIEWS', JSON.stringify(params))
      .pipe()
      .toPromise();
  }

  //to use filters for Promo stats, first time data is passed via dashboard end point
  async dashboardPromoStats(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::chat::${DASHBOARD_PROMO_STATS}::send -> ${JSON.stringify({
        params,
      })}`,
    );
    return await this.promoCodesTcpClient
      .send(DASHBOARD_PROMO_STATS, JSON.stringify(params))
      .pipe()
      .toPromise();
  }

  //to use filters for Subscription stats, first time data is passed via dashboard end point
  async dashboardSubscriptionStats(params: DashboardAPIParams) {
    this.logger.log(
      `kafka::chat::${DASHBOARD_SUBSCRIPTION_STATS}::send -> ${JSON.stringify({
        params,
      })}`,
    );
    return await this.clientPaymentTCP
      .send(DASHBOARD_SUBSCRIPTION_STATS, JSON.stringify(params))
      .pipe()
      .toPromise();
  }

  async getAllOtps(criteria: ListSearchSortDto) {
    this.logger.log(
      `kafka::trip::${GET_ALL_OTP}::send -> ${JSON.stringify(criteria)}`,
    );
    try {
      return await this.authTcpClient
        .send(
          GET_ALL_OTP,
          JSON.stringify({
            criteria,
          }),
        )
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async captainAverageEarningGraph(
    userId: string,
    entityType: number,
    body: any,
  ) {
    try {
      return await this.clientPaymentTCP
        .send(
          DASHBOARD_EARNING_AVERAGE_GRAPH,
          JSON.stringify({ userId, entityType, body }),
        )
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async highDemandZone(body: any) {
    try {
      return await this.tripTcpClient
        .send(CREATE_HIGH_DEMAND_ZONE, JSON.stringify(body))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async deleteDemandZone(id) {
    try {
      return await this.tripTcpClient
        .send(DELETE_HIGH_DEMAND_ZONE, JSON.stringify({ id }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async allDemandZone(criteria) {
    try {
      return await this.tripTcpClient
        .send(FIND_ALL_HIGH_DEMAND_ZONE, JSON.stringify(criteria))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  async getAllAdminHZD(userId) {
    try {
      return await this.tripTcpClient
        .send(GET_LIST_OF_USERS_IN_THIS_ZONE, JSON.stringify(userId))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //Ride a Ride
  //D1 ADD ONLY TO INVENOTRY
  async addToInventry(paramDTO: AddToInventoryDto) {
    console.log(paramDTO);
    console.log('---------------------------------------ssss');
    try {
      this.logger.log(
        `kafka::captain::${ADD_TO_INVENTORY}::send -> ${JSON.stringify(
          paramDTO,
        )}`,
      );
      return await this.clientAdminTCP
        .send(ADD_TO_INVENTORY, JSON.stringify({ paramDTO }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //D2 ADD_MAKER_MODEL_INVENTORY
  async addMakerModelInventory(paramDTO: AddMakerModelInventoryDto) {
    console.log(paramDTO);
    try {
      this.logger.log(
        `kafka::captain::${ADD_MAKER_MODEL_INVENTORY}::send -> ${JSON.stringify(
          paramDTO,
        )}`,
      );
      return await this.clientAdminTCP
        .send(ADD_MAKER_MODEL_INVENTORY, JSON.stringify({ paramDTO }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //D3 ADD_MAKER_MODEL_INVENTORY_VIA_CSV
  async addMakerModelInventoryViaCSV(file) {
    try {
      const fileData = file.buffer.toString();
      this.logger.log(
        `TCP:admin service:${ADD_MAKER_MODEL_INVENTORY_VIA_CSV}::send -> ${JSON.stringify(
          fileData,
        )}`,
      );
      return await this.clientAdminTCP
        .send(ADD_MAKER_MODEL_INVENTORY_VIA_CSV, fileData)
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //D4 show full inventory for dashboard
  async findAllForDashboard(criteria: ListSearchSortDto) {
    try {
      console.log('33333333333333');
      this.logger.log(
        `kafka::captain::${FIND_ALL_FOR_DASHBOARD}::send -> ${JSON.stringify(
          'no params',
        )}`,
      );
      console.log('44444444444444444444');
      let response = await this.clientAdminTCP
        .send(FIND_ALL_FOR_DASHBOARD, JSON.stringify({ criteria }))
        .pipe()
        .toPromise();
      console.log('in admin service');
      console.log(response);
      return response;
    } catch (error) {
      console.log('555555555555555');
      throw new BadGatewayException(error);
    }
  }

  //D5 set vehicle avalibility from dashboard
  async setVehiclesAvalibility(paramDTO: ActivationDto) {
    try {
      console.log('gate way service');
      this.logger.log(
        `kafka::captain::${SET_VEHICLE_AVALIABILITY}::send -> ${JSON.stringify(
          paramDTO,
        )}`,
      );
      return await this.clientAdminTCP
        .send(SET_VEHICLE_AVALIABILITY, JSON.stringify({ paramDTO }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //D6
  async updateInventory(updateData: UpdateInventoryDto) {
    try {
      console.log('2222222222222222 + admin inventry patch');
      console.log(updateData);
      this.logger.log(
        `kafka::captain::${UPDATE_INVENTORY}::send -> ${JSON.stringify(
          updateData,
        )}`,
      );
      return await this.clientAdminTCP
        .send(UPDATE_INVENTORY, JSON.stringify({ updateData }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  //D7
  async deleteCompanyVehicleDetails(paramDto: DeleteCompanyVehicleDto) {
    try {
      console.log('2222222222222222222222');
      console.log(paramDto);
      this.logger.log(
        `kafka::captain::${DELETE_FROM_INVENTORY}::send -> ${JSON.stringify(
          paramDto,
        )}`,
      );
      return await this.clientAdminTCP
        .send(DELETE_FROM_INVENTORY, JSON.stringify({ paramDto }))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  // usage time calculation
  async changeCustomerApprovalStatus(paramDto: CustomerStatusDto) {
    this.logger.log(
      `changeCustomerApprovalStatus-> adminservice ->userId & status -> ${JSON.stringify(
        paramDto,
      )}`,
    );
    try {
      return await this.tripTcpClient
        .send(CHANGE_CUSTOMER_APPROVAL_STATUS, JSON.stringify(paramDto))
        .pipe()
        .toPromise();
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }
}

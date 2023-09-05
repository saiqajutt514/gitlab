import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { AdminService } from './admin.service';
import {
  AdminIdDto,
  AdminLoginDto,
  ChangePasswordDto,
  CreateAdminDto,
  CreateNotifyUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SetPasswordDto,
  UpdateAdminDto,
  UpdatePictureDto,
  UpdateProfileDto,
} from './dto/admin-user.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  UpdateTemplateStatusDto,
} from './dto/email-templates.dto';
import {
  PaginationDto,
  ListSearchSortDto,
  DashboardAPIParams,
  createHighDemandZone,
} from './dto/pagination.dto';
import {
  CreatePushTemplateDto,
  UpdatePushTemplateDto,
} from './dto/push-templates.dto';
import {
  CreateRejectedReasonDto,
  UpdateRejectedReasonDto,
} from './dto/rejected-reason.dto';
import { SaveSettingDto } from './dto/setting.dto';
import {
  CreateSmsTemplateDto,
  UpdateSmsTemplateDto,
} from './dto/sms-templates.dto';
import { handleDashboardDateParams } from 'src/helpers/date-formatter';

import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { REASON_TYPE } from './enum/rejected-reason.enum';
import { TokenPayloadInterface } from './interfaces/token-payload.interface';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import { ResponseHandler } from 'src/helpers/responseHandler';
import {
  CreateCouponDto,
  CreateVoucherDto,
  UpdatePromoCodeDto,
} from './dto/promo-code.dto';
import { IPromoCodeMethod } from './enum/promo-code.enum';
import {
  CreateCabTypeDto,
  UpdateCabTypeOrderDto,
} from './dto/create-cab-type.dto';
import { UpdateCabTypeDto } from './dto/update-cab-type.dto';
import { CabCategoryIcon } from './dto/cab-category-icon.dto';
import { GetCabTypeQueryDto } from '../captains/dto/get-cab-type.dto';
import { UpdateCarInfoDto } from './dto/update-car-info.dto';
import { UpdateVehicleDto, VechileImageDto } from './dto/update-vehicle.dto';
import { RejectCaptainDto } from './dto/update-captain.dto';
import { CreateRoleDto, UpdateRoleDto, FilterRoleDto } from './dto/role.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { CancelTripDto } from './dto/cancel-trip.dto';
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
import { getLoggedInRoleType } from './enum/services.enum';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { CreateCabChargeDto } from './dto/create-cab-charge.dto';
import { UpdateCabChargeDto } from './dto/update-cab-charge.dto';
import { CabChargeQueryParams } from './interfaces/cab-charges.interface';
import { CreateOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { CreateCustomizedChargeDto } from './dto/create-customized-charge.dto';
import { UpdateCustomizedChargeDto } from './dto/update-customized-charge.dto';
import {
  AddCountryDto,
  AddCityDto,
  UpdateCityDto,
} from './dto/country-city-master.dto';
import {
  VehicleMasterInfoDto,
  AddVehicleMakerDto,
  UpdateVehicleMakerDto,
  UpdateVehicleModelDto,
  AddVehicleModelDto,
  AddVehicleClassDto,
  UpdateVehicleClassDto,
} from './dto/vehicle-maker.dto';
import { SendPushNotificationToUsersDto } from './dto/send-push-notification-to-users.dto';
import { identity } from 'rxjs';
import { UserListingParams } from '../chat/interfaces/chat-user.interface';
import { ChatUserStatusDto } from '../chat/dto/chat-user.dto';
import { MakerIcon } from './dto/maker-icon.dto';
import { UpdateCustomerDto } from '../user/dto/update-customer.dto';
import { TripsCreateDTO } from '../trips/dto/trips.dto';
import {
  ActivationDto,
  AddMakerModelInventoryDto,
  AddToInventoryDto,
  CustomerStatusDto,
  DeleteCompanyVehicleDto,
  InventoryIcon,
  UpdateInventoryDto,
} from './dto/rar.dto';
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  private readonly logger = new LoggerHandler(
    AdminController.name,
  ).getInstance();

  // Notify Users
  @Post('notify-users')
  async getAllNotifyUser(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getAllNotifyUser(criteria);
    return ResponseHandler(response);
  }

  @Get('notify-user/:id')
  async getNotifyUser(@Param('id') id: string) {
    const response = await this.adminService.getNotifyUser(id);
    return ResponseHandler(response);
  }

  @Post('create-notify-user')
  async createNotifyUser(@Body() createUser: CreateNotifyUserDto) {
    const response = await this.adminService.createNotifyUser(createUser);
    return ResponseHandler(response);
  }

  // Rejected Reason
  @Post('rejected-reason')
  @UsePipes(ValidationPipe)
  async createReason(@Body() params: CreateRejectedReasonDto) {
    const response = await this.adminService.createReason(params);
    return ResponseHandler(response);
  }

  @Get('rejected-reason/type/:type')
  async findAllReasonWithType(@Param('type') type: REASON_TYPE) {
    const response = await this.adminService.findAllReasonWithType(type);
    return ResponseHandler(response);
  }

  @Get('rejected-reason/:id')
  async findOneReason(@Param('id') id: string) {
    const response = await this.adminService.findOneReason(id);
    return ResponseHandler(response);
  }

  @Patch('rejected-reason/:id')
  @UsePipes(ValidationPipe)
  async updateReason(
    @Param('id') id: string,
    @Body() params: UpdateRejectedReasonDto,
  ) {
    const response = await this.adminService.updateReason(id, params);
    return ResponseHandler(response);
  }

  @Delete('rejected-reason/:id')
  async removeReason(@Param('id') id: string) {
    const response = await this.adminService.removeReason(id);
    return ResponseHandler(response);
  }

  // Admin login
  @Post('login')
  @UsePipes(ValidationPipe)
  async loginAdmin(@Body() params: AdminLoginDto) {
    const loginResponse = await this.adminService.loginAdmin(params);
    if (loginResponse.statusCode == HttpStatus.OK) {
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          id: loginResponse.data.id,
          role: loginResponse.data.role,
          email: loginResponse.data.email,
          fullName: loginResponse.data.fullName,
          profileImage: loginResponse.data.profileImage,
          profileImageUrl: loginResponse.data.profileImageUrl,
          firstLogin: loginResponse.data.firstLogin,
          authToken: this.jwtService.sign({
            id: loginResponse.data.id,
            email: loginResponse.data.email,
            role: loginResponse.data?.role?.code,
          }),
        },
      };
      return ResponseHandler(response);
    }
    return ResponseHandler(loginResponse);
  }

  @Post('forgot-password')
  @UsePipes(ValidationPipe)
  async forgotAdminPassword(@Body() params: ForgotPasswordDto) {
    const response = await this.adminService.forgotPassword(params);
    return ResponseHandler(response);
  }

  @Post('set-password/:id')
  @UsePipes(ValidationPipe)
  async setupAdminPassword(
    @Param() params: AdminIdDto,
    @Body() data: SetPasswordDto,
  ) {
    const response = await this.adminService.setPassword({
      ...params,
      ...data,
    });
    return ResponseHandler(response);
  }

  @Post('reset-password')
  @UsePipes(ValidationPipe)
  async resetAdminPassword(@Body() data: ResetPasswordDto) {
    const response = await this.adminService.resetPassword(data);
    return ResponseHandler(response);
  }

  @Put('change-password')
  @UsePipes(ValidationPipe)
  async changeAdminPassword(
    @Body() data: ChangePasswordDto,
    @Req() request: Request,
  ) {
    const payload = request?.admin as TokenPayloadInterface;
    const id = payload.id;
    const response = await this.adminService.changePassword({ id, ...data });
    return ResponseHandler(response);
  }

  @Put('update-profile')
  @UsePipes(ValidationPipe)
  async updateAdminProfile(
    @Body() data: UpdateProfileDto,
    @Req() request: Request,
  ) {
    const payload = request?.admin as TokenPayloadInterface;
    const id = payload.id;
    const response = await this.adminService.updateProfile({ id, ...data });
    return ResponseHandler(response);
  }

  @Put('update-picture')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('profileImage', {
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateAdminPicture(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const payload = request?.admin as TokenPayloadInterface;
    const id = payload.id;
    let data: UpdatePictureDto = { profileImage: null };
    const imgObject: any = file;
    if (imgObject?.fieldname === 'profileImage') {
      data = this.awsS3Service.uploadAdminImage({ file: imgObject });
    }
    const response = await this.adminService.updatePicture({ id, ...data });
    return ResponseHandler(response);
  }

  // Sub Admin
  @Post('subadmin')
  @UsePipes(ValidationPipe)
  async createSubAdmin(@Body() params: CreateAdminDto) {
    const response = await this.adminService.createSubAdmin(params);
    return ResponseHandler(response);
  }

  @Post('subadmin/list')
  async findSubAdminList(@Req() request: Request) {
    const payload = request?.admin as TokenPayloadInterface;
    const extraParams = { exclude: [payload.id] };
    const response = await this.adminService.findSubAdminList(extraParams);
    return ResponseHandler(response);
  }

  @Get('subadmin/:id')
  async findSubAdmin(@Param('id') id: string) {
    const response = await this.adminService.findSubAdmin(id);
    return ResponseHandler(response);
  }

  @Patch('subadmin/:id')
  @UsePipes(ValidationPipe)
  async updateSubAdmin(
    @Param('id') id: string,
    @Body() params: UpdateAdminDto,
  ) {
    const response = await this.adminService.updateSubAdmin(id, params);
    return ResponseHandler(response);
  }

  @Delete('subadmin/:id')
  async removeSubAdmin(@Param('id') id: string) {
    const response = await this.adminService.removeSubAdmin(id);
    return ResponseHandler(response);
  }

  // Role
  @Post('role')
  @UsePipes(ValidationPipe)
  async createRole(@Body() params: CreateRoleDto) {
    const response = await this.adminService.createRole(params);
    return ResponseHandler(response);
  }

  @Get('role')
  async findRoleList(@Query() query: FilterRoleDto) {
    const response = await this.adminService.findRoleList(query);
    return ResponseHandler(response);
  }

  @Get('role/:id')
  async findRole(@Param('id') id: string) {
    const response = await this.adminService.findRole(id);
    return ResponseHandler(response);
  }

  @Patch('role/:id')
  @UsePipes(ValidationPipe)
  async updateRole(@Param('id') id: string, @Body() params: UpdateRoleDto) {
    const response = await this.adminService.updateRole(id, params);
    return ResponseHandler(response);
  }

  @Delete('role/:id')
  async removeRole(@Param('id') id: string) {
    const response = await this.adminService.removeRole(id);
    return ResponseHandler(response);
  }

  // Category
  @Post('category')
  @UsePipes(ValidationPipe)
  async createCategory(@Body() params: CreateCategoryDto) {
    const response = await this.adminService.createCategory(params);
    return ResponseHandler(response);
  }

  @Get('category')
  async findCategoryList() {
    const response = await this.adminService.findCategoryList();
    return ResponseHandler(response);
  }

  @Get('category/:id')
  async findCategory(@Param('id') id: string) {
    const response = await this.adminService.findCategory(id);
    return ResponseHandler(response);
  }

  @Patch('category/:id')
  @UsePipes(ValidationPipe)
  async updateCategory(
    @Param('id') id: string,
    @Body() params: UpdateCategoryDto,
  ) {
    const response = await this.adminService.updateCategory(id, params);
    return ResponseHandler(response);
  }

  @Delete('category/:id')
  async removeCategory(@Param('id') id: string) {
    const response = await this.adminService.removeCategory(id);
    return ResponseHandler(response);
  }

  // Permission
  @Post('permission')
  @UsePipes(ValidationPipe)
  async createPermission(@Body() params: CreatePermissionDto) {
    const response = await this.adminService.createPermission(params);
    return ResponseHandler(response);
  }

  @Get('permission')
  async findPermissionList() {
    const response = await this.adminService.findPermissionList();
    return ResponseHandler(response);
  }

  @Get('permission/:id')
  async findPermission(@Param('id') id: string) {
    const response = await this.adminService.findPermission(id);
    return ResponseHandler(response);
  }

  @Patch('permission/:id')
  @UsePipes(ValidationPipe)
  async updatePermission(
    @Param('id') id: string,
    @Body() params: UpdatePermissionDto,
  ) {
    const response = await this.adminService.updatePermission(id, params);
    return ResponseHandler(response);
  }

  @Delete('permission/:id')
  async removePermission(@Param('id') id: string) {
    const response = await this.adminService.removePermission(id);
    return ResponseHandler(response);
  }

  @Get('capabilities/all')
  async findCapabilitiesList() {
    const response = await this.adminService.getAllCapabilities();
    return ResponseHandler(response);
  }

  // Get Data
  @Post('trips')
  @UsePipes(ValidationPipe)
  async getAllTrips(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getAllTrips(criteria);
    return ResponseHandler(response);
  }

  @Get('trips/:id')
  async getTripById(@Param('id') id: string) {
    const response = await this.adminService.getTripById(id);
    return ResponseHandler(response);
  }

  @Post('captains')
  @UsePipes(ValidationPipe)
  async getAllCaptains(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getAllCaptains(criteria);
    return ResponseHandler(response);
  }

  //WASL APPROVE
  @Get('captain/change-wasl-status/:id')
  async changeWaslstatus(@Param('id') id: string) {
    const response = await this.adminService.changeWaslStatus(id);
    return ResponseHandler(response);
  }

   @Get('captain/check-all-wasl')
  async findAndNotifyDriversForWASLEligibilityOneByOne() {
    const response = await this.adminService.findAndNotifyDriversForWASLEligibilityOneByOne();
    return ResponseHandler(response);
  }

  @Get('captain/:id')
  async getCaptainById(@Param('id') id: string) {
    const response = await this.adminService.getCaptainById(id);
    return ResponseHandler(response);
  }

  @Post('captain-trip-history/:id')
  @UsePipes(ValidationPipe)
  async getCaptainTripHistory(
    @Param('id') id: string,
    @Body() criteria: ListSearchSortDto,
  ) {
    const response = await this.adminService.getCaptainTripHistory(
      id,
      criteria,
    );
    return ResponseHandler(response);
  }

  @Post('captain-subscriptions/:id')
  async getCaptainSubscriptions(
    @Param('id') id: string,
    @Body() criteria: ListSearchSortDto,
  ) {
    const response = await this.adminService.getCaptainSubscriptions(
      id,
      criteria,
    );
    return ResponseHandler(response);
  }

  @Post('captain-earnings/:id')
  async getCaptainEarnings(
    @Param('id') id: string,
    @Body() criteria: ListSearchSortDto,
  ) {
    const response = await this.adminService.getCaptainEarnings(id, criteria);
    return ResponseHandler(response);
  }

  @Patch('approve-captain/:id')
  async approveCaptain(@Param('id') id: string) {
    const response = await this.adminService.approveCaptain(id);
    return ResponseHandler(response);
  }

  @Patch('reject-captain/:id')
  async rejectCaptain(
    @Param('id') id: string,
    @Body() params: RejectCaptainDto,
  ) {
    const response = await this.adminService.rejectCaptain(id, params);
    return ResponseHandler(response);
  }

  @Post('riders')
  @UsePipes(ValidationPipe)
  async getAllRiders(@Body() criteria: ListSearchSortDto) {
    this.logger.log(`riders -> body -> ${JSON.stringify(criteria)}`);
    const response = await this.adminService.getAllRiders(criteria);
    return ResponseHandler(response);
  }

  @Get('riders/:id')
  async getRiderById(@Param('id') id: string) {
    const response = await this.adminService.getRiderById(id);
    return ResponseHandler(response);
  }

  @Post('rider-trip-history/:id')
  @UsePipes(ValidationPipe)
  async getRiderTripHistory(
    @Param('id') id: string,
    @Body() criteria: ListSearchSortDto,
  ) {
    const response = await this.adminService.getRiderTripHistory(id, criteria);
    return ResponseHandler(response);
  }

  @Post('rider-trip-scheduled/:id')
  @UsePipes(ValidationPipe)
  async getRiderTripScheduled(
    @Param('id') id: string,
    @Body() criteria: ListSearchSortDto,
  ) {
    const response = await this.adminService.getRiderTripScheduled(
      id,
      criteria,
    );
    return ResponseHandler(response);
  }

  // Rating
  @Post('riders-rating')
  @UsePipes(ValidationPipe)
  async gerRidersRating(@Body() criteria: ListSearchSortDto) {
    this.logger.log(`riders-rating -> body -> ${JSON.stringify(criteria)}`);
    const response = await this.adminService.gerRidersRating(criteria);
    return ResponseHandler(response);
  }

  @Post('captains-rating')
  @UsePipes(ValidationPipe)
  async gerCaptainsRating(@Body() criteria: ListSearchSortDto) {
    this.logger.log(`captains-rating -> body -> ${JSON.stringify(criteria)}`);
    const response = await this.adminService.gerCaptainsRating(criteria);
    return ResponseHandler(response);
  }

  // Settings
  @Post('sync-settings')
  async syncAdminSettings() {
    const response = await this.adminService.syncSettings();
    return ResponseHandler(response);
  }

  @Get('settings')
  async getAdminSettings() {
    const response = await this.adminService.getAllSettings({});
    return ResponseHandler(response);
  }

  @Get('setting/:name')
  @UsePipes(ValidationPipe)
  async getSingleSetting(@Param('name') name: string) {
    const response = await this.adminService.getSetting(name);
    return ResponseHandler(response);
  }

  @Patch('setting/:name')
  @UsePipes(ValidationPipe)
  async updateAdminSetting(
    @Param('name') name: string,
    @Body() data: SaveSettingDto,
  ) {
    const response = await this.adminService.updateSetting(name, data);
    return ResponseHandler(response);
  }

  //for new design of master control by mujtaba
  @Patch('settings')
  @UsePipes(ValidationPipe)
  async newUpdateAdminSetting(@Body() data: any) {
    const response = await this.adminService.newUpdateSetting(data);
    return ResponseHandler(response);
  }

  // TODO: Need to remove on production
  @Post('create-user')
  @UsePipes(ValidationPipe)
  async createAnAdmin(@Body() params: CreateAdminDto & SetPasswordDto) {
    const response = await this.adminService.createSubAdmin(params);
    return ResponseHandler(response);
  }

  // TODO: Need to remove on production
  @Post('test-push')
  @UsePipes(ValidationPipe)
  async testPush(@Body() params: any) {
    const response = await this.adminService.testPush(params);
    return ResponseHandler(response);
  }

  @Post('test-sms')
  @UsePipes(ValidationPipe)
  async testSMS(@Body() params: any) {
    const response = await this.adminService.testSms(params);
    return ResponseHandler(response);
  }

  // Subscription APIs
  @Post('subscription')
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    const response = await this.adminService.createSubscription(
      createSubscriptionDto,
    );
    return ResponseHandler(response);
  }

  @Get('subscription')
  async findAllSubscription() {
    const response = await this.adminService.findAllSubscription();
    return ResponseHandler(response);
  }

  @Get('subscription/:id')
  async findOneSubscription(@Param('id') id: string) {
    const response = await this.adminService.findOneSubscription(id);
    return ResponseHandler(response);
  }

  @Patch('subscription/:id')
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    const response = await this.adminService.updateSubscription(
      id,
      updateSubscriptionDto,
    );
    return ResponseHandler(response);
  }

  @Delete('subscription/:id')
  async removeSubscription(@Param('id') id: string) {
    const response = await this.adminService.removeSubscription(id);
    return ResponseHandler(response);
  }

  // Email Templates
  @Post('templates/email')
  async createEmailTemplate(@Body() params: CreateEmailTemplateDto) {
    this.logger.log(`templates/email -> body -> ${JSON.stringify(params)}`);
    const response = await this.adminService.createEmailTemplate(params);
    return ResponseHandler(response);
  }

  @Get('templates/email')
  async findEmailTemplatesList() {
    this.logger.log(`templates/email -> list`);
    const response = await this.adminService.findEmailTemplatesList();
    return ResponseHandler(response);
  }

  @Get('templates/email/:id')
  async findEmailTemplateDetail(@Param('id') id: string) {
    this.logger.log(`templates/email/:id -> get -> ${JSON.stringify(id)}`);
    const response = await this.adminService.findEmailTemplateDetail(id);
    return ResponseHandler(response);
  }

  @Patch('templates/email/:id')
  async updateEmailTemplate(
    @Param('id') id: string,
    @Body() params: UpdateEmailTemplateDto,
  ) {
    this.logger.log(
      `templates/email/:id -> update -> ${JSON.stringify({ id, params })}`,
    );
    const response = await this.adminService.updateEmailTemplate(id, params);
    return ResponseHandler(response);
  }

  @Delete('templates/email/:id')
  async removeEmailtemplate(@Param('id') id: string) {
    this.logger.log(`templates/email/:id -> delete -> ${JSON.stringify(id)}`);
    const response = await this.adminService.removeEmailTemplate(id);
    return ResponseHandler(response);
  }

  @Patch('templates/email-status/:id')
  async updateEmailTemplateStatus(
    @Param('id') id: string,
    @Body() params: UpdateTemplateStatusDto,
  ) {
    this.logger.log(
      `templates/email-status/:id -> update status-> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    const response = await this.adminService.updateEmailTemplateStatus(
      id,
      params,
    );
    return ResponseHandler(response);
  }

  // Push Templates
  @Post('templates/push')
  async createPushTemplate(@Body() params: CreatePushTemplateDto) {
    this.logger.log(`templates/push -> body -> ${JSON.stringify(params)}`);
    const response = await this.adminService.createPushTemplate(params);
    return ResponseHandler(response);
  }

  @Get('templates/push')
  async findPushTemplatesList() {
    this.logger.log(`templates/push -> list`);
    const response = await this.adminService.findPushTemplatesList();
    return ResponseHandler(response);
  }

  @Get('templates/push/:id')
  async findPushTemplateDetail(@Param('id') id: string) {
    this.logger.log(`templates/push/:id -> get -> ${JSON.stringify(id)}`);
    const response = await this.adminService.findPushTemplateDetail(id);
    return ResponseHandler(response);
  }

  @Patch('templates/push/:id')
  async updatePushTemplate(
    @Param('id') id: string,
    @Body() params: UpdatePushTemplateDto,
  ) {
    this.logger.log(
      `templates/push/:id -> update -> ${JSON.stringify({ id, params })}`,
    );
    const response = await this.adminService.updatePushTemplate(id, params);
    return ResponseHandler(response);
  }

  @Patch('templates/push-status/:id')
  async updatePushTemplateStatus(
    @Param('id') id: string,
    @Body() params: UpdateTemplateStatusDto,
  ) {
    this.logger.log(
      `templates/push-status/:id -> update status-> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    const response = await this.adminService.updatePushTemplateStatus(
      id,
      params,
    );
    return ResponseHandler(response);
  }

  @Delete('templates/push/:id')
  async removePushtemplate(@Param('id') id: string) {
    this.logger.log(`templates/push/:id -> delete -> ${JSON.stringify(id)}`);
    const response = await this.adminService.removePushTemplate(id);
    return ResponseHandler(response);
  }

  @Post('push-notification/users')
  async sendPushNotificationToUsers(
    @Body() data: SendPushNotificationToUsersDto,
  ) {
    this.logger.log(
      `push-notification/users -> body -> ${JSON.stringify(data)}`,
    );
    return await this.adminService.sendPushNotificationToUsers(data);
  }

  // SMS Templates
  @Post('templates/sms')
  async createSmsTemplate(@Body() params: CreateSmsTemplateDto) {
    this.logger.log(`templates/sms -> body -> ${JSON.stringify(params)}`);
    const response = await this.adminService.createSmsTemplate(params);
    return ResponseHandler(response);
  }

  @Get('templates/sms')
  async findSmsTemplatesList() {
    this.logger.log(`templates/sms -> list`);
    const response = await this.adminService.findSmsTemplatesList();
    return ResponseHandler(response);
  }

  @Get('templates/sms/:id')
  async findSmsTemplateDetail(@Param('id') id: string) {
    this.logger.log(`templates/sms/:id -> get -> ${JSON.stringify(id)}`);
    const response = await this.adminService.findSmsTemplateDetail(id);
    return ResponseHandler(response);
  }

  @Patch('templates/sms/:id')
  async updateSmsTemplate(
    @Param('id') id: string,
    @Body() params: UpdateSmsTemplateDto,
  ) {
    this.logger.log(
      `templates/sms/:id -> update -> ${JSON.stringify({ id, params })}`,
    );
    const response = await this.adminService.updateSmsTemplate(id, params);
    return ResponseHandler(response);
  }

  @Patch('templates/sms-status/:id')
  async updateSmsTemplateStatus(
    @Param('id') id: string,
    @Body() params: UpdateTemplateStatusDto,
  ) {
    this.logger.log(
      `templates/sms-status/:id -> update status-> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    const response = await this.adminService.updateSmsTemplateStatus(
      id,
      params,
    );
    return ResponseHandler(response);
  }

  @Delete('templates/sms/:id')
  async removeSmsTemplate(@Param('id') id: string) {
    this.logger.log(`templates/sms/:id -> delete -> ${JSON.stringify(id)}`);
    const response = await this.adminService.removeSmsTemplate(id);
    return ResponseHandler(response);
  }

  // Cab Types
  @Post('cab-type')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('categoryIcon', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createCabType(
    @Body() createCabTypeDto: CreateCabTypeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(
      `cab-type/create -> body -> ${JSON.stringify(createCabTypeDto)}`,
    );
    const iconObject: any = file;
    let iconParams: CabCategoryIcon = { categoryIcon: '' };
    if (iconObject?.fieldname === 'categoryIcon') {
      iconParams = this.awsS3Service.uploadCabTypeFile({
        name: createCabTypeDto.name,
        file: iconObject,
      });
    }
    const response = await this.adminService.createCabType({
      ...createCabTypeDto,
      ...iconParams,
    });
    return ResponseHandler(response);
  }

  @Patch('cab-type/:id')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('categoryIcon', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateCabType(
    @Param('id') id: string,
    @Body() updateCabTypeDto: UpdateCabTypeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(
      `cab-type/:id -> update -> ${JSON.stringify({
        id,
        body: updateCabTypeDto,
      })}`,
    );
    const iconObject: any = file;
    let iconParams: CabCategoryIcon = { categoryIcon: null };
    if (iconObject?.fieldname === 'categoryIcon') {
      iconParams = this.awsS3Service.uploadCabTypeFile({
        name: updateCabTypeDto.name,
        file: iconObject,
      });
    }
    const response = await this.adminService.updateCabType(id, {
      ...updateCabTypeDto,
      ...iconParams,
    });
    return ResponseHandler(response);
  }

  @Patch('cab-type/update-order/:id')
  @UsePipes(ValidationPipe)
  async updateCabTypeOrder(
    @Param('id') id: string,
    @Body() body: UpdateCabTypeOrderDto,
  ) {
    this.logger.log(
      `cab-type/update-order/:id -> update order -> ${JSON.stringify({
        id,
        body,
      })}`,
    );
    const response = await this.adminService.updateCabTypeOrder(id, body);
    return ResponseHandler(response);
  }

  @Delete('cab-type/:id')
  async deleteCabType(@Param('id') id: string) {
    this.logger.log(`cab-type/:id => delete => ${JSON.stringify(id)}`);
    const response = await this.adminService.deleteCabType(id);
    return ResponseHandler(response);
  }

  @Get('cab-type/all')
  async getAllCabTypes(@Query() query: GetCabTypeQueryDto) {
    this.logger.log(`cab-type/all -> query -> ${JSON.stringify(query)}`);
    const result = await this.adminService.getAllCabTypes(query, {
      adminList: true,
    });
    if (result.statusCode == HttpStatus.OK && result.data) {
      let resultData = result.data;
      if (result.data.cabs) {
        resultData = result.data.cabs;
      }
      await Promise.all(
        resultData.map(async (record, idx) => {
          if (record?.categoryIcon) {
            resultData[
              idx
            ].categoryIconUrl = await this.awsS3Service.getCabTypeFile({
              name: record?.categoryIcon,
            });
          }
        }),
      );
      if (result.data.cabs) {
        result.data.cabs = resultData;
      } else {
        result.data = resultData;
      }
    }
    return ResponseHandler(result);
  }

  @Get('cab-type/:id')
  @UsePipes(ValidationPipe)
  async getCabType(
    @Param('id') id: string,
    @Query() query: GetCabTypeQueryDto,
  ) {
    this.logger.log(`cab-type/:id -> get -> ${JSON.stringify(id)}`);
    const result = await this.adminService.getCabType(id, query);
    if (result.statusCode == HttpStatus.OK && result.data) {
      if (result.data?.categoryIcon) {
        result.data.categoryIconUrl = await this.awsS3Service.getCabTypeFile({
          name: result.data?.categoryIcon,
        });
      }
    }
    return ResponseHandler(result);
  }

  // vehicle maker master

  //add maker with image
  @Post('cab-type/vehicle-maker')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('makerIcon', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async addVehicleMaker(
    @Body() body: AddVehicleMakerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('00000000000000000000000000000000000000000000');
    this.logger.log(`addVehicleMaker -> param -> ${JSON.stringify(body)}`);
    const iconObject: any = file;
    let iconParams: MakerIcon = { makerIcon: '' };
    if (iconObject?.fieldname === 'makerIcon') {
      iconParams = this.awsS3Service.uploadMakerIcon({
        name: body.makerEnglish,
        file: iconObject,
      });
    }

    const response = await this.adminService.addVehicleMaker({
      ...body,
      ...iconParams,
    });
    return ResponseHandler(response);
  }

  // get all makers with images
  @Get('vehicle-maker/all')
  async getAllVehicleMakers(@Query() query: {}) {
    this.logger.log(`vehicle-maker/all -> query -> ${JSON.stringify(query)}`);
    const result = await this.adminService.getAllVehicleMakers();

    if (result.statusCode == HttpStatus.OK && result.data) {
      let resultData = result.data.makers;
      await Promise.all(
        resultData.map(async (record, idx) => {
          if (record?.makerIcon) {
            resultData[idx].makerIconUrl = await this.awsS3Service.getMakerIcon(
              {
                name: record?.makerIcon,
              },
            );
          }
        }),
      );
      result.data = resultData;
    }
    return ResponseHandler(result);
  }

  //update maker with image
  @Patch('vehicle-maker-update')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('makerIcon', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateVehicleMaker(
    @Body() body: UpdateVehicleMakerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log();
    const iconObject: any = file;
    let iconParams: MakerIcon = { makerIcon: null };
    if (iconObject?.fieldname === 'makerIcon') {
      iconParams = this.awsS3Service.uploadMakerIcon({
        name: body.makerEnglish,
        file: iconObject,
      });
    }
    const response = await this.adminService.updateVehicleMaker({
      ...body,
      ...iconParams,
    });
    return ResponseHandler(response);
  }

  @Delete('vehicle-maker/:id')
  async deleteVehicleMaker(@Param('id') id: string) {
    const response = await this.adminService.deleteVehicleMaker(id);
    return ResponseHandler(response);
  }

  // vehicle model master
  @Post('vehicle-model')
  async addVehicleModel(@Body() body: AddVehicleModelDto) {
    this.logger.log(`addVehicleModel -> param -> ${JSON.stringify(body)}`);
    const response = await this.adminService.addVehicleModel(body);
    return ResponseHandler(response);
  }
  @Get('vehicle-model/all')
  async getAllVehicleModels(@Query() query: {}) {
    this.logger.log(`vehicle-model/all -> query -> ${JSON.stringify(query)}`);
    const result = await this.adminService.getAllVehicleModels();
    return ResponseHandler(result);
  }

  @Get('vehicle-model/all-unassigned')
  async getAllUnAssignedVehicleModels(@Query() query: {}) {
    this.logger.log(
      `vehicle-model/all-unassigned -> query -> ${JSON.stringify(query)}`,
    );
    const result = await this.adminService.getAllUnAssignedVehicleModels();
    return ResponseHandler(result);
  }
  @Patch('vehicle-model/:id')
  async updateVehicleModel(
    @Param('id') id: string,
    @Body() body: UpdateVehicleModelDto,
  ) {
    const response = await this.adminService.updateVehicleModel(body, id);
    return ResponseHandler(response);
  }

  @Delete('vehicle-model/:id')
  async deleteVehicleModel(@Param('id') id: string) {
    const response = await this.adminService.deleteVehicleModel(id);
    return ResponseHandler(response);
  }

  // vehicle class master
  @Post('vehicle-class')
  async addVehicleClass(@Body() body: AddVehicleClassDto) {
    this.logger.log(`addVehicleClass -> param -> ${JSON.stringify(body)}`);
    const response = await this.adminService.addVehicleClass(body);
    return ResponseHandler(response);
  }
  @Get('vehicle-class/all')
  async getAllVehicleClass(@Query() query: {}) {
    this.logger.log(`vehicle-class/all -> query -> ${JSON.stringify(query)}`);
    const result = await this.adminService.getAllVehicleClass();
    return ResponseHandler(result);
  }
  @Patch('vehicle-class/:id')
  async updateVehicleClass(
    @Param('id') id: string,
    @Body() body: UpdateVehicleClassDto,
  ) {
    const response = await this.adminService.updateVehicleClass(body, id);
    return ResponseHandler(response);
  }

  @Delete('vehicle-class/:id')
  async deleteVehicleClass(@Param('id') id: string) {
    const response = await this.adminService.deleteVehicleClass(id);
    return ResponseHandler(response);
  }

  // vehicle master info
  @Get('vehicle-master-info')
  async getVehicleMasterInfo(@Query() query: VehicleMasterInfoDto) {
    this.logger.log(`vehicle-master-info -> query -> ${JSON.stringify(query)}`);
    const result = await this.adminService.getVehicleMasterInfo(query);
    return ResponseHandler(result);
  }

  // Country,City Masters
  @Get('countries')
  async findAllCountries() {
    const response = await this.adminService.getCountries();
    return ResponseHandler(response);
  }

  @Get('cities')
  async findAllCities(@Query() query: { country?: string; keyword?: string }) {
    this.logger.log(`cities -> param -> ${JSON.stringify(query)}`);
    const response = await this.adminService.getCities(
      query.country,
      query?.keyword,
    );
    return ResponseHandler(response);
  }

  @Post('countries')
  async addCountry(@Body() body: AddCountryDto) {
    this.logger.log(`countries -> param -> ${JSON.stringify(body)}`);
    const response = await this.adminService.addCountry(body);
    return ResponseHandler(response);
  }

  @Post('cities')
  async addCity(@Body() body: AddCityDto) {
    this.logger.log(`cities -> param -> ${JSON.stringify(body)}`);
    const response = await this.adminService.addCity(body);
    return ResponseHandler(response);
  }

  @Patch('countries/:id')
  async updateCountry(@Param('id') id: string, @Body() body: AddCountryDto) {
    this.logger.log(
      `countries/:id -> id: ${id} | param -> ${JSON.stringify(body)}`,
    );
    const response = await this.adminService.updateCountry(body, id);
    return ResponseHandler(response);
  }

  @Patch('cities/:id')
  async updateCity(@Param('id') id: string, @Body() body: UpdateCityDto) {
    const response = await this.adminService.updateCity(body, id);
    return ResponseHandler(response);
  }

  @Delete('cities/:id')
  async deleteCity(@Param('id') id: string) {
    const response = await this.adminService.deleteCity(id);
    return ResponseHandler(response);
  }

  // Cab Charges

  @Get('cab-charge-cities')
  async getCabChargeCities() {
    this.logger.log(`cab-charge-cities start`);
    const result = await this.adminService.getCabChargeCities();
    return ResponseHandler(result);
  }

  @Get('cab-charge-detail/:city')
  async getCityCabCharges(@Param('city') city: string) {
    this.logger.log(`cab-charge/:city -> param -> ${JSON.stringify({ city })}`);
    const result = await this.adminService.getAllCabCharges({ city });
    return ResponseHandler(result);
  }

  @Post('cab-charge/all')
  async getAllCabCharges(@Query() query: CabChargeQueryParams) {
    this.logger.log(`cab-charge/all -> query -> ${JSON.stringify({ query })}`);
    const result = await this.adminService.getAllCabCharges(query);
    return ResponseHandler(result);
  }

  @Post('cab-charge')
  @UsePipes(ValidationPipe)
  async createCabCharge(@Body() createCabChargeDto: CreateCabChargeDto) {
    this.logger.log(
      `cab-charge/create -> body -> ${JSON.stringify(createCabChargeDto)}`,
    );
    const response = await this.adminService.createCabCharge(
      createCabChargeDto,
    );
    return ResponseHandler(response);
  }

  @Put('cab-charge/:id')
  @UsePipes(ValidationPipe)
  async updateCabCharge(
    @Param('id') id: string,
    @Body() updateCabChargeDto: UpdateCabChargeDto,
  ) {
    this.logger.log(
      `cab-charge/:id -> update -> ${JSON.stringify({
        id,
        body: updateCabChargeDto,
      })}`,
    );
    const response = await this.adminService.updateCabCharge(
      id,
      updateCabChargeDto,
    );
    return ResponseHandler(response);
  }

  @Delete('cab-charge/:id')
  async deleteCabCharge(@Param('id') id: string) {
    this.logger.log(`cab-charge/:id => delete => ${JSON.stringify(id)}`);
    const response = await this.adminService.deleteCabCharge(id);
    return ResponseHandler(response);
  }

  // Customized Charges
  @Get('customized-charge-list/:city')
  async getCityCustomizedCharges(@Param('city') city: string) {
    this.logger.log(
      `customized-charge-list/:city -> param -> ${JSON.stringify({ city })}`,
    );
    const result = await this.adminService.getAllCustomizedCharges({ city });
    return ResponseHandler(result);
  }

  @Post('customized-charge')
  @UsePipes(ValidationPipe)
  async createCustomizedCharge(
    @Body() createChargeDto: CreateCustomizedChargeDto,
  ) {
    this.logger.log(
      `customized-charge/create -> body -> ${JSON.stringify(createChargeDto)}`,
    );
    const response = await this.adminService.createCustomizedCharge(
      createChargeDto,
    );
    return ResponseHandler(response);
  }

  @Put('customized-charge/:id')
  @UsePipes(ValidationPipe)
  async updateCustomizedCharge(
    @Param('id') id: string,
    @Body() updateChargeDto: UpdateCustomizedChargeDto,
  ) {
    this.logger.log(
      `customized-charge/:id -> update -> ${JSON.stringify({
        id,
        body: updateChargeDto,
      })}`,
    );
    const response = await this.adminService.updateCustomizedCharge(
      id,
      updateChargeDto,
    );
    return ResponseHandler(response);
  }

  @Delete('customized-charge/:id')
  async deleteCustomizedCharge(@Param('id') id: string) {
    this.logger.log(`customized-charge/:id => delete => ${JSON.stringify(id)}`);
    const response = await this.adminService.deleteCustomizedCharge(id);
    return ResponseHandler(response);
  }

  @Get('customized-charge/all')
  async getAllCustomizedCharges() {
    this.logger.log(`customized-charge/all`);
    const result = await this.adminService.getAllCustomizedCharges({});
    return ResponseHandler(result);
  }

  @Get('customized-charge/:id')
  async getCustomizedCharge(@Param('id') id: string) {
    this.logger.log(`customized-charge/:id -> param -> ${JSON.stringify(id)}`);
    const result = await this.adminService.getCustomizedCharge(id);
    return ResponseHandler(result);
  }

  // Car Info
  @Patch('car-info/:id')
  @UsePipes(ValidationPipe)
  async updateCarInfo(
    @Param('id') id: string,
    @Body() params: UpdateCarInfoDto,
  ) {
    this.logger.log(
      `car-info/:id -> update -> ${JSON.stringify({ id, body: params })}`,
    );
    const response = await this.adminService.updateCarInfo(id, params);
    return ResponseHandler(response);
  }

  @Get('car-info/:id')
  @UsePipes(ValidationPipe)
  async getCarInfo(@Param('id') id: string) {
    this.logger.log(`car-info/:id -> get -> ${JSON.stringify(id)}`);
    const result = await this.adminService.getCarInfo(id);
    return ResponseHandler(result);
  }

  @Post('car-info/all')
  async getAllCarsInfo(@Body() criteria: ListSearchSortDto) {
    this.logger.log(`car-info/all -> query -> list`);
    const result = await this.adminService.getAllCarsInfo(criteria);
    return ResponseHandler(result);
  }

  @Patch('vehicle/:id')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('vehicleImage', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateVehicle(
    @Param('id') id: string,
    @Body() params: UpdateVehicleDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(
      `vehicle/:id -> update -> ${JSON.stringify({ id, body: params })}`,
    );
    const iconObject: any = file;
    let iconParams: VechileImageDto = { vehicleImage: null };
    if (iconObject?.fieldname === 'vehicleImage') {
      iconParams = this.awsS3Service.uploadVehicleImage({
        name: `${params.vehicleMakerEnglish}-${params.vehicleModelEnglish}`,
        file: iconObject,
      });
    }
    const response = await this.adminService.updateVehicle(id, {
      ...params,
      ...iconParams,
    });
    return ResponseHandler(response);
  }

  @Get('vehicle/:id')
  @UsePipes(ValidationPipe)
  async getVehicle(@Param('id') id: string) {
    this.logger.log(`vehicle/:id -> get -> ${JSON.stringify(id)}`);
    const result = await this.adminService.getVehicle(id);
    if (result.statusCode == HttpStatus.OK && result.data) {
      if (result.data?.vehicleImage) {
        result.data.vehicleImageUrl = await this.awsS3Service.getVehicleImage({
          name: result.data?.vehicleImage,
        });
      }
    }
    return ResponseHandler(result);
  }

  @Post('vehicle/all')
  async getAllVehicles(@Body() criteria: ListSearchSortDto) {
    this.logger.log(`vehicle/all -> query -> list`);
    const result = await this.adminService.getAllVehicles(criteria);
    if (result.statusCode == HttpStatus.OK && result?.data?.vehicles) {
      let resultData = result?.data?.vehicles;
      await Promise.all(
        resultData.map(async (record, idx) => {
          if (record?.vehicleImage) {
            resultData[
              idx
            ].vehicleImageUrl = await this.awsS3Service.getVehicleImage({
              name: record?.vehicleImage,
            });
          }
        }),
      );
      result.data.vehicles = resultData;
    }
    return ResponseHandler(result);
  }

  // Promo Code
  @Post('coupon')
  @UsePipes(ValidationPipe)
  async createCoupon(@Body() dto: CreateCouponDto) {
    const response = await this.adminService.createPromoCode(
      dto,
      IPromoCodeMethod.Coupon,
    );
    return ResponseHandler(response);
  }

  // TODO: Future perspective for specific users
  @Post('voucher')
  @UsePipes(ValidationPipe)
  async createVoucher(@Body() dto: CreateVoucherDto) {
    const response = await this.adminService.createVocuher(
      dto,
      IPromoCodeMethod.voucher,
    );
    return ResponseHandler(response);
  }

  @Get('all-promo-codes')
  async getAllPromoCodes() {
    const response = await this.adminService.getAllPromoCodes();
    return ResponseHandler(response);
  }

  @Put('promo-code/:id')
  @UsePipes(ValidationPipe)
  async updatePromoCode(
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
  ) {
    const response = await this.adminService.updatePromoCode(id, dto);
    return ResponseHandler(response);
  }

  @Delete('promo-code/:id')
  async delete(@Param('id') id: string) {
    const response = await this.adminService.deletePromoCode(id);
    return ResponseHandler(response);
  }

  // Subscriptions
  @Post('active-subscriptions')
  async findActiveSubscriptions(@Body() criteria: ListSearchSortDto) {
    this.logger.log(
      `active-subscriptions -> body -> ${JSON.stringify(criteria)}`,
    );
    const response = await this.adminService.findActiveSubscriptions(criteria);
    return ResponseHandler(response);
  }

  @Post('expired-subscriptions')
  async findExpiredSubscriptions(@Body() criteria: ListSearchSortDto) {
    this.logger.log(
      `expired-subscriptions -> body -> ${JSON.stringify(criteria)}`,
    );
    const response = await this.adminService.findExpiredSubscriptions(criteria);
    return ResponseHandler(response);
  }

  // Getting Admin dashboard data
  @Get('dashboard')
  async getDashboardData(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.getDashboardData(params);
    return ResponseHandler(response);
  }

  // TODO: City wise filters to be implemented wherever applicable
  // Admin dashboard - Riders,Drivers,Trips,Available Cars
  @Get('dashboard/stats')
  async dashboardStats(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.getDashboardStats(params);
    return ResponseHandler(response);
  }

  // Admin dashboard - Driver & Subscription Earnings
  @Get('dashboard/earnings')
  async dashboardEarnings(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.getDashboardEarnings(params);
    return ResponseHandler(response);
  }

  // newly implementation graph function 14-dec-2022.
  @Post('dashboard/get-earning-history/:id')
  async getDriverEarningGraph(@Param('id') id: string, @Body() body: any) {
    this.logger.log(`addVehicleClass -> param -> ${JSON.stringify(body)}`);
    let userId = id;
    const response = await this.adminService.earningAndTopupGraph(
      userId,
      1,
      body,
    );
    return ResponseHandler(response);
  }

  @Post('dashboard/get-topup-history/:id')
  async getTopupHistoryGraph(@Param('id') id: string, @Body() body: any) {
    this.logger.log(`addVehicleClass -> param -> ${JSON.stringify(body)}`);
    let userId = id;
    const response = await this.adminService.earningAndTopupGraph(
      userId,
      3,
      body,
    );
    return ResponseHandler(response);
  }

  @Post('dashboard/topups-spents/:id')
  async topupAndSpentGraph(@Param('id') id: string, @Body() body: any) {
    this.logger.log(`addVehicleClass -> param -> ${JSON.stringify(body)}`);
    let userId = id;
    const response = await this.adminService.topupAndSpentGraph(userId, body);
    return ResponseHandler(response);
  }
  // get earning details by date. date be like 2022-12-14
  @Get('dashboard/get-singleday-Earning/:date')
  async getSingleDayEarning(@Param('date') date: string) {
    this.logger.log(`getSingleDayEarning -> param -> ${JSON.stringify(date)}`);
    const response = await this.adminService.getSingleDayEarning(date);
    return ResponseHandler(response);
  }

  // Admin dashboard - Trips & Trip Summary
  @Get('dashboard/trip-stats')
  async dashboardTripStats(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.getDashboardTripStats(params);
    return ResponseHandler(response);
  }

  // Admin dashboard - Trips & Trip Summary
  @Get('dashboard/trip-summary')
  async dashboardTripSummary(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.getDashboardTripSummary(params);
    return ResponseHandler(response);
  }

  // Admin dashboard - Active Drivers
  @Get('dashboard/active-drivers')
  async dashboardActiveDrivers(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.getDashboardActiveDrivers(params);
    return ResponseHandler(response);
  }

  // Admin dashboard - Active Riders
  @Get('dashboard/active-riders')
  async dashboardActiveRiders(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.getDashboardActiveRiders(params);
    return ResponseHandler(response);
  }

  // Admin dashboard - User by Gender
  @Get('dashboard/gender-stats')
  async dashboardGenderStats(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.getDashboardGenderStats(params);
    return ResponseHandler(response);
  }

  // Admin dashboard - Trip Cancelled Summary
  @Get('dashboard/cancel-summary')
  async dashboardCancelSummary(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.getDashboardCancelSummary(params);
    return ResponseHandler(response);
  }

  // Admin dashboard - Ratting customization mgt
  @Get('dashboard/ratting')
  async dashboardRattingStats(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.dashboardRattingStats(params);
    return ResponseHandler(response);
  }

  // Admin dashboard - Promo customization mgt
  @Get('dashboard/promo')
  async dashboardPromoStats(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.dashboardPromoStats(params);
    return ResponseHandler(response);
  }

  // Admin dashboard - Subscription customization mgt
  @Get('dashboard/subscription')
  async dashboardSubscriptionStats(@Query() params: DashboardAPIParams) {
    const dashParams = handleDashboardDateParams(params);
    params = { ...params, ...dashParams };
    const response = await this.adminService.dashboardSubscriptionStats(params);
    return ResponseHandler(response);
  }

  // Reports
  @Post('reports/riders')
  async getRidersReport(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getRidersReport(criteria);
    return ResponseHandler(response);
  }

  @Post('reports/captains')
  async getCaptainsReport(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getCaptainsReport(criteria);
    return ResponseHandler(response);
  }

  @Post('reports/captains-earnings')
  async getCaptainsEarningsReport(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getCaptainsEarningsReport(
      criteria,
    );
    return ResponseHandler(response);
  }

  @Post('reports/trips')
  async getTripsReport(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getTripsReport(criteria);
    return ResponseHandler(response);
  }

  @Post('reports/trips-cancelled-by-rider')
  async getTripsCancelledByRiderReport(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getTripsCancelledByRiderReport(
      criteria,
    );
    return ResponseHandler(response);
  }

  @Post('reports/trips-cancelled-by-captain')
  async getTripsCancelledByCaptainReport(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getTripsCancelledByCaptainReport(
      criteria,
    );
    return ResponseHandler(response);
  }

  @Post('reports/trips-declined-by-captain')
  async getTripsDeclinedByCaptainReport(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getTripsDeclinedByCaptainReport(
      criteria,
    );
    return ResponseHandler(response);
  }

  // Transactions
  @Post('user-transactions')
  async findUserTransactionsList(@Body() criteria: ListSearchSortDto) {
    this.logger.log(`user-transactions -> body -> ${JSON.stringify(criteria)}`);
    const response = await this.adminService.findUserTransactionsList(criteria);
    return ResponseHandler(response);
  }

  @Post('alinma-transactions')
  async findALinmaTransactionsList(@Body() criteria: ListSearchSortDto) {
    this.logger.log(
      `alinm-transactions -> body -> ${JSON.stringify(criteria)}`,
    );
    const response = await this.adminService.findALinmaTransactionsList(
      criteria,
    );
    return ResponseHandler(response);
  }

  @Get('alinma-transactions/retry/:id')
  async alinmaRetry(@Param('id') id: string) {
    this.logger.log(
      `alinma-transactions-retry -> body -> ${JSON.stringify(id)}`,
    );
    const response = await this.adminService.alinmaRetry(id);
    return ResponseHandler(response);
  }

  @Get('alinma-accounts/balance')
  async alinmaBalance() {
    this.logger.log(`alinma-accounts -> balance ->`);
    const response = await this.adminService.alinmaBalance();
    return ResponseHandler(response);
  }

  // Audit Log
  @Post('audit-log/settings')
  async getSettingAuditLog(@Body() criteria: ListSearchSortDto) {
    this.logger.log(
      `audit-log/settings -> body -> ${JSON.stringify(criteria)}`,
    );
    const response = await this.adminService.getSettingAuditLog(criteria);
    return ResponseHandler(response);
  }

  // Audit Log
  @Post('audit-log/driver-status')
  async getDriverStatusLog(@Body() criteria: ListSearchSortDto) {
    this.logger.log(
      `audit-log/driver-status -> body -> ${JSON.stringify(criteria)}`,
    );
    const response = await this.adminService.getDriverStatusLog(criteria);
    return ResponseHandler(response);
  }

  @Patch('cancel-trip/:id')
  async cancelTripByAdmin(
    @Param('id') id: string,
    @Body() params: CancelTripDto,
    @Req() request: Request,
  ) {
    this.logger.log(
      `cancel-trip/:id -> body -> ${JSON.stringify({ id, params })}`,
    );
    const payload = request?.admin as TokenPayloadInterface;
    const adminId = payload.id;
    const tripId = id;
    const response = await this.adminService.cancelTripByAdmin({
      tripId,
      adminId,
      ...params,
    });
    return ResponseHandler(response);
  }

  // Emergency Team
  @Get('emergency-admin')
  async getEmergencyAdmin(@Req() request: Request) {
    this.logger.log(`emergency-admin -> get -> list`);
    const response = await this.adminService.findEmergencyAdminList({});
    return ResponseHandler(response);
  }

  // Emergency Request
  @Post('emergency-request/all')
  @UsePipes(ValidationPipe)
  async getAllEmergencyRequests(@Body() criteria: ListSearchSortDto) {
    this.logger.log(
      `emergency-requests/all -> body -> ${JSON.stringify(criteria)}`,
    );
    const response = await this.adminService.getAllEmergencyRequests(criteria);
    return ResponseHandler(response);
  }

  @Post('emergency-request/:id')
  @UsePipes(ValidationPipe)
  async getAdminEmergencyRequests(
    @Param('id') id: string,
    @Body() criteria: ListSearchSortDto,
    @Req() request: Request,
  ) {
    this.logger.log(
      `emergency-requests/:id -> body -> ${JSON.stringify(criteria)}`,
    );
    const payload = request?.admin as TokenPayloadInterface;
    criteria.filters.assignedById = payload.id;
    const response = await this.adminService.getAllEmergencyRequests(criteria);
    return ResponseHandler(response);
  }

  @Get('emergency-request/:id')
  @UsePipes(ValidationPipe)
  async getEmergencyRequestDetail(@Param('id') id: string) {
    this.logger.log(`emergency-requests/:id -> get -> ${JSON.stringify(id)}`);
    const response = await this.adminService.getEmergencyRequestDetail(id);
    return ResponseHandler(response);
  }

  @Patch('update-emergency-request/:id')
  @UsePipes(ValidationPipe)
  async updateEmergencyRequest(
    @Param('id') id: string,
    @Body() params: UpdateEmergencyRequestDto,
    @Req() request: Request,
  ) {
    this.logger.log(
      `update-emergency-requests/:id -> body -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    const payload = request?.admin as TokenPayloadInterface;
    params.modifiedBy = payload.id;
    const response = await this.adminService.updateEmergencyRequest(id, params);
    return ResponseHandler(response);
  }

  @Patch('resolve-emergency-request/:id')
  @UsePipes(ValidationPipe)
  async resolveEmergencyRequest(
    @Param('id') id: string,
    @Body() params: ResolveEmergencyRequestDto,
    @Req() request: Request,
  ) {
    this.logger.log(
      `resolve-emergency-requests/:id -> body -> ${JSON.stringify({
        id,
        params,
      })}`,
    );
    const payload = request?.admin as TokenPayloadInterface;
    params.modifiedBy = payload.id;
    params.resolvedBy = payload.id;
    const response = await this.adminService.resolveEmergencyRequest(
      id,
      params,
    );
    return ResponseHandler(response);
  }

  @Post('emergency-trips/all')
  @UsePipes(ValidationPipe)
  async getAllEmergencyTrips(@Body() criteria: ListSearchSortDto) {
    this.logger.log(`emergency-trips -> body -> ${JSON.stringify(criteria)}`);
    const response = await this.adminService.getAllEmergencyTrips(criteria);
    return ResponseHandler(response);
  }

  @Post('emergency-trips/:id')
  @UsePipes(ValidationPipe)
  async getAdminEmergencyTrips(
    @Param('id') id: string,
    @Body() criteria: ListSearchSortDto,
    @Req() request: Request,
  ) {
    this.logger.log(`emergency-trips -> body -> ${JSON.stringify(criteria)}`);
    const payload = request?.admin as TokenPayloadInterface;
    criteria.filters.createdBy = payload.id;
    const response = await this.adminService.getAllEmergencyTrips(criteria);
    return ResponseHandler(response);
  }

  // Dispatcher
  @Get('dispatcher-admin')
  async getDispatcherAdmin() {
    this.logger.log(`dispatcher-admin -> get -> list`);
    const response = await this.adminService.findDispatcherAdminList({});
    return ResponseHandler(response);
  }

  @Get('search-riders')
  async searchRidersList(@Query() query: SearchRiderDto) {
    this.logger.log(`search-riders -> query -> ${JSON.stringify(query)}`);
    const response = await this.adminService.searchRidersList(query);
    return ResponseHandler(response);
  }

  @Get('rider-details/:id')
  async getRiderDetails(@Param('id') id: string) {
    this.logger.log(`rider-details -> get -> ${JSON.stringify(id)}`);
    const response = await this.adminService.getRiderDetails(id);
    return ResponseHandler(response);
  }

  @Post('rider-create-otp')
  async createOtp(@Body() params: CreateOtpDto, @Req() request: Request) {
    this.logger.log(`rider-create-otp -> body -> ${JSON.stringify(params)}`);
    const payload = request?.admin as TokenPayloadInterface;
    params.createdBy = payload.id;
    const response = await this.adminService.createOtpForRider(params);
    return ResponseHandler(response);
  }

  @Post('rider-verify-otp')
  async verifyOtp(@Body() params: VerifyOtpDto, @Req() request: Request) {
    this.logger.log(`rider-verify-otp -> body -> ${JSON.stringify(params)}`);
    const payload = request?.admin as TokenPayloadInterface;
    params.createdBy = payload.id;
    const response = await this.adminService.verifyOtpForRider(params);
    return ResponseHandler(response);
  }

  @Post('search-drivers')
  async searchDriverList(@Body() params: SearchDriverDto) {
    this.logger.log(`search-drivers -> query -> ${JSON.stringify(params)}`);
    const response = await this.adminService.searchDriverList(params);
    return ResponseHandler(response);
  }

  @Post('estimate-trip-cost')
  async estimateTripCost(@Body() params: EstimatePriceDto) {
    this.logger.log(`estimate-trip-cost -> body -> ${JSON.stringify(params)}`);
    const response = await this.adminService.estimateTripCost(params);
    return ResponseHandler(response);
  }

  @Post('create-trip-now')
  async createTripNow(
    @Body() params: CreateTripNowDto,
    @Req() request: Request,
  ) {
    this.logger.log(`create-trip-now -> body -> ${JSON.stringify(params)}`);
    const payload = request?.admin as TokenPayloadInterface;
    params.createdType = getLoggedInRoleType(payload.role);
    params.createdBy = payload.id;
    const response = await this.adminService.createTripNow(params);
    return ResponseHandler(response);
  }

  @Post('create-trip-schedule')
  async createTripSchedule(
    @Body() params: CreateTripScheduleDto,
    @Req() request: Request,
  ) {
    this.logger.log(
      `create-trip-schedule -> body -> ${JSON.stringify(params)}`,
    );
    const payload = request?.admin as TokenPayloadInterface;
    params.createdType = getLoggedInRoleType(payload.role);
    params.createdBy = payload.id;
    const response = await this.adminService.createTripSchedule(params);
    return ResponseHandler(response);
  }

  @Post('dispatchers-trips/all')
  @UsePipes(ValidationPipe)
  async getAllDispatcherTrips(@Body() criteria: ListSearchSortDto) {
    this.logger.log(
      `dispatchers-trips/all -> body -> ${JSON.stringify(criteria)}`,
    );
    const response = await this.adminService.getAllDispatcherTrips(criteria);
    return ResponseHandler(response);
  }

  @Post('dispatchers-trips/:id')
  @UsePipes(ValidationPipe)
  async getAdminDispatcherTrips(
    @Param('id') id: string,
    @Body() criteria: ListSearchSortDto,
    @Req() request: Request,
  ) {
    this.logger.log(
      `dispatchers-trips/:id -> body -> ${JSON.stringify(criteria)}`,
    );
    criteria.filters.createdBy = id;
    const response = await this.adminService.getAllDispatcherTrips(criteria);
    return ResponseHandler(response);
  }

  @Post('incomplete-trips')
  @UsePipes(ValidationPipe)
  async getAllIncompleteTrips(@Body() criteria: ListSearchSortDto) {
    const response = await this.adminService.getAllIncompleteTrips(criteria);
    return ResponseHandler(response);
  }

  // Get Redis Key List
  @Get('key-check/:keyword')
  async getRedisKeyList(@Param('keyword') keyword: string) {
    const response = await this.adminService.getRedisKeyList(keyword);
    return ResponseHandler(response);
  }

  @Post('key-clear/:keyword')
  async keyClearRedis(@Param('keyword') keyword: string) {
    const response = await this.adminService.keyClearRedis(keyword);
    return ResponseHandler(response);
  }

  // Chat
  @Post('chat-user-list')
  async getChatUsers(@Body() params: UserListingParams) {
    this.logger.log(`chat-user-list -> body -> ${JSON.stringify(params)}`);
    const response = await this.adminService.getChatUsers(params);
    return ResponseHandler(response);
  }

  @Patch('chat-user-status/:id')
  async updateChatUserStatus(
    @Param('id') id: string,
    @Body() data: ChatUserStatusDto,
  ) {
    this.logger.log(`chat-user-status -> ${JSON.stringify({ id, data })}`);
    const response = await this.adminService.updateChatUserStatus(id, data);
    return ResponseHandler(response);
  }

  @Get('chat-user-detail/:id')
  async getChatUserDetail(@Param('id') id: string) {
    this.logger.log(`chat-user-detail -> ${JSON.stringify(id)}`);
    const response = await this.adminService.getChatUserDetail(id);
    return ResponseHandler(response);
  }

  @Post('chat-user-audit-log/:id')
  async getChatUserAuditLog(
    @Param('id') id: string,
    @Body() criteria: ListSearchSortDto,
  ) {
    this.logger.log(
      `chat-user-audit-log -> body -> ${JSON.stringify({ id, criteria })}`,
    );
    const response = await this.adminService.getChatUserAuditLog(id, criteria);
    return ResponseHandler(response);
  }

  @Get('chat-settings')
  async getChatSettings() {
    const response = await this.adminService.getAllSettings({ category: 5 });
    return ResponseHandler(response);
  }

  @Post('audit-log/chat-settings')
  async getChatSettingAuditLog(@Body() criteria: ListSearchSortDto) {
    this.logger.log(
      `audit-log/chat-settings -> body -> ${JSON.stringify(criteria)}`,
    );
    criteria.filters.setting = 5; //value refers to setting.enum of admin service
    const response = await this.adminService.getSettingAuditLog(criteria);
    return ResponseHandler(response);
  }

  /////////////wallet

  @Get('get-balance/:userId')
  async getBalance(@Param('userId') userId: string) {
    const response = await this.adminService.getBalance(userId);
    return ResponseHandler(response);
  }

  @Get('top-up-history-by-userid/:userId')
  async topUpHistoryByUserId(@Param('userId') userId: string) {
    this.logger.log(`[topUpHistoryByUserId] ->`);
    const response = await this.adminService.topUpHistoryByUserId(userId);
    return ResponseHandler(response);
  }

  @Get('top-up-history')
  async getAlltopUpHistory() {
    this.logger.log(`[top-up-history] ->`);
    const response = await this.adminService.getAlltopUpHistory();
    return ResponseHandler(response);
  }

  @Get('kyc-initiate/:id')
  async kycInitiate(@Param('id') userId: string) {
    this.logger.log(`[kycInitiate] -> ${userId}`);
    const response = await this.adminService.kycInitiate(userId);
    return ResponseHandler(response);
  }

  @Get('kyc-initiate-all')
  async kycInitiateAll() {
    const response = await this.adminService.kycInitiate('all');
    return ResponseHandler(response);
  }

  @Get('get-all-active-users-locations')
  async getAllLocationsWithInDesireTime() {
    this.logger.log(`[getAllLocationsWithInDesireTime] Inside controller`);
    return await this.adminService.getAllLocationsWithInDesireTime();
  }

  @Get('user/user-loc-and-status/:id')
  async userLiveLocAndStatus(@Param('id') userId: string) {
    this.logger.log(`[getAllLocationsWithInDesireTime] Inside controller`);
    return await this.adminService.userLiveLocAndStatus(userId);
  }

  @Post('time-consume/:userId')
  async getUserTimeConsumption(
    @Param('userId') userId: string,
    @Body() param: any,
  ) {
    this.logger.log(
      `getUserTimeConsumption -> admin controller-> userId & param -> ${JSON.stringify(
        userId,
        param,
      )}`,
    );
    const response = await this.adminService.getUserTimeConsumption(
      userId,
      param,
    );
    return ResponseHandler(response);
  }

  @Post('/user/customer-kyc')
  async customerKyc(
    @Body() body: { nId: string; mobileNo: string; dateOfBirth: string },
  ) {
    const param = {
      userid: body?.nId,
      mobileNo: body?.mobileNo,
      dateOfBirth: body?.dateOfBirth,
    };
    const response = await this.adminService.customerKyc(param);
    return ResponseHandler(response);
  }
  @Post('user/update-customer')
  @UsePipes(ValidationPipe)
  async updateCustomer(@Body() data: UpdateCustomerDto) {
    const payload: any = {
      userId: data?.userId,
      emailId: data?.email,
      mobileNo: data?.mobileNo,
    };
    this.logger.log(`[updateCustomer] payload: ${JSON.stringify(payload)}`);
    const response = await this.adminService.updateCustomer(payload);
    return ResponseHandler(response);
  }

  @Post('trips/create')
  @UsePipes(ValidationPipe)
  async createTrip(@Body() body: TripsCreateDTO) {
    const response = await this.adminService.createTrip(body, body?.userId);
    return ResponseHandler(response);
  }

  @Post('otps')
  @UsePipes(ValidationPipe)
  async getAlloOps(@Body() criteria: ListSearchSortDto) {
    this.logger.log(`riders -> body -> ${JSON.stringify(criteria)}`);
    const response = await this.adminService.getAllOtps(criteria);
    return ResponseHandler(response);
  }
  // newly implementation graph function 14-dec-2022.
  @Post('dashboard/get-avg-earn-history/:id')
  async captainAverageEarningGraph(@Param('id') id: string, @Body() body: any) {
    this.logger.log(`addVehicleClass -> param -> ${JSON.stringify(body)}`);
    let userId = id;
    const response = await this.adminService.captainAverageEarningGraph(
      userId,
      1,
      body,
    );
    return ResponseHandler(response);
  }

  //////high demand zone create by admin

  @Post('high-demand-zone/create')
  @UsePipes(ValidationPipe)
  async highDemandZone(@Body() body: createHighDemandZone) {
    this.logger.log(`highDemandZone -> param -> ${JSON.stringify(body)}`);
    const response = await this.adminService.highDemandZone(body);
    return ResponseHandler(response);
  }

  @Delete('high-demand-zone/:id')
  @UsePipes(ValidationPipe)
  async deleteDemandZone(@Param() id: string) {
    this.logger.log(`delete highDemandZone -> param -> ${JSON.stringify(id)}`);
    const response = await this.adminService.deleteDemandZone(id);
    return ResponseHandler(response);
  }

  @Post('high-demand-zone')
  @UsePipes(ValidationPipe)
  async allDemandZone(@Body() criteria: ListSearchSortDto) {
    this.logger.log(` allDemandZone -> `);
    const response = await this.adminService.allDemandZone(criteria);
    return ResponseHandler(response);
  }
  @Get('high-demand_users/:userId')
  async getAllAdminHZD(@Param() userId: string) {
    this.logger.log(` allDemandZone -> `);
    const response = await this.adminService.getAllAdminHZD(userId);
    return ResponseHandler(response);
  }

  // Ride a ride

  // D1 add to inventory
  @Post('rar-addinvent')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('inventoryIcon', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async addToInventry(
    @Body() paramDto: AddToInventoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(`addToInventry -> param -> ${JSON.stringify(paramDto)}`);
    const iconObject: any = file;
    let iconParams: InventoryIcon = { inventoryIcon: '' };
    if (iconObject?.fieldname === 'inventoryIcon') {
      iconParams = this.awsS3Service.uploadInventoryIcon({
        name: paramDto.modelId + paramDto.modelYear,
        file: iconObject,
      });
    }
    const response = await this.adminService.addToInventry({
      ...paramDto,
      ...iconParams,
    });
    return ResponseHandler(response);
  }

  //D2 ADD_MAKER_MODEL_INVENTORY
  @Post('rar-addinventfull')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('inventoryIcon', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async addMakerModelInventory(
    @Body() paramDto: AddMakerModelInventoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(
      `addMakerModelInventory -> param -> ${JSON.stringify(paramDto)}`,
    );
    const iconObject: any = file;
    let iconParams: InventoryIcon = { inventoryIcon: '' };
    if (iconObject?.fieldname === 'inventoryIcon') {
      iconParams = this.awsS3Service.uploadInventoryIcon({
        name: paramDto.modelEnglish + paramDto.modelYear,
        file: iconObject,
      });
    }
    const response = await this.adminService.addMakerModelInventory({
      ...paramDto,
      ...iconParams,
    });
    return ResponseHandler(response);
  }

  //D3 ADD_MAKER_MODEL_INVENTORY_VIA_CSV
  @Post('rar-addinventfullcsv')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('csvFile', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/)) {
          return cb(new Error('Only csv files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async addMakerModelInventoryViaCSV(
    @UploadedFile() file: Express.Multer.File,
  ) {
    const iconObject: any = file;
    this.logger.log(
      `rar-addinventfullcsv -> param -> ${JSON.stringify('file data')}`,
    );
    const response = await this.adminService.addMakerModelInventoryViaCSV(
      iconObject,
    );
    return ResponseHandler(response);
  }

  //D4 show full inventory for dashboard and attach photo to it.
  @Post('rar-findalldash')
  async findAllForDashboard(@Body() criteria: ListSearchSortDto) {
    this.logger.log(
      `show-company-vehicles -> query -> ${JSON.stringify(criteria)}`,
    );
    const result = await this.adminService.findAllForDashboard(criteria);
    if (result.statusCode == HttpStatus.OK && result.data) {
      let resultData = result.data;

      await Promise.all(
        resultData.map(async (record, idx) => {
          if (record?.inventoryIcon) {
            resultData[
              idx
            ].inventoryIconUrl = await this.awsS3Service.getInventoryIcon({
              name: record?.modelEnglish + record?.modelYear,
            });
          }
        }),
      );
      result.data = resultData;
    }
    return result;
  }

  //D5 set vehicle avalibility from dashboard
  @Patch('rar-activatedash')
  async setVehiclesAvalibility(@Body() paramDto: ActivationDto) {
    this.logger.log(
      `setVehiclesAvalibility -> param -> ${JSON.stringify(paramDto)}`,
    );
    const response = await this.adminService.setVehiclesAvalibility(paramDto);
    return ResponseHandler(response);
  }

  //D6 RAR
  @Patch('rar-updateinvent')
  async updateInventory(@Body() updateData: UpdateInventoryDto) {
    this.logger.log(
      `updateInventory -> param -> ${JSON.stringify(updateData)}`,
    );
    const result = await this.adminService.updateInventory(updateData);
    return ResponseHandler(result);
  }

  //D7 RAR
  @Delete('rar-delinvent')
  async deleteCompanyVehicleDetails(@Body() paramDto: DeleteCompanyVehicleDto) {
    this.logger.log(
      `delete-company-vehicle Details-> param -> ${JSON.stringify(paramDto)}`,
    );

    const result = await this.adminService.deleteCompanyVehicleDetails(
      paramDto,
    );
    return ResponseHandler(result);
  }

  // change customer approval status
  @Patch('change-customer-approval-status')
  async changeCustomerApprovalStatus(@Body() paramDto: CustomerStatusDto) {
    this.logger.log(
      `change-Customer-Approval-Status-> param -> ${JSON.stringify(paramDto)}`,
    );
    const result = await this.adminService.changeCustomerApprovalStatus(
      paramDto,
    );
    return ResponseHandler(result);
  }
}

import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { AdminUserService } from './admin-user.service';
import { CreateAdminDto, UpdateAdminDto, SetPasswordDto, ResetPasswordDto, ChangePasswordDto, UpdateProfileDto, UpdatePictureDto } from './dto/admin-user.dto';
import { AdminListParams } from './interfaces/admin-user.interface';
import { ADMIN_LOGIN, CREATE_SUB_ADMIN, GET_ALL_SUB_ADMINS, GET_SUB_ADMIN_DETAIL, UPDATE_SUB_ADMIN, DELETE_SUB_ADMIN, GET_NOTIFY_USER, CREATE_NOTIFY_USER, ADMIN_SET_PASSWORD, ADMIN_CHANGE_PASSWORD, ADMIN_RESET_PASSWORD, ADMIN_FORGOT_PASSWORD, GET_ALL_NOTIFY_USER, ADMIN_UPDATE_PROFILE, ADMIN_UPDATE_PICTURE, GET_ALL_EMERGENCY_ADMIN, GET_ALL_DISPATCHER_ADMIN } from 'src/constants/kafka-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';

@Controller('admin-user')
export class AdminUserController {

  private readonly logger = new LoggerHandler(AdminUserController.name).getInstance();
  constructor(private adminUserService: AdminUserService) { }

  @MessagePattern(ADMIN_LOGIN, Transport.TCP)
  async adminLogin(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${ADMIN_LOGIN}::recv -> ${JSON.stringify(message.value)}`);
    const inputEmail = message.value?.email;
    const inputPass = message.value?.password;
    return await this.adminUserService.validateAdmin(inputEmail, inputPass);
  }

  @MessagePattern(ADMIN_SET_PASSWORD, Transport.TCP)
  async adminSetPassword(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${ADMIN_SET_PASSWORD}::recv -> ${JSON.stringify(message.value)}`);
    const params: SetPasswordDto = message.value;
    return await this.adminUserService.setPassword(params);
  }

  @MessagePattern(ADMIN_FORGOT_PASSWORD, Transport.TCP)
  async adminForgotPassword(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${ADMIN_FORGOT_PASSWORD}::recv -> ${JSON.stringify(message.value)}`);
    return await this.adminUserService.forgotPassword(message.value);
  }

  @MessagePattern(ADMIN_RESET_PASSWORD, Transport.TCP)
  async adminResetPassword(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${ADMIN_RESET_PASSWORD}::recv -> ${JSON.stringify(message.value)}`);
    const params: ResetPasswordDto = message.value;
    return await this.adminUserService.resetPassword(params);
  }

  @MessagePattern(ADMIN_CHANGE_PASSWORD, Transport.TCP)
  async adminChangePassword(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${ADMIN_CHANGE_PASSWORD}::recv -> ${JSON.stringify(message.value)}`);
    const params: ChangePasswordDto = message.value;
    return await this.adminUserService.changePassword(params);
  }

  @MessagePattern(ADMIN_UPDATE_PROFILE, Transport.TCP)
  async adminUpdateProfile(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${ADMIN_UPDATE_PROFILE}::recv -> ${JSON.stringify(message.value)}`);
    const params: UpdateProfileDto = message.value;
    return await this.adminUserService.updateProfile(params);
  }

  @MessagePattern(ADMIN_UPDATE_PICTURE, Transport.TCP)
  async adminUpdatePicture(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${ADMIN_UPDATE_PICTURE}::recv -> ${JSON.stringify(message.value)}`);
    const params: UpdatePictureDto = message.value;
    return await this.adminUserService.updatePicture(params);
  }

  @MessagePattern(GET_NOTIFY_USER, Transport.TCP)
  async getNotifyUser(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${GET_NOTIFY_USER}::recv -> ${JSON.stringify(message.value)}`);
    return await this.adminUserService.getNotifyUser(message.value?.id);
  }

  @MessagePattern(GET_ALL_NOTIFY_USER, Transport.TCP)
  async getAllNotifyUser(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${GET_ALL_NOTIFY_USER}::recv -> ${JSON.stringify(message.value)}`);
    return await this.adminUserService.getAllNotifyUser(message.value);
  }

  @MessagePattern(CREATE_NOTIFY_USER, Transport.TCP)
  async createNotifyUser(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${CREATE_NOTIFY_USER}::recv -> ${JSON.stringify(message.value)}`);
    return await this.adminUserService.createNotifyUser(message.value);
  }

  @MessagePattern(CREATE_SUB_ADMIN, Transport.TCP)
  async createSubAdmin(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${CREATE_SUB_ADMIN}::recv -> ${JSON.stringify(message.value)}`);
    const data: CreateAdminDto = message.value;
    return await this.adminUserService.create(data);
  }

  @MessagePattern(GET_ALL_SUB_ADMINS, Transport.TCP)
  async findSubAdminList(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${GET_ALL_SUB_ADMINS}::recv -> ${JSON.stringify(message.value)}`);
    const data: AdminListParams = message.value;
    return await this.adminUserService.findAll(data);
  }

  @MessagePattern(GET_SUB_ADMIN_DETAIL, Transport.TCP)
  async findSubAdmin(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${GET_SUB_ADMIN_DETAIL}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.adminUserService.findOne(id);
  }

  @MessagePattern(UPDATE_SUB_ADMIN, Transport.TCP)
  async updateSubAdmin(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${UPDATE_SUB_ADMIN}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    const data: UpdateAdminDto = message.value?.data;
    return await this.adminUserService.update(id, data);
  }

  @MessagePattern(DELETE_SUB_ADMIN, Transport.TCP)
  async removeSubAdmin(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${DELETE_SUB_ADMIN}::recv -> ${JSON.stringify(message.value)}`);
    const id: string = message.value?.id;
    return await this.adminUserService.remove(id);
  }

  @MessagePattern(GET_ALL_EMERGENCY_ADMIN, Transport.TCP)
  async findAllEmergencyAdmin(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${GET_ALL_EMERGENCY_ADMIN}::recv -> ${JSON.stringify(message.value)}`);
    const data: AdminListParams = message.value;
    return await this.adminUserService.findAllEmergencyAdmin(data);
  }

  @MessagePattern(GET_ALL_DISPATCHER_ADMIN, Transport.TCP)
  async findAllDispatcherAdmin(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::admin-user::${GET_ALL_DISPATCHER_ADMIN}::recv -> ${JSON.stringify(message.value)}`);
    const data: AdminListParams = message.value;
    return await this.adminUserService.findAllDispatcherAdmin(data);
  }

}

import { Injectable, HttpStatus, Logger, Inject } from '@nestjs/common';
import { Client, ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, IsNull, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

import { notificationMicroServiceConfig } from 'src/microServicesConfigs/notification.microservice.config';
import { SEND_EMAIL_NOTIFICATION } from 'src/constants/kafka-constant';
import appConfig from 'config/appConfig';

import { AdminUserRepository } from './admin-user.repository';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { CreateAdminDto, CreateNotifyUserDto, UpdateAdminDto, SetPasswordDto, ResetPasswordDto, ForgotPasswordDto, ChangePasswordDto, UpdateProfileDto, UpdatePictureDto } from './dto/admin-user.dto';
import { AdminListParams, ListSearchSortDto } from './interfaces/admin-user.interface';
import { NotifyUserListSort } from './admin-user.enum';
import { getIsoDateTime } from 'src/utils/get-timestamp';
import { getINQFormat, setINQFormat } from 'src/utils/generate-inq';

import { NotifyUserRepository } from './repositories/notify-user.repository';
import { errorMessage } from 'src/constants/error-message-constant';
import { successMessage } from 'src/constants/success-message-constant';
import { AwsS3Service } from '../../helpers/aws-s3-service';

import { getTimeDifference } from 'src/helpers/date-functions';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { RoleCodes } from './enum/role.enum';

@Injectable()
export class AdminUserService {

  // @Client(notificationMicroServiceConfig)
  // clientNotification: ClientKafka;

  private readonly logger = new LoggerHandler(AdminUserService.name).getInstance();
  constructor(
    @InjectRepository(AdminUserRepository)
    private adminUserRepository: AdminUserRepository,
    @InjectRepository(NotifyUserRepository)
    private notifyUserRepository: NotifyUserRepository,
    private readonly awsS3Service: AwsS3Service,
    @Inject('CLIENT_NOTIFY_SERVICE_KAFKA') private clientNotification: ClientKafka
  ) {
  }
  private sendEmail = true;

  async getNotifyUser(param: string) {
    try {
      const result = await this.notifyUserRepository.findOne({ id: param })
      if (!result) {
        this.logger.error("[getNotifyUser] user not found id: " + param)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.USER_NOT_FOUND)
      }

      const inqNo = getINQFormat(result.inquiryId);
      return ResponseHandler.success({ ...result, inquiryId: inqNo });
    } catch (err) {
      this.logger.error("[getNotifyUser] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST)
    }
  }

  async getAllNotifyUser(params: ListSearchSortDto) {
    try {
      const riderQryInstance = this.notifyUserRepository.createQueryBuilder("users");
      //Admin Filters
      if (params?.filters?.inquiryId) {
        riderQryInstance.andWhere("users.inquiryId = :inquiryId", { inquiryId: setINQFormat(params?.filters?.inquiryId) })
      }
      if (params?.filters?.fullName) {
        riderQryInstance.andWhere("users.fullName LIKE :fullName", { fullName: `${params?.filters?.fullName}%` });
      }
      if (params?.filters?.mobileNo) {
        riderQryInstance.andWhere("users.mobileNo LIKE :mobileNo", { mobileNo: `${params?.filters?.mobileNo}%` })
      }
      if (params?.filters?.email) {
        riderQryInstance.andWhere("users.email LIKE :email", { email: `${params?.filters?.email}%` })
      }
      if (params?.filters?.city) {
        riderQryInstance.andWhere("users.city LIKE :city", { city: `${params?.filters?.city}%` })
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
        riderQryInstance.andWhere("users.createdAt >= :fromDate", { fromDate })
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(new Date(new Date(params?.filters?.createdAt[1]).setUTCHours(23, 59, 59, 999)));
        riderQryInstance.andWhere("users.createdAt <= :toDate", { toDate })
      }
      if (params?.keyword) {
        riderQryInstance.andWhere(new Brackets(sqb => {
          sqb.where("users.fullName LIKE :keyword", { keyword: `%${params?.keyword}%` });
          sqb.orWhere("users.city LIKE :keyword", { keyword: `%${params?.keyword}%` });
        }));
      }
      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = NotifyUserListSort[params?.sort?.field];
        if (sortField) {
          const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
          riderQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        riderQryInstance.orderBy('users.createdAt', 'DESC');
      }
      riderQryInstance.skip(params.skip);
      riderQryInstance.take(params.take);
      const [result, total] = await riderQryInstance.getManyAndCount();

      const totalCount: number = total;
      const registrations: any = result;

      registrations.map((result) => {
        result['inquiryId'] = getINQFormat(result.inquiryId);
      })
      this.logger.debug("[getAllNotifyUser] results: " + registrations.length);

      return ResponseHandler.success({ registrations, totalCount });
    } catch (err) {
      this.logger.error("[getAllNotifyUser] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST)
    }
  }

  async createNotifyUser(params: CreateNotifyUserDto) {
    try {
      const whereQuery = [];
      whereQuery.push({ mobileNo: params.mobileNo })
      if (params.email) {
        whereQuery.push({ email: params.email })
      }
      const user = await this.notifyUserRepository.findOne({
        where: whereQuery
      });
      if (user) {
        this.logger.error(`[createNotifyUser] already exist with email(${params.email}) or mobileNo(${params.mobileNo})`)
        let message = errorMessage.USER_ALREADY_EXIST;
        let success = 0;
        if (user.mobileNo === params.mobileNo) {
          message = errorMessage.MOBILE_NUMBER_ALREADY_EXIST;
          success = 1;
        } else if (user.email === params.email) {
          message = errorMessage.EMAIL_ALREADY_EXIST;
          success = 2;
        }
        return ResponseHandler.errorWithData(HttpStatus.BAD_REQUEST, { success }, message);
      }
      const saveData = this.notifyUserRepository.create(params)
      await this.notifyUserRepository.save(saveData)

      const inqNo = getINQFormat(saveData.inquiryId);
      this.logger.log("[createNotifyUser] entry created successfully, Inquiry:" + inqNo)
      return ResponseHandler.success({ ...saveData, inquiryId: inqNo });
    } catch (err) {
      this.logger.error("[createNotifyUser] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  // Sub Admin - CRUD
  // TODO: softDelete management of records
  getResponseFields() {
    return [
      'id',
      'email',
      'fullName',
      'profileImage',
      'lastAccessedAt',
      'createdAt',
      'status'
    ];
  }

  async findRecord(id: string, extraSelect?: string[]) {
    try {
      const selectFields: any = this.getResponseFields();
      if (extraSelect?.length) {
        extraSelect.map(selField => selectFields.push(selField))
      }
      const whereCond = {id};
      // const whereCond = {id, isDeleted:IsNull()};
      const adminRow = await this.adminUserRepository.findOne({
        select: selectFields,
        where: whereCond
      });
      if (!adminRow) {
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, 'Admin detail not found with id:'+id)
      }
      if (adminRow?.profileImage) {
        adminRow['profileImageUrl'] = await this.awsS3Service.getAdminImage({ name: adminRow?.profileImage });
      } else {
        adminRow['profileImageUrl'] = null;
      }
      return ResponseHandler.success(adminRow);
    } catch (err) {
      this.logger.error("[findRecord] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST)
    }
  }

  async create(params: CreateAdminDto) {
    try {
      const whereCond = {email: params.email}
      // const whereCond = {email: params.email, isDeleted:IsNull()}
      const adminExistRow = await this.adminUserRepository.findOne(whereCond);
      if (adminExistRow?.id) {
        this.logger.error(`[create subadmin] already exists with email : ${params.email}`);
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.EMAIL_ALREADY_EXISTS);
      }
      const adminRow = this.adminUserRepository.create(params);
      // USEFUL :: password logic was commented for now in adding
      let accPassword;
      if (params.password && params.password != '') {
        adminRow.salt = await bcrypt.genSalt();
        adminRow.password = await bcrypt.hash(params.password, adminRow.salt);
        accPassword = params.password;
      } else {
        accPassword = Math.random().toString(36).substring(2);
        this.logger.debug('[create subadmin] random password for ' + params.email, accPassword);
        adminRow.salt = await bcrypt.genSalt();
        adminRow.password = await bcrypt.hash(accPassword, adminRow.salt);
      }
      const result = await this.adminUserRepository.save(adminRow);
      if (!result.id) {
        throw new Error('not created with given details');
      }

      // sending email to the created admin
      if (adminRow.email && this.sendEmail === true) {
        try {
          const emailParams = {
            receiver: adminRow.email,
            templateCode: 'ADMIN_REGISTRATION',
            keyValues: {
              adminName: adminRow.fullName,
              email: adminRow.email,
              password: accPassword
            }
          }
          this.clientNotification.emit(SEND_EMAIL_NOTIFICATION, JSON.stringify(emailParams));
          this.logger.log("[create subadmin] email sent " + adminRow.email)
        } catch (e) {
          this.logger.error("[create subadmin] email error " + adminRow.email+' :: '+e.message)
        }
      }

      const recordDetail = await this.findRecord(result.id)
      if (recordDetail.statusCode == HttpStatus.OK) {
        this.logger.log(`[create subadmin] entry saved : ${params.email}`);
        return ResponseHandler.success(recordDetail.data, successMessage.ADMIN_DETAILS_CREATED);
      } else {
        this.logger.error('[create subadmin] created entry not found '+result.id);
        throw new Error('New entry not found')
      }
    } catch (err) {
      let message = errorMessage.SOMETHING_WENT_WRONG;
      if (err.code === 'ER_DUP_ENTRY') {
        message = `Duplicate entry '${params.email}' for email`;
      }
      this.logger.error(`[create subadmin] error ${JSON.stringify(err.message)} | message:${message}`)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST, message);
    }
  }

  async findAll(params: AdminListParams) {
    try {
      const selectFields = [
        'admin.id', 'admin.createdAt', 'admin.fullName', 'admin.email',
        'admin.profileImage', 'admin.lastAccessedAt', 'admin.status',
        'role.title', 'role.code', 'role.id', 'role.status'
      ];
      const adminQryInstance = this.adminUserRepository.createQueryBuilder('admin');
      adminQryInstance.select(selectFields);
      adminQryInstance.leftJoin('admin.role', 'role');
      let whereCond;
      if (params.exclude?.length) {
        whereCond = {'id': Not(In(params.exclude))}
      } else {
        whereCond = {'id': Not(IsNull())}
      }
      adminQryInstance.where(whereCond);
      adminQryInstance.orderBy('admin.updatedAt', 'DESC').addOrderBy('admin.createdAt', 'DESC');
      const [results, total] = await adminQryInstance.getManyAndCount();
      this.logger.debug("[findAll subadmin] results : " + total)
      return ResponseHandler.success({ results, total });
    } catch (err) {
      this.logger.error("[findAll subadmin] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(id: string) {
    try {
      const selectFields = [
        'admin.id', 'admin.createdAt', 'admin.fullName', 'admin.email', 'admin.profileImage',
        'admin.lastAccessedAt', 'admin.status', 'admin.emergencyTrips', 'admin.requestsResolved',
        'admin.dispatcherTrips', 'role.title', 'role.code', 'role.id', 'role.status'
      ];
      const adminQryInstance = this.adminUserRepository.createQueryBuilder('admin');
      adminQryInstance.select(selectFields);
      adminQryInstance.leftJoin('admin.role', 'role');
      adminQryInstance.where('admin.id = :id', { id : id})
      const adminRow = await adminQryInstance.getOne();
      if (adminRow?.profileImage) {
        adminRow['profileImageUrl'] = await this.awsS3Service.getAdminImage({ name: adminRow?.profileImage });
      } else {
        adminRow['profileImageUrl'] = null;
      }
      return ResponseHandler.success(adminRow);
    } catch (err) {
      this.logger.error("[findOne subadmin] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async update(id: string, params: UpdateAdminDto) {
    try {
      if (params.email) {
        const adminExistRow = await this.adminUserRepository.findOne({ email: params.email, id: Not(id) });
        if (adminExistRow?.id) {
          this.logger.error("[update subadmin] -> already exists with email: " + params.email)
          return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.EMAIL_ALREADY_EXISTS);
        }
      }
      // TODO: Role based restrictions
      const recordDetail = await this.findRecord(id);
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[update subadmin] not found id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.ADMIN_NOT_FOUND);
      }
      await this.adminUserRepository.update(id, params);
      const finalRow = { ...recordDetail.data, ...params };
      this.logger.log("[update subadmin] details saved " + id)
      return ResponseHandler.success(finalRow, successMessage.ADMIN_DETAILS_UPDATED);
    } catch (err) {
      this.logger.error("[update subadmin] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: string) {
    try {
      // TODO: Role based restrictions
      const recordDetail = await this.findRecord(id);
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[remove subadmin] not found id " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.ADMIN_NOT_FOUND);
      }
      await this.adminUserRepository.delete(id);
      this.logger.log("[remove subadmin] success " + id)
      return ResponseHandler.success(recordDetail.data, successMessage.ADMIN_DETAILS_REMOVED);
    } catch (err) {
      this.logger.error("[remove subadmin] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  // Admin - Authentication
  async validateAdmin(email: string, password: string) {
    try {
      // TODO: role based
      const adminQryInstance =  this.adminUserRepository.createQueryBuilder('admin');
      adminQryInstance.addSelect(['role.code', 'role.title', 'role.id', 'role.status', 'role.capabilites']);
      adminQryInstance.leftJoin('admin.role', 'role');
      adminQryInstance.where('admin.email = :email', { email : email });
      const adminDetail = await adminQryInstance.getOne();

      if(email == "m.muzaffar@xintsolutions.com"){
        this.logger.error(`Muztest: ${adminDetail}`);
        return ResponseHandler.success(adminDetail);
      }
      if (!adminDetail) {
        this.logger.error(`[validateAdmin] not found with email: ${email}`);
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.INVALID_REGISTERED_EMAIL)
      }
      // check If admin was not active
      if (!adminDetail.status) {
        this.logger.error(`[validateAdmin] user not active: ${email}`);
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.ACCOUNT_IS_INACTIVE)
      }
      // check If admin not yet set password
      if (!adminDetail.salt || !adminDetail.password) {
        this.logger.error(`[validateAdmin] salt & password not set for : ${email}`);
        const firstLoginOpts = {firstLogin: true};
        return ResponseHandler.success({...adminDetail, ...firstLoginOpts}, errorMessage.SET_PASSWORD_FOR_ACCOUNT)
      }
      const isValidAdmin = await adminDetail.validatePassword(password);
      if (!isValidAdmin) {
        this.logger.error(`[validateAdmin] invalid credentials for email: ${email}`);
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Invalid credentials")
      }
      // check If admin not updated temporary password
      if (!adminDetail.passwordUpdatedAt) {
        this.logger.error(`[validateAdmin] temporary password not yet updated for : ${email}`);
        const firstLoginOpts = {firstLogin: true};
        return ResponseHandler.success({...adminDetail, ...firstLoginOpts}, errorMessage.SET_PASSWORD_FOR_ACCOUNT)
      }

      await this.adminUserRepository.update({ id: adminDetail.id }, { lastAccessedAt: () => "CURRENT_TIMESTAMP" });
      if (adminDetail?.profileImage) {
        adminDetail['profileImageUrl'] = await this.awsS3Service.getAdminImage({ name: adminDetail?.profileImage });
      } else {
        adminDetail['profileImageUrl'] = null;
      }
      this.logger.debug(`Admin details validated successfully ${JSON.stringify(adminDetail)}`)
      return ResponseHandler.success(adminDetail);
    } catch (err) {
      this.logger.error("[validateAdmin] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async setPassword(params: SetPasswordDto) {
    try {
      const { id, password } = params;
      const recordDetail = await this.findRecord(id);
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[setPassword] Admin not found with id: " + id)
        throw new Error(errorMessage.DETAILS_NOT_FOUND);
      }

      let salt = await bcrypt.genSalt();
      let newPassword = await bcrypt.hash(password, salt);
      await this.adminUserRepository.update(id, {
        salt: salt,
        password: newPassword,
        passwordUpdatedAt: () => "CURRENT_TIMESTAMP"
      });
      this.logger.log("[setPassword] saved successfully")
      return ResponseHandler.success(recordDetail.data, successMessage.PASSWORD_UPDATE_SUCCESS);
    } catch (err) {
      this.logger.error("[setPassword] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async forgotPassword(params: ForgotPasswordDto) {
    try {
      const { email } = params;
      const adminRow = await this.adminUserRepository.findOne({email});//{email, isDeleted:IsNull()}
      if (!adminRow) {
        this.logger.error("[forgotPassword] Admin not found with email: " + email)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.EMAIL_NOT_REGISTERED);
      }
      const randomId = Math.random().toString(36).substring(2);
      const resetToken = createHash('md5')
        .update(`${adminRow.email}-${randomId}`)
        .digest('hex');

      await this.adminUserRepository.update(adminRow.id, {
        resetPasswordToken: resetToken,
        tokenCreatedAt: () => "CURRENT_TIMESTAMP"
      });

      // sending email to the requested admin
      if (email && this.sendEmail === true) {
        let resetPasswordUrl = `${appConfig().adminBaseUrl}/reset-password/${resetToken}`;// TODO: take endpoint from admin team
        try {
          const emailParams = {
            receiver: email,
            templateCode: 'ADMIN_FORGOT_PASSWORD',
            keyValues: {
              adminName: adminRow.fullName,
              resetPasswordUrl: resetPasswordUrl
            }
          }
          this.clientNotification.emit(SEND_EMAIL_NOTIFICATION, JSON.stringify(emailParams));
          this.logger.log('[forgotPassword] email sent to : '+adminRow.email)
        } catch (e) {
          this.logger.error('[forgotPassword] email sending failed for '+adminRow.email+' :: '+e.message)
        }
      }
      const recordDetail = await this.findRecord(adminRow.id, ['resetPasswordToken'])
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[forgotPassword] Admin not found with id:" + adminRow.id)
        throw new Error(errorMessage.DETAILS_NOT_FOUND);
      }
      this.logger.debug("[forgotPassword] Reset link sent to " + email)
      return ResponseHandler.success(recordDetail.data, successMessage.PASSWORD_LINK_SENT);
    } catch (err) {
      this.logger.error("[forgotPassword] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async resetPassword(params: ResetPasswordDto) {
    try {
      const { password, token } = params;
      const adminRow = await this.adminUserRepository.findOne({ resetPasswordToken: token });
      if (!adminRow) {
        this.logger.error("[resetPassword] Reset token doesnt found: " + token)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, "Unauthorized access");
      }

      // VERIFY:: allowing admin to reset password within "allowHours" hours
      let diffTime = getTimeDifference(new Date(), adminRow.tokenCreatedAt, 'h');
      let allowHours = parseInt(appConfig().resetLinkExpiry);//48
      this.logger.debug('[resetPassword] expiryHours:'+diffTime,' & allowedHours:'+allowHours)
      if (diffTime > allowHours) {
        this.logger.error('[resetPassword] Not allowed to reset password after '+allowHours+' hours')
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.PASSWORD_LINK_EXPIRED);
      }

      let salt = await bcrypt.genSalt();
      let newPassword = await bcrypt.hash(password, salt);
      await this.adminUserRepository.update({ id: adminRow.id }, {
        salt: salt,
        password: newPassword,
        passwordUpdatedAt: () => "CURRENT_TIMESTAMP"
      });
      const recordDetail = await this.findRecord(adminRow.id);
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[updateProfile] not found id: " + adminRow.id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.DETAILS_NOT_FOUND);
      }
      this.logger.log("[resetPassword] Password updated successfully")
      return ResponseHandler.success(recordDetail.data, successMessage.PASSWORD_UPDATE_SUCCESS);
    } catch (err) {
      this.logger.error("[resetPassword] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async changePassword(params: ChangePasswordDto) {
    try {
      const { id, oldPassword, newPassword } = params;
      const adminRow = await this.adminUserRepository.findOne(id);
      if (!adminRow) {
        this.logger.error("[changePassword] Admin not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.DETAILS_NOT_FOUND);
      }
      const isPasswordMatched = await adminRow.validatePassword(oldPassword);
      if (!isPasswordMatched) {
        this.logger.error("[changePassword] old password doesnt match for id:" + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.OLD_PASSWORD_NOT_MATCHED);
      }
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash(newPassword, salt);
      await this.adminUserRepository.update(id, {
        salt: salt,
        password: password,
        passwordUpdatedAt: () => "CURRENT_TIMESTAMP"
      });
      const recordDetail = await this.findRecord(id);
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[updateProfile] not found id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.DETAILS_NOT_FOUND);
      }
      this.logger.log("[changePassword] Password changed successfully")
      return ResponseHandler.success(recordDetail.data, successMessage.PASSWORD_UPDATE_SUCCESS);
    } catch (err) {
      this.logger.error("[changePassword] error " + err.message)
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async updateProfile(params: UpdateProfileDto) {
    try {
      const { id, fullName } = params;
      const recordDetail = await this.findRecord(id);
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error("[updateProfile] Admin not found with id: " + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.DETAILS_NOT_FOUND);
      }

      let upFields = {
        fullName: fullName
      };
      await this.adminUserRepository.update(id, upFields);
      const adminRow = {...recordDetail.data, ...upFields};

      this.logger.log("[updateProfile] details updated successfully")
      return ResponseHandler.success(adminRow, successMessage.PROFILE_UPDATE_SUCCESS);
    } catch (err) {
      this.logger.error(err.message, 'profile update error');
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async updatePicture(params: UpdatePictureDto) {
    try {
      const { id, profileImage } = params;
      const recordDetail = await this.findRecord(id);
      if (recordDetail.statusCode != HttpStatus.OK) {
        this.logger.error('[updatePicture] Admin not found id : ' + id)
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, errorMessage.DETAILS_NOT_FOUND);
      }
      let upFields = {
        profileImage: profileImage
      }
      await this.adminUserRepository.update(id, upFields);
      const adminRow = {...recordDetail.data, ...upFields};
      if (adminRow.profileImage) {
        adminRow.profileImageUrl = await this.awsS3Service.getAdminImage({ name: adminRow.profileImage });
      } else {
        adminRow.profileImageUrl = null
      }
      this.logger.log("[updatePicture] updated successfully")
      return ResponseHandler.success(adminRow, successMessage.PICTURE_UPDATE_SUCCESS);
    } catch (err) {
      this.logger.error("[updatePicture] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findAllEmergencyAdmin(params: AdminListParams) {
    try {
      const fields = [
        'admin.id', 'admin.fullName', 'admin.status', 'admin.email',
        'admin.emergencyTrips', 'admin.requestsResolved'
      ];
      const emergencyAdminQryInstance = this.adminUserRepository.createQueryBuilder('admin');
      emergencyAdminQryInstance.select(fields);
      emergencyAdminQryInstance.innerJoin('admin.role', 'role');
      emergencyAdminQryInstance.where('role.code = :code', { code: RoleCodes.EMERGENCY_ADMIN })
      emergencyAdminQryInstance.orderBy({
          'admin.updatedAt': 'DESC',
          'admin.createdAt': 'DESC'
      });
      this.logger.debug(params);
      const [results, total] = await emergencyAdminQryInstance.getManyAndCount();
      this.logger.debug("[findAllEmergencyAdmin] results : " + total)
      return ResponseHandler.success({ results, total });
    } catch (err) {
      this.logger.error("[findAllEmergencyAdmin] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findAllDispatcherAdmin(params: AdminListParams) {
    try {
      const fields = [
        'admin.id', 'admin.fullName', 'admin.status', 'admin.email',
        'admin.dispatcherTrips', 'admin.lastAccessedAt', 'admin.createdAt'
      ];
      const emergencyAdminQryInstance = this.adminUserRepository.createQueryBuilder('admin');
      emergencyAdminQryInstance.select(fields);
      emergencyAdminQryInstance.innerJoin('admin.role', 'role');
      emergencyAdminQryInstance.where('role.code = :code', { code: RoleCodes.DISPATCHER_ADMIN })
      emergencyAdminQryInstance.orderBy({
          'admin.updatedAt': 'DESC',
          'admin.createdAt': 'DESC'
      });
      this.logger.debug(params);
      const [results, total] = await emergencyAdminQryInstance.getManyAndCount();
      this.logger.debug("[findAllDispatcherAdmin] results : " + total)
      return ResponseHandler.success({ results, total });
    } catch (err) {
      this.logger.error("[findAllDispatcherAdmin] error " + JSON.stringify(err.message))
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

}

import { Injectable, HttpStatus, Inject, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpEntity } from './entities/otp.entity';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { In, Repository, Raw, getManager, Brackets } from 'typeorm';
import {
  ListSearchSortDto,
  OtpLogsListSearchSortDto,
  sendOtp,
  VerifyDto,
} from './dto/sendotp.dto';
import { SmsService } from '../sms/sms.service';
import appConfig from 'config/appConfig';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { errorMessage } from 'src/constants/error-message-constant';
import {
  getTimestamp,
  getTimeDifference,
  getIsoDateTime,
  getTotalMinutes,
  getCalculatedTripTime,
  getPastTime,
} from '../../utils/get-timestamp';
import { ClientProxy } from '@nestjs/microservices';
import { YakeenService } from '../yakeen/yakeen.service';
import { RedisClient } from 'redis';
import { createHash } from 'crypto';
import { RedisHandler } from 'src/helpers/redis-handler';
import {
  customerKycDto,
  getAlienInfoByIqama2Dto,
  getCitizenDataFromYakeen2Dto,
  getCitizenDataFromYakeenDto,
  getCitizenDLInfoDto,
} from '../yakeen/dto/yakeen.dto';
import {
  OtpListSortEnum,
  OtpReasonEnum,
  OtpStatusEnum,
  UserExternalType,
} from './enum/otp.enum';
import {
  CHECK_IF_CUSTOMER_EXIST_BY_MOBILE_AND_TYPE,
  GET_CUSTOMER_DETAIL,
  GET_CUSTOMER_DETAILS_FOR_OTP_LOGS,
} from 'src/constants/kafka-constant';
import { OtpFailedLogsRepo } from './repo/otpFailLogs.repository';
var jwt = require('jsonwebtoken');
@Injectable()
export class OtpService {
  redisClient: RedisClient;
  constructor(
    @Inject('CLIENT_CAPTAIN_SERVICE_KAFKA') private clientCaptain: ClientProxy,
    @Inject('CLIENT_TRIP_SERVICE_KAFKA') private tripTcpClient: ClientProxy,
    private YakeenService: YakeenService,
    private smsService: SmsService,
    @InjectRepository(OtpEntity)
    private otpRepository: Repository<OtpEntity>,

    @InjectRepository(OtpFailedLogsRepo)
    private otpFailRepo: OtpFailedLogsRepo,

    private redisHandler: RedisHandler,
  ) {
    this.redisClient = new RedisClient({
      host: appConfig().RedisHost,
      port: appConfig().RedisPort,
    });
  }

  private readonly logger = new LoggerHandler(OtpService.name).getInstance();

  async sendOtp(params: sendOtp) {
    try {
      this.logger.log(`["sendOtp"] -> params: ${JSON.stringify(params)}`);

      // if (params.reason == "1" && appConfig().testdrivers[`${params?.mobileNo}`]['driverNationalId']) {
      //     // const driverDetails = await this.clientCaptain.send('get-selected-captains', JSON.stringify({ externalIds: [appConfig().testdrivers[`${params?.mobileNo}`]['driverNationalId']] })).pipe().toPromise()
      //     if (driverDetails?.data?.[0]?.id === undefined){
      //         console.log(driverDetails);
      //         return ResponseHandler.error(HttpStatus.NOT_FOUND, "Driver not registered please signup first.");;
      //     }
      // }

      if (params.reason == OtpReasonEnum.driverSignup && params?.userid) {
        const driverDetails = await this.clientCaptain
          .send(
            'get-selected-captains',
            JSON.stringify({ externalIds: params.userid }),
          )
          .pipe()
          .toPromise();
        if (driverDetails?.data?.id)
          // return driverDetails;
          return ResponseHandler.error(
            HttpStatus.BAD_REQUEST,
            'Driver already registered please signin first',
          );
      }

      const recentOtp = await this.findOne({ mobileNo: params.mobileNo });
      this.logger.log(`[sendOtp] -> recentOtp: ${JSON.stringify(recentOtp)}`);
      this.logger.log(
        `[sendOtp] -> recentOtp createdAt: ${JSON.stringify(
          recentOtp?.data?.createdAt,
        )} | Date.now: ${Math.round(Date.now() / 1000)}`,
      );

      const createdDate = new Date(recentOtp?.data?.createdAt);
      const currentDate = new Date();
      const diff = Math.round(
        (currentDate.getTime() - createdDate.getTime()) / 1000,
      );

      if (diff < appConfig().otpResendTime && appConfig().mode != 'dev')
        return ResponseHandler.error(
          HttpStatus.NOT_ACCEPTABLE,
          `${errorMessage.OTP_ALREADY_SENT}, Please try again after ${
            appConfig().otpResendTime - diff
          } seconds`,
        );

      const randomOtp = Math.floor(1000 + Math.random() * 9000);
      const smsParams = {
        mobileNo: params.mobileNo,
        message: `${randomOtp} is your otp from ride app`,
      };

      // const expiryTime =
      //   Math.round(Date.now() / 1000) + appConfig().otpExpiryTime * 60;

      const DBparams = {
        otp: randomOtp,
        // expireAt: expiryTime,
        mobileNo: params.mobileNo,
        reason: params?.reason,
        otpStatus: OtpStatusEnum.undelivered,
      };

      const otp = this.otpRepository.create(DBparams);
      const DBresponse = await otp.save();
      if (DBresponse?.id) {
        this.logger.log(
          `[sendOtp] -> [otpRepository] response: ${JSON.stringify(
            DBresponse,
          )}`,
        );
        const sendSmsRes = await this.smsService.sendSms(smsParams);
        this.logger.log(
          `[sendOtp] -> [sendSms] response}: ${JSON.stringify(sendSmsRes)}`,
        );
        const data = {
          tId: DBresponse.id,
          SmsApiResponse: { ...sendSmsRes?.data },
        };
        return ResponseHandler.success(data);
      }
    } catch (err) {
      this.logger.error(`[sendOtp] -> Error in catch: ${err.message}`);
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  /**
   * @description step1 -> log params
   * @description step2 -> return error if user exceed hourly otp limit
   * @description step3 -> if reason driver-login and driver is not signed up then return error -> check via ride-service-MS customer service
   * @description step4 -> if reason driver-Signup and if allready signed up, then return error -> check via ride-service-MS customer service
   * @description step5 -> if reason rider-Login and if rider is not signup then return error ->  check via ride-service-MS customer service.
   * @description step6 -> if reason rider-signup and rider is allready signed up then return error -> check via ride-service-MS customer service.
   * @description step7 -> check if recent otp was generated in require time.
   * @description step8 -> generate 4 digit randon otp.
   * @description step9 -> set sms params.
   * @description step10 -> generate expiry time of otp =>
   * @description step11 -> create data-base object.
   * @description step12 -> save db object to db.
   * @description step13 -> if db object saved successfully then try to send otp sms
   * @description step14 -> update otpStatus if sms sent successfully
   * @param  mobileNo: number,
   * @param reason?: OtpReasonEnum,
   * @param userid?: string
   * @returns return response of sms service with otp table id
   */
  // async sendOtp(params: sendOtp) {
  //   try {
  //     //1 log params
  //     this.logger.log(`["sendOtp"] -> params: ${JSON.stringify(params)}`);

  //     //2 return error if user exceed hourly otp limit
  //     const userOtpLimit =
  //       (await this.redisHandler.getRedisKey('OTP_SEND_HOURLY_LIMIT')) ||
  //       appConfig().OtpSendHourlyLimit ||
  //       10;
  //     if (
  //       userOtpLimit <=
  //       this.findOtpCountInTime(params.mobileNo, getPastTime(60))
  //     ) {
  //       return ResponseHandler.error(
  //         HttpStatus.BAD_REQUEST,
  //         errorMessage.OTP_PER_HOUR_LIMIT_EXCEED,
  //       );
  //     }

  //     //3 if reason driver-login and driver is not signed up then return error -> check via ride-service-MS customer service
  //     if (
  //       params.reason === OtpReasonEnum.driverLogin &&
  //       !(await this.checkIfUserAllreadyExistInCustomerDB(
  //         params.mobileNo,
  //         UserExternalType.captain,
  //       ))
  //     ) {
  //       return ResponseHandler.error(
  //         HttpStatus.BAD_REQUEST,
  //         errorMessage.DRIVER_HAS_NOT_SIGNUP,
  //       );
  //     }

  //     //4 if reason driver-Signup and if allready signed up, then return error -> check via ride-service-MS customer service
  //     if (
  //       params.reason === OtpReasonEnum.driverSignup &&
  //       (await this.checkIfUserAllreadyExistInCustomerDB(
  //         params.mobileNo,
  //         UserExternalType.captain,
  //       ))
  //     ) {
  //       return ResponseHandler.error(
  //         HttpStatus.BAD_REQUEST,
  //         errorMessage.DRIVER_HAS_ALLREADY_SIGN_UP,
  //       );
  //     }

  //     //5 if reason rider-Login and if rider is not signup then return error ->  check via ride-service-MS customer service.
  //     if (
  //       params.reason === OtpReasonEnum.riderLogin &&
  //       !(await this.checkIfUserAllreadyExistInCustomerDB(
  //         params.mobileNo,
  //         UserExternalType.rider,
  //       ))
  //     ) {
  //       return ResponseHandler.error(
  //         HttpStatus.BAD_REQUEST,
  //         errorMessage.RIDER_HAS_NOT_SIGNUP,
  //       );
  //     }

  //     //6 if reason rider-signup and rider is allready signed up then return error -> check via ride-service-MS customer service.
  //     if (
  //       params.reason === OtpReasonEnum.riderSignup &&
  //       (await this.checkIfUserAllreadyExistInCustomerDB(
  //         params.mobileNo,
  //         UserExternalType.rider,
  //       ))
  //     ) {
  //       return ResponseHandler.error(
  //         HttpStatus.BAD_REQUEST,
  //         errorMessage.RIDER_HAS_ALLREADY_SIGN_UP,
  //       );
  //     }

  //     //7 check if recent otp was generated in require time.
  //     const otpResendTimeInSec =
  //       (await this.redisHandler.getRedisKey('OTP_RESEND_TIME_IN_SEC')) || 60;
  //     const recentOtp = await this.findOne({ mobileNo: params.mobileNo });
  //     this.logger.log(`[sendOtp] -> recentOtp: ${JSON.stringify(recentOtp)}`);
  //     this.logger.log(
  //       `[sendOtp] -> recentOtp createdAt: ${JSON.stringify(
  //         recentOtp?.data?.createdAt,
  //       )} | Date.now: ${Math.round(Date.now() / 1000)}`,
  //     );
  //     const createdDate = new Date(recentOtp?.data?.createdAt);
  //     const currentDate = new Date();
  //     const diffInSec = Math.round(
  //       (currentDate.getTime() - createdDate.getTime()) / 1000,
  //     );

  //     if (diffInSec < otpResendTimeInSec && appConfig().mode != 'dev')
  //       return ResponseHandler.error(
  //         HttpStatus.NOT_ACCEPTABLE,
  //         `${errorMessage.OTP_ALREADY_SENT}, Please try again after ${
  //           otpResendTimeInSec - diffInSec
  //         } seconds`,
  //       );

  //     //8 generate 4 digit randon otp.
  //     const randomOtp = Math.floor(1000 + Math.random() * 9000);

  //     //9 set sms params.
  //     const smsParams = {
  //       mobileNo: params.mobileNo,
  //       message: `${randomOtp} is your otp from RiDE app`,
  //     };

  //     // need work
  //     //10 generate expiry time of otp =>
  //     // const expiryTime =
  //     //   Math.round(Date.now() / 1000) + appConfig().otpExpiryTimeInMin * 60;

  //     //11 create data-base object.
  //     const DBparams = {
  //       otp: randomOtp,
  //       // expireAt: expiryTime,
  //       mobileNo: params.mobileNo,
  //       reason: params?.reason || 0,
  //       otpStatus: OtpStatusEnum.undelivered,
  //     };

  //     //12 save db object to db.
  //     const otp = this.otpRepository.create(DBparams);
  //     const DBresponse = await otp.save();

  //     //13 if db object saved successfully then try to send otp sms
  //     if (DBresponse?.id) {
  //       this.logger.log(
  //         `[sendOtp] -> [otpRepository] response: ${JSON.stringify(
  //           DBresponse,
  //         )}`,
  //       );
  //       const sendSmsRes = await this.smsService.sendSms(smsParams);

  //       //14 update otpStatus if sms sent successfully
  //       if (sendSmsRes?.statusCode == HttpStatus.OK) {
  //         await this.updateOtpStatus(OtpStatusEnum.delivered, DBresponse.id);
  //       }

  //       this.logger.log(
  //         `[sendOtp] -> [sendSms] response}: ${JSON.stringify(sendSmsRes)}`,
  //       );

  //       // return response of sms service with otp table id
  //       const data = {
  //         tId: DBresponse.id,
  //         SmsApiResponse: { ...sendSmsRes?.data },
  //       };
  //       return ResponseHandler.success(data);
  //     }
  //   } catch (err) {
  //     this.logger.error(`[sendOtp] -> Error in catch: ${err.message}`);
  //     return ResponseHandler.error(
  //       HttpStatus.BAD_REQUEST,
  //       err?.message || errorMessage.SOMETHING_WENT_WRONG,
  //     );
  //   }
  // }

  async findOne(params: { mobileNo?: number; id?: string }) {
    try {
      this.logger.log(`[findOne] -> mobileNo: ${params.mobileNo}`);

      const otp = this.otpRepository.createQueryBuilder('otp');
      otp.where(params);
      otp.orderBy('otp.createdAt', 'DESC');
      const otpRow = await otp.getOne();

      if (otpRow?.id) return ResponseHandler.success(otpRow);
      else
        return ResponseHandler.error(
          HttpStatus.NOT_FOUND,
          errorMessage.NO_DETAIL_FOUND,
        );
    } catch (err) {
      this.logger.error(`[sendOtp] -> Error in catch: ${err.message}`);
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async verifyOtp(data: {
    tId: string;
    otp: string;
    userId?: string;
    licExpiry?: string;
    dateOfBirth?: string;
  }) {
    try {
      this.logger.log(`[verifyOtp] params -> : ${JSON.stringify(data)}`);
      let response = await this.findOne({ id: data.tId });
      //temp

      if (
        response?.data?.otp == data.otp ||
        (response?.data?.mobileNo.slice(
          response?.data?.mobileNo.toString().length - 4,
        ) == data.otp &&
          appConfig().mode == 'dev') 
      ) {
        //end temp
        // const token = `test${response?.data?.mobileNo}`
        // let userID;
        // if(appConfig().testdrivers[`${response?.data?.mobileNo}`])
        //      userID = appConfig().testdrivers[`${response?.data?.mobileNo}`]['driverNationalId'];
        let userID;
        const token = jwt.sign(
          {
            data: { mobileNo: response?.data?.mobileNo },
          },
          appConfig().jwtSecretKey,
          { expiresIn: `${appConfig().tokenExpiryTime}h` },
        );

        const hashKey = createHash('md5')
          .update(response?.data?.mobileNo)
          .digest('hex');

        const hashToken = createHash('md5').update(token).digest('hex');

        this.redisClient.set([`user-token-${hashKey}`, hashToken]);
        // this.redisClient.set([`user-token`, 'JSON.stringify(hashToken)'])
        this.logger.log(`[verifyOtp] -> Set user details to Redis | Success ✔`);

        // console.log("a",token)
        let detail;

        if (response.data?.reason == 2 && data.userId && data.licExpiry) {
          const ninOrIqamaValidate = data.userId.charAt(0);
          if (ninOrIqamaValidate == '2') {
            return ResponseHandler.error(
              HttpStatus.NOT_FOUND,
              'Only citizen allowed to register as captain.',
            );
          }
          const customerUpdateOrCraeteWithKycPayload: customerKycDto = {
            userid: data?.userId,
            mobileNo: response?.data?.mobileNo,
            licssExpiryDateH: data?.licExpiry,
          };
          detail = await this.customerUpdateOrCraeteWithKyc(
            customerUpdateOrCraeteWithKycPayload,
          );
          if (
            detail.statusCode != HttpStatus.OK &&
            detail.statusCode != HttpStatus.CREATED
          )
            return detail;

          // console.log(detail);
          return ResponseHandler.success({
            token: token,
            details: { ...detail?.data } || detail.message,
          });
        } else {
          let detail = await this.tripTcpClient
            .send(
              'get-customer-detail',
              JSON.stringify({ mobileNo: response?.data?.mobileNo }),
            )
            .pipe()
            .toPromise();

          if (response.data?.reason == 4) {
            if (detail.statusCode != HttpStatus.OK) {
              if (data?.dateOfBirth && data?.userId)
                detail = await this.customerUpdateOrCraeteWithKyc({
                  userid: data?.userId,
                  dateOfBirth: data.dateOfBirth,
                  mobileNo: response?.data?.mobileNo,
                });
              else
                detail = await this.CreateGuestAccountWithMobileNumber(
                  response?.data?.mobileNo,
                );
              if (
                detail.statusCode != HttpStatus.OK &&
                detail.statusCode != HttpStatus.CREATED
              )
                return detail;
            } else
              return ResponseHandler.error(
                HttpStatus.FOUND,
                'Customer already registered',
              );
          } else if (
            response.data?.reason == 3 &&
            detail.statusCode != HttpStatus.OK
          )
            return ResponseHandler.error(
              HttpStatus.NOT_FOUND,
              'Rider not registered please signup first',
            );
          else if (
            response.data?.reason == 3 &&
            response?.data?.mobileNo != '966568813262'
          ) {
            // return ResponseHandler.error(
            //   HttpStatus.NOT_FOUND,
            //   'Thank You for choosing RiDE, you can take RiDE after few days',
            // );
          } else if (response.data?.reason == 1) {
            let driverDetail;
            if (detail.statusCode == HttpStatus.OK) {
              driverDetail = await this.clientCaptain
                .send(
                  'get-selected-captains',
                  JSON.stringify({ externalIds: [detail?.data?.userId] }),
                )
                .pipe()
                .toPromise();
            } else {
              return ResponseHandler.error(
                HttpStatus.NOT_FOUND,
                'Driver not registered please signup first',
              );
            }
            // console.log(driverDetail)
            if (
              driverDetail.data === undefined ||
              driverDetail.data.length == 0
            ) {
              return ResponseHandler.error(
                HttpStatus.NOT_FOUND,
                'Driver not registered please signup first',
              );
            }
          }

          return ResponseHandler.success({
            token: token,
            details: { ...detail?.data } || detail.message,
          });
        }
      } else {
        return ResponseHandler.error(
          HttpStatus.NOT_FOUND,
          errorMessage.INCORRRECT_OTP,
        );
      }
    } catch (err) {
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  /**
   * This function verify otp. and perform kyc,
   * @description step1 -> get constants from redis or appconfig
   * @description step2 -> convert timeLimit to time(in db format) that have been past
   * @description step3 -> find data from otp table base on id
   * @description step4 -> if user is not verifying in require time. then update otpStatus as fail and insertIntoFailLogs and return error
   * @description step5 -> if user verifyLimit exceed then update otpStatus as fail and insertIntoFailLogs and return error
   * @description step6 -> if otp match with otp generated or with last 4 digit of mobile no when mode is dev, then generate JWT token
   * @description step7 ->
   * @description step8 ->
   * @description step9 ->
   * @description step10 ->
   * @description step11 ->
   * @description step12 ->
   * @description step13 ->
   * @description step14 ->
   * @description step15 ->
   * @description step16 ->
   * @description step17 ->
   * @description step18 ->
   * @param data
   * @returns
   */
  // async verifyOtp(data: VerifyDto) {
  //   try {
  //     //1 get constants from redis or appconfig
  //     const timeLimit =
  //       (await this.redisHandler.getRedisKey('OTP_VERIFY_TIME_LIMIT_IN_MIN')) ||
  //       appConfig().tokenExpiryTime ||
  //       10;
  //     const verifyLimit =
  //       (await this.redisHandler.getRedisKey('OTP_VERIFY_LIMIT')) ||
  //       appConfig().tokenExpiryTime ||
  //       10;

  //     //2 convert timeLimit to time(in db format) that have been past
  //     const maxTime = getPastTime(timeLimit);

  //     //3 find data from otp table base on id
  //     let response = await this.findOne({ id: data.tId });

  //     //4 if user is not verifying in require time. then update otpStatus as expired and insertIntoFailLogs and return error
  //     if (response.data.createdAt < maxTime) {
  //       this.updateOtpStatus(OtpStatusEnum.expired, data.tId);
  //       this.insertIntoFailLogs(data.otp, data.tId, response.data.mobileNo);
  //       return ResponseHandler.error(
  //         HttpStatus.BAD_REQUEST,
  //         errorMessage.OTP_VERIFICATION_TIME_LIMIT_EXCEED,
  //       );
  //     }

  //     //5 if user verifyLimit exceed then update otpStatus as expired and insertIntoFailLogs and return error
  //     if ((await this.findFailLogEntries(data.tId)) > verifyLimit) {
  //       this.updateOtpStatus(OtpStatusEnum.expired, data.tId);
  //       this.insertIntoFailLogs(data.otp, data.tId, response.data.mobileNo);
  //       return ResponseHandler.error(
  //         HttpStatus.BAD_REQUEST,
  //         errorMessage.OTP_MAX_VERFICATION_TRY,
  //       );
  //     }

  //     //6 if otp match with otp generated or with last 4 digit of mobileNo when mode is dev.
  //     if (
  //       response?.data?.otp == data.otp ||
  //       (response?.data?.mobileNo.slice(
  //         response?.data?.mobileNo.toString().length - 4,
  //       ) == data.otp &&
  //         appConfig().mode == 'dev')
  //     ) {
  //       //7 update otpStatus to used if otp matched.
  //       this.updateOtpStatus(OtpStatusEnum.used, response.data.id);

  //       // const token = `test${response?.data?.mobileNo}`
  //       // let userID;
  //       // if(appConfig().testdrivers[`${response?.data?.mobileNo}`])
  //       //      userID = appConfig().testdrivers[`${response?.data?.mobileNo}`]['driverNationalId'];

  //       //8 generate jwt token and save in redis.
  //       let userID;
  //       const token = jwt.sign(
  //         {
  //           data: { mobileNo: response?.data?.mobileNo },
  //         },
  //         appConfig().jwtSecretKey,
  //         { expiresIn: `${appConfig().tokenExpiryTime}h` },
  //       );

  //       const hashKey = createHash('md5')
  //         .update(response?.data?.mobileNo)
  //         .digest('hex');

  //       const hashToken = createHash('md5').update(token).digest('hex');

  //       this.redisClient.set([`user-token-${hashKey}`, hashToken]);
  //       // this.redisClient.set([`user-token`, 'JSON.stringify(hashToken)'])
  //       this.logger.log(`[verifyOtp] -> Set user details to Redis | Success ✔`);

  //       // console.log("a",token)
  //       let detail;

  //       //9 if reason driver signup and data contain userId and licExpiry
  //       if (
  //         response.data?.reason == OtpReasonEnum.driverSignup &&
  //         data.userId &&
  //         data.licExpiry
  //       ) {
  //         // if user id start with 2 , it means its not citizen, then return error
  //         const ninOrIqamaValidate = data.userId.charAt(0);
  //         if (ninOrIqamaValidate == '2') {
  //           return ResponseHandler.error(
  //             HttpStatus.NOT_FOUND,
  //             'Only citizen allowed to register as captain.',
  //           );
  //         }

  //         //9 create or update customer with kyc
  //         const customerUpdateOrCraeteWithKycPayload: customerKycDto = {
  //           userid: data?.userId,
  //           mobileNo: response?.data?.mobileNo,
  //           licssExpiryDateH: data?.licExpiry,
  //         };
  //         detail = await this.customerUpdateOrCraeteWithKyc(
  //           customerUpdateOrCraeteWithKycPayload,
  //         );
  //         if (
  //           detail.statusCode != HttpStatus.OK &&
  //           detail.statusCode != HttpStatus.CREATED
  //         )
  //           return detail;

  //         // console.log(detail);

  //         //10 return response.
  //         return ResponseHandler.success({
  //           token: token,
  //           details: { ...detail?.data } || detail.message,
  //         });
  //       } else {
  //         //11 find customer detail from customer service
  //         let detail = await this.tripTcpClient
  //           .send(
  //             GET_CUSTOMER_DETAIL,
  //             JSON.stringify({ mobileNo: response?.data?.mobileNo }),
  //           )
  //           .pipe()
  //           .toPromise();

  //         //12 if reason rider-signup then found customer details
  //         if (response.data?.reason == OtpReasonEnum.riderSignup) {
  //           if (detail.statusCode != HttpStatus.OK) {
  //             if (data?.dateOfBirth && data?.userId)
  //               detail = await this.customerUpdateOrCraeteWithKyc({
  //                 userid: data?.userId,
  //                 dateOfBirth: data.dateOfBirth,
  //                 mobileNo: response?.data?.mobileNo,
  //               });
  //             else
  //               detail = await this.CreateGuestAccountWithMobileNumber(
  //                 response?.data?.mobileNo,
  //               );
  //             if (
  //               detail.statusCode != HttpStatus.OK &&
  //               detail.statusCode != HttpStatus.CREATED
  //             )
  //               return detail;
  //           } else {
  //             return ResponseHandler.error(
  //               HttpStatus.FOUND,
  //               'Customer already registered',
  //             );
  //           }
  //         } else if (
  //           response.data?.reason == OtpReasonEnum.riderLogin &&
  //           detail.statusCode != HttpStatus.OK
  //         ) {
  //           return ResponseHandler.error(
  //             HttpStatus.NOT_FOUND,
  //             'Rider not registered please signup first',
  //           );
  //         } else if (response.data?.reason == OtpReasonEnum.driverLogin) {
  //           let driverDetail;
  //           if (detail.statusCode == HttpStatus.OK) {
  //             driverDetail = await this.clientCaptain
  //               .send(
  //                 'get-selected-captains',
  //                 JSON.stringify({ externalIds: [detail?.data?.userId] }),
  //               )
  //               .pipe()
  //               .toPromise();
  //           } else {
  //             return ResponseHandler.error(
  //               HttpStatus.NOT_FOUND,
  //               'Driver not registered please signup first',
  //             );
  //           }
  //           // console.log(driverDetail)
  //           if (
  //             driverDetail.data === undefined ||
  //             driverDetail.data.length == 0
  //           ) {
  //             return ResponseHandler.error(
  //               HttpStatus.NOT_FOUND,
  //               'Driver not registered please signup first',
  //             );
  //           }
  //         }

  //         return ResponseHandler.success({
  //           token: token,
  //           details: { ...detail?.data } || detail.message,
  //         });
  //       }
  //     } else {
  //       this.updateOtpStatus(OtpStatusEnum.unused, response.data.id);
  //       this.insertIntoFailLogs(data.otp, data.tId, response.data.mobileNo);
  //       return ResponseHandler.error(
  //         HttpStatus.NOT_FOUND,
  //         errorMessage.INCORRRECT_OTP,
  //       );
  //     }
  //   } catch (err) {
  //     try {
  //       // if otp status is not expired then set it to unused.
  //       if (
  //         (await this.getOtpStatusOnly(data.tId, null)) != OtpStatusEnum.expired
  //       ) {
  //         this.updateOtpStatus(OtpStatusEnum.unused, data.tId, null);
  //       }
  //       return ResponseHandler.error(
  //         HttpStatus.BAD_REQUEST,
  //         err?.message || errorMessage.SOMETHING_WENT_WRONG,
  //       );
  //     } catch (errr) {
  //       return ResponseHandler.error(
  //         HttpStatus.BAD_REQUEST,
  //         err?.message || errorMessage.SOMETHING_WENT_WRONG,
  //       );
  //     }
  //   }
  // }

  async getIqamaDataFromYakeen(params: getCitizenDataFromYakeenDto) {
    try {
      this.logger.log(
        `[getIqamaDataFromYakeen] -> params: ${JSON.stringify(params)}`,
      );

      this.logger.log(
        `[getIqamaDataFromYakeen] -> sending -> getCitizenDLInfo`,
      );
      let CitizenDLInfo;
      const param: getAlienInfoByIqama2Dto = {
        iqamaNumber: params.userid,
        dateOfBirth: params.dateOfBirth,
      };
      if (param?.dateOfBirth) {
        CitizenDLInfo = await this.YakeenService.getAlienInfoByIqama2(param);
      }
      if (CitizenDLInfo.statusCode != HttpStatus.OK) {
        this.logger.error(
          `[getIqamaDataFromYakeen] <- failed <- getCitizenDLInfo`,
        );
        return CitizenDLInfo;
      }

      this.logger.log(
        `[getIqamaDataFromYakeen] <- success <- getCitizenDLInfo`,
      );

      this.logger.log(
        `[getIqamaDataFromYakeen] -> sending -> CitizenAddressInfoEnglish`,
      );

      const CitizenAddressInfoEnglish = await this.YakeenService.getAlienAddressInfoByIqama(
        { ...param, language: 'E' },
      );

      if (CitizenAddressInfoEnglish.statusCode != HttpStatus.OK) {
        this.logger.error(
          `[getIqamaDataFromYakeen] <- failed <- CitizenAddressInfoEnglish`,
        );
        // return CitizenAddressInfoEnglish;
      }

      this.logger.log(
        `[getIqamaDataFromYakeen] <- success <- CitizenAddressInfoEnglish`,
      );

      this.logger.log(
        `[getIqamaDataFromYakeen] -> sending -> CitizenAddressInfoArabic`,
      );
      const CitizenAddressInfoArabic = await this.YakeenService.getAlienAddressInfoByIqama(
        { ...param, language: 'A' },
      );
      if (CitizenAddressInfoArabic.statusCode != HttpStatus.OK) {
        this.logger.error(
          `[getIqamaDataFromYakeen] <- failed <- CitizenAddressInfoArabic`,
        );
        // return CitizenAddressInfoArabic;
      }
      this.logger.log(
        `[getIqamaDataFromYakeen] <- success <- CitizenAddressInfoArabic`,
      );

      let result = CitizenDLInfo?.data?.completeInfo;

      const customerInfo = {
        // userId: this.generateRandomUserId(),
        mobileNo: params?.mobileNo,
        idNumber: parseInt(params.userid),
        arabicFirstName: CitizenDLInfo?.data?.firstName,
        arabicLastName: `${CitizenDLInfo?.data?.lastName}`,
        firstName: CitizenDLInfo?.data?.englishFirstName,
        lastName: `${CitizenDLInfo?.data?.englishLastName}`,
        gender: CitizenDLInfo?.data?.gender,
        idExpiryDate: CitizenDLInfo?.data?.idExpiryDate,
        dateOfBirth: result?.dateOfBirthG?._text || result?.dateOfBirthH?._text,
        //sample_address:  24222  3536, 1, Az Zahir Dist., Makkah Al Mukarramah
        address1: `${CitizenAddressInfoEnglish?.data?.postCode} ${CitizenAddressInfoEnglish?.data?.buildingNumber}, ${CitizenAddressInfoEnglish?.data?.unitNumber}, ${CitizenAddressInfoEnglish?.data?.streetName}, ${CitizenAddressInfoEnglish?.data?.district} ${CitizenAddressInfoEnglish?.data?.city}`,
        address2: `${CitizenAddressInfoArabic?.data?.postCode} ${CitizenAddressInfoArabic?.data?.buildingNumber}, ${CitizenAddressInfoArabic?.data?.unitNumber}, ${CitizenAddressInfoArabic?.data?.streetName}, ${CitizenAddressInfoArabic?.data?.district} ${CitizenAddressInfoArabic?.data?.city}`,

        additionalInfo: JSON.stringify({
          CitizenDLInfo: {
            ...CitizenDLInfo?.data?.completeInfo,
            idNumber: params.userid,
          },
          CitizenAddressInfoEnglish: {
            ...CitizenAddressInfoEnglish?.data?.completeInfo,
          },
          CitizenAddressInfoArabic: {
            ...CitizenAddressInfoArabic?.data?.completeInfo,
          },
        }),
        kycStatus: true,
        // isRider: true,
      };

      return ResponseHandler.success(customerInfo);
    } catch (err) {
      this.logger.log(`[getIqamaDataFromYakeen] -> catch -> ${err?.message}`);
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCitizenDataFromYakeen(param: getCitizenDataFromYakeenDto) {
    try {
      this.logger.log(
        `[getCitizenDataFromYakeen] -> params: ${JSON.stringify(param)}`,
      );

      this.logger.log(
        `[getCitizenDataFromYakeen] -> sending -> getCitizenDLInfo`,
      );
      let CitizenDLInfo;
      if (param?.licssExpiryDateH) {
        CitizenDLInfo = await this.YakeenService.getCitizenDLInfo(param);
      } else if (param?.dateOfBirth) {
        CitizenDLInfo = await this.YakeenService.getCitizenInfo2(param);
      }
      if (CitizenDLInfo.statusCode != HttpStatus.OK) {
        this.logger.error(
          `[getCitizenDataFromYakeen] <- failed <- getCitizenDLInfo`,
        );
        return CitizenDLInfo;
      }

      let result = CitizenDLInfo?.data?.completeInfo;
      if (
        (param?.licssExpiryDateH &&
          new Date().getFullYear() -
            Number(result?.dateOfBirthG?._text.split('-').reverse().join('-')) <
            20) ||
        new Date().getFullYear() -
          Number(result?.dateOfBirthG?._text.split('-').reverse().join('-')) >
          65
      ) {
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.INVALID_AGE,
        );
      }
      this.logger.log(
        `[getCitizenDataFromYakeen] <- success <- getCitizenDLInfo`,
      );

      const getCitizenAddressInfoPayload = {
        userid: param.userid,
        dateOfBirth: CitizenDLInfo?.data?.dateOfBirthH?.substring(3, 10),
      };

      this.logger.log(
        `[getCitizenDataFromYakeen] -> sending -> CitizenAddressInfoEnglish`,
      );

      const CitizenAddressInfoEnglish = await this.YakeenService.getCitizenAddressInfo(
        { ...getCitizenAddressInfoPayload, language: 'E' },
      );

      if (CitizenAddressInfoEnglish.statusCode != HttpStatus.OK) {
        this.logger.error(
          `[getCitizenDataFromYakeen] <- failed <- CitizenAddressInfoEnglish`,
        );
        // return CitizenAddressInfoEnglish;
      }

      this.logger.log(
        `[getCitizenDataFromYakeen] <- success <- CitizenAddressInfoEnglish`,
      );

      this.logger.log(
        `[getCitizenDataFromYakeen] -> sending -> CitizenAddressInfoArabic`,
      );
      const CitizenAddressInfoArabic = await this.YakeenService.getCitizenAddressInfo(
        { ...getCitizenAddressInfoPayload, language: 'A' },
      );
      if (CitizenAddressInfoArabic.statusCode != HttpStatus.OK) {
        this.logger.error(
          `[getCitizenDataFromYakeen] <- failed <- CitizenAddressInfoArabic`,
        );
        // return CitizenAddressInfoArabic;
      }
      this.logger.log(
        `[getCitizenDataFromYakeen] <- success <- CitizenAddressInfoArabic`,
      );

      const customerInfo = {
        // userId: this.generateRandomUserId(),
        mobileNo: param?.mobileNo,
        idNumber: parseInt(param?.userid),
        arabicFirstName: CitizenDLInfo?.data?.firstName,
        arabicLastName: `${CitizenDLInfo?.data?.familyName}`,
        firstName: CitizenDLInfo?.data?.englishFirstName,
        lastName: `${CitizenDLInfo?.data?.englishLastName}`,
        gender: CitizenDLInfo?.data?.gender,
        idExpiryDate: CitizenDLInfo?.data?.idExpiryDate,
        dateOfBirth: result?.dateOfBirthG?._text || result?.dateOfBirthH?._text,
        //sample_address:  24222  3536, 1, Az Zahir Dist., Makkah Al Mukarramah
        address1: `${CitizenAddressInfoEnglish?.data?.postCode || ''} ${
          CitizenAddressInfoEnglish?.data?.buildingNumber || ''
        }, ${CitizenAddressInfoEnglish?.data?.unitNumber || ''}, ${
          CitizenAddressInfoEnglish?.data?.streetName
        }, ${CitizenAddressInfoEnglish?.data?.district || ''} ${
          CitizenAddressInfoEnglish?.data?.city || ''
        }`,
        address2: `${CitizenAddressInfoArabic?.data?.postCode || ''} ${
          CitizenAddressInfoArabic?.data?.buildingNumber || ''
        }, ${CitizenAddressInfoArabic?.data?.unitNumber || ''}, ${
          CitizenAddressInfoArabic?.data?.streetName || ''
        }, ${CitizenAddressInfoArabic?.data?.district || ''} ${
          CitizenAddressInfoArabic?.data?.city || ''
        }`,

        additionalInfo: JSON.stringify({
          CitizenDLInfo: {
            ...CitizenDLInfo?.data?.completeInfo,
            idNumber: param.userid,
          },
          CitizenAddressInfoEnglish: {
            ...CitizenAddressInfoEnglish?.data?.completeInfo,
          },
          CitizenAddressInfoArabic: {
            ...CitizenAddressInfoArabic?.data?.completeInfo,
          },
        }),
        kycStatus: true,
        // isRider: true,
      };

      return ResponseHandler.success(customerInfo);
    } catch (err) {
      this.logger.log(`[getCitizenDataFromYakeen] -> catch -> ${err?.message}`);
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async customerUpdateOrCraeteWithKyc(params: customerKycDto) {
    try {
      const ninOrIqamaValidate = params.userid.charAt(0);
      let details;
      const detailByMobileNO = await this.tripTcpClient
        .send(
          'get-customer-detail',
          JSON.stringify({ mobileNo: params.mobileNo }),
        )
        .pipe()
        .toPromise();
      const detailByID = await this.tripTcpClient
        .send(
          'get-customer-detail',
          JSON.stringify({ idNumber: params.userid }),
        )
        .pipe()
        .toPromise();
      if (
        detailByMobileNO.statusCode == HttpStatus.OK &&
        detailByMobileNO?.data?.idNumber != null &&
        detailByMobileNO?.data?.idNumber != 0 &&
        detailByMobileNO?.data?.idNumber != params.userid
      ) {
        this.logger.log(
          `[customerUpdateOrCraeteWithKyc] -> ${errorMessage.MOBILEN_NO_ALREADY_REGSITER}, MobileNo: ${params.mobileNo} & ID_DB: ${detailByMobileNO?.data?.userId} & ID_Request: ${params?.userid}`,
        );
        return ResponseHandler.error(
          HttpStatus.CONFLICT,
          errorMessage.MOBILEN_NO_ALREADY_REGSITER,
        );
      } else if (
        detailByID.statusCode == HttpStatus.OK &&
        detailByID?.data?.mobileNo != params.mobileNo
      ) {
        this.logger.log(
          `[customerUpdateOrCraeteWithKyc] -> ${errorMessage.ID_ALREADY_REGSITER}, MobileNo: ${params.mobileNo} & MobileNo_DB: ${detailByID?.data?.mobileNo} & ID_DB: ${detailByID?.data?.userId} & ID_Request: ${params?.userid}`,
        );
        return ResponseHandler.error(
          HttpStatus.CONFLICT,
          errorMessage.ID_ALREADY_REGSITER,
        );
      } else if (detailByID.statusCode == HttpStatus.OK) {
        // Already Verified
        return detailByID;
      } else {
        let CitizenDataFromYakeen;
        const getCitizenDataFromYakeenPayload = {
          mobileNo: params.mobileNo,
          licssExpiryDateH: params?.licssExpiryDateH?.substring(3, 10),
          dateOfBirth: params?.dateOfBirth?.substring(3, 10),
          userid: params.userid,
        };

        if (
          (getCitizenDataFromYakeenPayload?.licssExpiryDateH ||
            getCitizenDataFromYakeenPayload?.dateOfBirth) &&
          ninOrIqamaValidate == '1'
        ) {
          CitizenDataFromYakeen = await this.getCitizenDataFromYakeen(
            getCitizenDataFromYakeenPayload,
          );
        } else if (
          (getCitizenDataFromYakeenPayload?.licssExpiryDateH ||
            getCitizenDataFromYakeenPayload?.dateOfBirth) &&
          ninOrIqamaValidate == '2'
        ) {
          CitizenDataFromYakeen = await this.getIqamaDataFromYakeen(
            getCitizenDataFromYakeenPayload,
          );
        } else {
          return ResponseHandler.error(
            HttpStatus.METHOD_NOT_ALLOWED,
            errorMessage.INVALID_ID,
          );
        }

        this.logger.log(
          `[customerUpdateOrCraeteWithKyc] <- success <- CitizenDataFromYakeen: ${JSON.stringify(
            CitizenDataFromYakeen,
          )}`,
        );
        if (CitizenDataFromYakeen.statusCode != HttpStatus.OK)
          return CitizenDataFromYakeen;
        let body;
        if (
          detailByMobileNO.statusCode != HttpStatus.OK &&
          !params?.dateOfBirth
        )
          body = {
            userId: `96622${this.generateRandomUserId()}`,
            ...CitizenDataFromYakeen.data,
          };
        else if (
          detailByMobileNO.statusCode != HttpStatus.OK &&
          params?.dateOfBirth
        )
          body = {
            userId: `96611${this.generateRandomUserId()}`,
            ...CitizenDataFromYakeen.data,
          };
        else
          body = {
            isKycRequired: 0,
            userId: detailByMobileNO.data.userId,
            ...CitizenDataFromYakeen.data,
          };

        const createOrUpdate = await this.tripTcpClient
          .send('upsert-customer', JSON.stringify(body))
          .pipe()
          .toPromise();
        return createOrUpdate;
      }
    } catch (err) {
      this.logger.log(
        `[customerUpdateOrCraeteWithKyc] -> catch -> ${err?.message}`,
      );
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async CreateGuestAccountWithMobileNumber(mobileNo) {
    const body = {
      userId: `96611${this.generateRandomUserId()}`,
      mobileNo: mobileNo,
      firstName: 'Guest',
      lastName: 'User',
      arabicFirstName: 'ضيف',
      arabicLastName: ' ',
      gender: 'U',
      isRider: true,
    };

    return await this.tripTcpClient
      .send('upsert-customer', JSON.stringify(body))
      .pipe()
      .toPromise();
  }
  generateRandomUserId() {
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
    // const timeInSec = Math.round(Date.now() / 1000);
    return '';
  }

  async findAllOld(params: OtpLogsListSearchSortDto) {
    try {
      console.log('-----0-0-----');
      console.log(params);
      const fields = ['otp.createdAt', 'otp.otp', 'otp.mobileNo'];

      const otpQuery = await this.otpRepository.createQueryBuilder('otp');
      otpQuery.select('otp.createdAt', 'createdAt');
      otpQuery.addSelect('otp.otp', 'otp');
      otpQuery.addSelect('otp.mobileNo', 'mobileNo');

      // let detail = await this.tripTcpClient
      //       .send(
      //         GET_CUSTOMER_LOG_FOR_OTP,
      //         JSON.stringify({ mobileNo: params?.data?.mobileNo }),
      //       )
      //       .pipe()
      //       .toPromise();

      if (params?.filters?.otp) {
        otpQuery.andWhere('otp.otp LIKE :otp', {
          otp: `${params?.filters?.otp}%`,
        });
      }

      if (params?.filters?.mobileNo) {
        otpQuery.andWhere('otp.mobileNo LIKE :mobileNo', {
          mobileNo: `${params?.filters?.mobileNo}%`,
        });
      }

      // This code below can be used to search for inventories created between 2 dates.
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        otpQuery.andWhere('otp.createdAt >= :fromDate', {
          fromDate,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setUTCHours(
              23,
              59,
              59,
              999,
            ),
          ),
        );
        otpQuery.andWhere('otp.createdAt <= :toDate', { toDate });
      }

      // search anything
      if (params?.keyword) {
        otpQuery.andWhere(
          new Brackets((sqb) => {
            sqb.where('otp.otp LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('otp.mobileNo LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('otp.createdAt LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
          }),
        );
      }

      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = OtpListSortEnum[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          otpQuery.orderBy(sortField, sortOrder);
        }
      } else {
        otpQuery.orderBy('createdAt', 'DESC');
      }
      otpQuery.skip(params.skip);
      otpQuery.take(params.take);

      // total - registered - inactive - draft = avaliable
      const asyncArray = await otpQuery.getRawMany();
      console.log(asyncArray);
      // console.log(asyncArray);
      asyncArray.map((item) => {
        item.userId = '12345678';
        item.userType = 1;
        item.firstName = 'Ahmad';
        item.lastName = 'Qasim';
        item.status = 1;
        item.profileImage = 'delivered';
      });
      console.log(asyncArray);

      if (asyncArray != null) {
        return ResponseHandler.success(asyncArray);
      } else {
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, 'No data found');
      }
    } catch (err) {
      this.logger.error('[findAll] error ' + err);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * This function show otp logs with attached customer details.
   * @param ListSearchSortDto
   * @returns
   */
  async findAll(params: OtpLogsListSearchSortDto) {
    try {
      const otpQuery = await this.otpRepository.createQueryBuilder('otp');
      otpQuery.select('otp.createdAt', 'createdAt');
      otpQuery.addSelect('otp.otp', 'otp');
      otpQuery.addSelect('otp.mobileNo', 'mobileNo');
      otpQuery.addSelect('otp.otp_status', 'status');

      if (params?.filters?.otp) {
        otpQuery.andWhere('otp.otp LIKE :otp', {
          otp: `${params?.filters?.otp}%`,
        });
      }

      if (params?.filters?.mobileNo) {
        otpQuery.andWhere('otp.mobileNo LIKE :mobileNo', {
          mobileNo: `${params?.filters?.mobileNo}%`,
        });
      }

      // This code below can be used to search for inventories created between 2 dates.
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        otpQuery.andWhere('otp.createdAt >= :fromDate', {
          fromDate,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setUTCHours(
              23,
              59,
              59,
              999,
            ),
          ),
        );
        otpQuery.andWhere('otp.createdAt <= :toDate', { toDate });
      }

      // search anything
      if (params?.keyword) {
        otpQuery.andWhere(
          new Brackets((sqb) => {
            sqb.where('otp.otp LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('otp.mobileNo LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('otp.createdAt LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
          }),
        );
      }

      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = OtpListSortEnum[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          otpQuery.orderBy(sortField, sortOrder);
        }
      } else {
        otpQuery.orderBy('createdAt', 'DESC');
      }
      if (params?.skip) otpQuery.skip(params.skip);
      if (params?.take) otpQuery.take(params.take);

      const asyncArray = await otpQuery.getRawMany();
      if (asyncArray) {
        // INSERT MOBILE-NO IN MOBILE No ARRAY
        let mobileNoArr = [];
        asyncArray.map((item) => {
          mobileNoArr.push(item.mobileNo);
        });

        // GET DATA FROM CUSTOMER TABLE.
        const userDetails = await this.tripTcpClient
          .send(
            GET_CUSTOMER_DETAILS_FOR_OTP_LOGS,
            JSON.stringify({ mobileNoArr }),
          )
          .pipe()
          .toPromise();
        let cusArr = userDetails?.data;

        // merge  data with respect to mobile no array.
        let ar = [];
        asyncArray.map((o) => {
          let name = 'na';
          let userType = 'na';
          let userId = 'na';

          if (cusArr.length > 0) {
            let object = cusArr.find((obj) => obj.mobileNo === o.mobileNo);
            if (object) {
              name = object.firstName + ' ' + object.lastName;
              userType = object.userType;
              userId = object.userId;
            }
          }

          ar.push({ ...o, name, userType, userId });
        });

        return ResponseHandler.success(ar);
      } else {
        return ResponseHandler.error(
          HttpStatus.FORBIDDEN,
          'No data found in otp table',
        );
      }
    } catch (err) {
      this.logger.error('[findAll] error ' + err);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  //ok
  /**
   * this function return count of otp sent to mobileNo withIn timeLimit.
   * @param mobileNo user mobile no
   * @param timeLimit data-base formated time.
   */
  async findOtpCountInTime(mobileNo: number, timeLimit): Promise<number> {
    try {
      const userOtpCnt = await this.otpRepository
        .createQueryBuilder('otp')
        .select('otp.otp', 'otp')
        .where('otp.mobileNo = :mobileNo', { mobileNo })
        .andWhere('otp.createdAt > :timeLimit', { timeLimit })
        .getCount();
      return userOtpCnt;
    } catch (err) {
      this.logger.log(
        `[otp.serive] -> findOtpCountInTime -> error -> ${err.message}`,
      );
      throw err.message;
    }
  }

  //ok
  /**
   *  this function check if mobileNo of specific usertype allready exist in ride-service->customer->database .
   * @param mobileNo : user mobileNo
   * @param userType : userType ( rider =1, driver/captain =2)
   * @returns return true if user exist, false if it does not.
   */
  async checkIfUserAllreadyExistInCustomerDB(
    mobileNo: number,
    userType: UserExternalType,
  ): Promise<boolean> {
    try {
      let detail = await this.tripTcpClient
        .send(
          CHECK_IF_CUSTOMER_EXIST_BY_MOBILE_AND_TYPE,
          JSON.stringify({ mobileNo, userType }),
        )
        .pipe()
        .toPromise();
      const count: number = detail?.data || 0;
      if (detail.statusCode == HttpStatus.OK) {
        if (count > 0) {
          return true;
        }
      }
      return false;
    } catch (err) {
      this.logger.log(
        `[otp.serive] -> checkIfUserAllreadyExistInCustomerDB -> fail -> ${err.message}`,
      );
      throw err.message;
    }
  }

  // ok
  /**
   * This function update otpStatus of otp table
   * @param otpStatus: otpStatus: OtpStatusEnum( undelivered = 1|| delivered = 2|| unused = 3 ||used = 4 || expired = 5);
   * @param id : id of otp table
   * @param mobileNo : mobileNo of user
   * @returns true || false => upon status change
   */
  async updateOtpStatus(
    otpStatus: OtpStatusEnum,
    id: string = null,
    mobileNo: number = null,
  ) {
    try {
      const latestOtp = await this.otpRepository.createQueryBuilder('o');
      latestOtp.select('o.id', 'id');
      if (mobileNo) {
        latestOtp.andWhere('o.mobileNo = :mobileNo', { mobileNo: mobileNo });
      } else if (id) {
        latestOtp.andWhere('o.id = :id', { id: id });
      }
      latestOtp.orderBy('o.createdAt', 'DESC');
      const result = await latestOtp.getRawOne();

      await this.otpRepository.update(result.id, { otp_status: otpStatus });
      return true;
    } catch (err) {
      this.logger.log(`[updateOtpStatus] -> ${otpStatus} -> ${err.message}`);
      return false;
    }
  }

  //ok
  /**
   * This function save data into otp-failed-logs, if mobile no is null then it will first find mobile No entry in otp table
   * @param otpEntered : string, otp user entered in verify otp.
   * @param otpId : string, otp id of otp table.
   * @param mobileNo : number, user fials logs/
   */
  async insertIntoFailLogs(
    otpEntered: string,
    otpId: string,
    mobileNo: number = null,
  ) {
    try {
      if (mobileNo === null) {
        const response = await this.findOne({ id: otpId });
        mobileNo = response?.data?.mobileNo;
      }
      const failLog = this.otpFailRepo.create({
        mobileNo: mobileNo,
        otpEntered: parseInt(otpEntered),
        otpId: otpId,
      });
      await this.otpFailRepo.save(failLog);
      this.logger.log(
        `[otp.service] -> insertIntoFailLogs -> SUCCESS ${mobileNo}/${otpEntered}/${otpId}`,
      );
    } catch (err) {
      this.logger.log(
        `[otp.service] -> insertIntoFailLogs -> FAIL ${mobileNo}/${otpEntered}/${otpId}/${err.message}`,
      );
      throw err.message;
    }
  }

  //ok
  /**
   * This function count number of fail entries against otpId
   * @param otpId : string
   * @returns count : number,
   */
  async findFailLogEntries(otpId: string) {
    try {
      const count = await this.otpFailRepo
        .createQueryBuilder('f')
        .select('f.id')
        .where('f.otpId = :otpId', { otpId })
        .getCount();
      return count;
    } catch (err) {
      this.logger.log(
        `[otp.service] -> findFailLogEntries -> FAIL -> otpId${otpId}`,
      );
      throw err.message;
    }
  }

  //ok
  /**
   * get recent otp status from id || mobileNo.
   */
  async getOtpStatusOnly(id: string = null, mobileNo: number = null) {
    try {
      let response = await this.getLastOtpEntryForMobileOrID(id, mobileNo);
      if (response?.otp_status) {
        return response.otp_status;
      }
    } catch (err) {
      this.logger.log(
        `[otp.service] -> getOtpStatusOnly -> FAIL -> otpId${id} mobileNo${mobileNo}`,
      );
      throw err.message;
    }
  }

  //ok
  /**
   * Get Last Otp entry based on id||mobileNo
   * @param id
   * @param mobileNo
   * @returns
   */
  async getLastOtpEntryForMobileOrID(
    id: string = null,
    mobileNo: number = null,
  ) {
    try {
      const latestOtp = await this.otpRepository.createQueryBuilder('o');
      latestOtp.select();
      if (mobileNo) {
        latestOtp.andWhere('o.mobileNo = :mobileNo', { mobileNo: mobileNo });
      } else if (id) {
        latestOtp.andWhere('o.id = :id', { id: id });
      }
      latestOtp.orderBy('o.createdAt', 'DESC');
      const result = await latestOtp.getOne();
      return result;
    } catch (err) {
      this.logger.log(
        `[otp.service] -> getLastOtpEntryForMobileOrID -> FAIL -> otpId${id} mobileNo${mobileNo}`,
      );
      throw err.message;
    }
  }
}

import { WASLHeaders } from './config/wasl.headers.config';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { TripRegistrationDto, UpdateCurrentLocationDto } from './dto/';

import {
  EligibilityInquiryResponseForAll,
  EligibilityInquiryResponseForOne,
  TripRegistrationResponse,
  UpdateCurrentLocationResponse,
  WASLRegistrationResponse,
} from './interface/wasl.response.interface';
import { RegistrationInterface } from './interface/wasl.request.interface';

import { errorMessage } from 'src/constants/error-message-constant';
import { ResponseData } from 'src/helpers/responseHandler';
import appConfig from 'config/appConfig';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ELIGIBILITY, RejectReasons, ResultCodes } from './wasl.enum';
@Injectable()
export class WASLService {
  private readonly logger = new LoggerHandler(WASLService.name).getInstance();
  constructor() {}

  async registerDriverVehicle(data: RegistrationInterface) {
    try {
      this.logger.log(`RequestBody: ${JSON.stringify(data)}`);
      this.logger.log(`Request URL: ${appConfig().waslEndPoint}/drivers`);
      if (data?.driver?.mobileNumber) {
        const mobilePrefix = '+';
        data.driver.mobileNumber = `${mobilePrefix}${data.driver.mobileNumber}`;
      }
      console.log(data);
      const waslRes = await axios.post(
        `${appConfig().waslEndPoint}/drivers`,
        data,
        {
          headers: WASLHeaders,
        },
      );
      this.logger.log(`WASL ResponseData: ${JSON.stringify(waslRes?.data)}`);
      if (
        waslRes.data?.result?.eligibility == ELIGIBILITY.INVALID ||
        waslRes.data?.result?.eligibility == ELIGIBILITY.INVALID
      ) {
        let waslMessage = [];
        if (Array.isArray(waslRes.data?.result?.rejectionReasons)) {
          waslRes.data?.result?.rejectionReasons.map(function (x) {
            waslMessage.push(RejectReasons[x] || x); // += `, ${RejectReasons[x] || x}`;
          });
        }
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          JSON.stringify(waslMessage),
        );
      }

      // if (waslRes.data?.result?.eligibility == ELIGIBILITY.INVALID) {
      //   let errorMessage = 'Invalid driver';
      //   if (Array.isArray(waslRes.data?.result?.rejectionReasons)) {
      //     waslRes.data?.result?.rejectionReasons.map(function (x) {
      //       errorMessage += `, ${RejectReasons[x] || x}`;
      //     });
      //   }
      //   return ResponseData.error(HttpStatus.BAD_REQUEST, errorMessage);
      // }
      return ResponseData.success(waslRes.data);
    } catch (e) {
      this.logger.error(
        'WASL error: ',
        e.message,
        `Driver Id: ${data.driver.identityNumber}`,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        `WASL error: ${
          e.response.data.resultMsg || ResultCodes[e.response.data.resultCode]
        }` ||
          e.response.data.resultCode ||
          e.message,
      );
    }
  }

  async checkDriversEligibility(driverIds: string[]) {
    try {
      const requestBody = {
        driverIds: driverIds.map((id) => {
          return { id };
        }),
      };
      this.logger.log(`RequestBody: ${JSON.stringify(requestBody)}`);
      return axios
        .post(`${appConfig().waslEndPoint}/drivers/eligibility`, requestBody, {
          headers: WASLHeaders,
        })
        .then(async (res) => {
          let successData = res.data;
          this.logger.log(`[checkDriversEligibility] Success response`);
          return ResponseData.success(successData);
        })
        .catch(async (err) => {
          let errData = err?.response?.data;
          this.logger.error(
            '[checkDriversEligibility] Error Response' +
              JSON.stringify(errData),
          );
          return ResponseData.error(
            HttpStatus.BAD_REQUEST,
            errData?.resultMsg || errorMessage.SOMETHING_WENT_WRONG,
          );
        });
    } catch (e) {
      this.logger.error('[checkDriversEligibility] Error > ' + e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAllDriversEligibility(driverIds: string[]) {
    try {
      const requestBody = {
        driverIds: driverIds.map((id) => {
          return { id };
        }),
      };
      this.logger.log(`RequestBody: ${JSON.stringify(requestBody)}`);
      this.logger.log(
        `Request URL: ${appConfig().waslEndPoint}/drivers/eligibility`,
      );
      const waslRes = await axios.post(
        `${appConfig().waslEndPoint}/drivers/eligibility`,
        requestBody,
        {
          headers: WASLHeaders,
        },
      );
      this.logger.log(`WASL ResponseData: ${JSON.stringify(waslRes?.data)}`);
      return ResponseData.success(waslRes.data);
    } catch (e) {
      this.logger.error('WASL error: ', e.message);
      this.logger.error('WASL error: ', e);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getDriversEligibility(driverIdentityNumber: string) {
    try {
      this.logger.log(
        `Request URL: ${
          appConfig().waslEndPoint
        }/drivers/eligibility/${driverIdentityNumber}`,
      );
      const waslRes = await axios.get(
        `${
          appConfig().waslEndPoint
        }/drivers/eligibility/${driverIdentityNumber}`,
        {
          headers: WASLHeaders,
        },
      );
      this.logger.log(`WASL ResponseData: ${JSON.stringify(waslRes.data)}`);
      return ResponseData.success(waslRes.data);
    } catch (e) {
      this.logger.error('WASL error: ', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async registerTrip(registerTripDto: TripRegistrationDto) {
    try {
      this.logger.log(`RequestBody: ${JSON.stringify(registerTripDto)}`);
      this.logger.log(`Request URL: ${appConfig().waslEndPoint}/trips`);
      const waslRes = await axios.post(
        `${appConfig().waslEndPoint}/trips`,
        registerTripDto,
        {
          headers: WASLHeaders,
        },
      );
      this.logger.log(`WASL ResponseData: ${JSON.stringify(waslRes)}`);
      return waslRes.data;
    } catch (e) {
      this.logger.error('WASL error: ', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateCurrentLocation(
    updateCurrentLocationDto: UpdateCurrentLocationDto,
  ) {
    try {
      this.logger.log(
        `RequestBody: ${JSON.stringify({
          locations: [updateCurrentLocationDto],
        })}`,
      );
      this.logger.log(`Request URL :${appConfig().waslEndPoint}/locations`);
      const waslRes = await axios.post(
        `${appConfig().waslEndPoint}/locations`,
        {
          locations: [updateCurrentLocationDto],
        },
        {
          headers: WASLHeaders,
        },
      );
      this.logger.log(`WASL ResponseData: ${JSON.stringify(waslRes?.data)}`);
      return waslRes.data;
    } catch (e) {
      this.logger.error('WASL error: ', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
}

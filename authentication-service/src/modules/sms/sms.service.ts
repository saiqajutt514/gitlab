import { Injectable, HttpStatus } from '@nestjs/common';
import appConfig from 'config/appConfig';
import { sendSms } from './dto/sendsms.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { errorMessage } from 'src/constants/error-message-constant';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new LoggerHandler(SmsService.name).getInstance();

  async sendSms(params: sendSms) {
    try {
      this.logger.log(`["sendSms"] -> params: ${JSON.stringify(params)}`);

      const apiUrl = `${appConfig().unifonicApiUrl}${
        appConfig().unifonicSendSmsEndpoint
      }`;
      const authCredentials = `${appConfig().unifonicUsername}:${
        appConfig().unifonicPassword
      }`;
      const authToken = Buffer.from(authCredentials).toString('base64');
      const apiHeaders = {
        Authorization: `Basic ${authToken}`,
      };

      const apiParams = {
        AppSid: appConfig().unifonicAppSid,
        SenderID: appConfig().unifonicSenderId,
        Body: params.message,
        Recipient: `${params.mobileNo}`,
        responseType: 'JSON',
        statusCallbacl: 'sent',
      };

      // this.logger.log(`[sendSms] -> Unifonic ApiHeader: ${JSON.stringify(apiHeaders)}`);
      this.logger.debug(
        `[sendSms] -> Unifonic Request: ${JSON.stringify(apiParams)}`,
      );
      this.logger.log(`[sendSms] -> Unifonic ApiUrl: ${apiUrl}`);

      if (appConfig().mode == 'dev')
        return ResponseHandler.success({ message: 'dev mode' });

      const apiRes = await axios.post(apiUrl, apiParams);

      this.logger.log(
        `[sendSms] -> Unifonic Api response: ${JSON.stringify(apiRes?.data)}`,
      );
      if (apiRes?.data?.success === true)
        return ResponseHandler.success(apiRes.data);
      else {
        this.logger.error('[sendSms] Error Response message:');
        this.logger.error('[sendSms] Error Response:');
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    } catch (err) {
      this.logger.error(`[sendSms] -> Error in catch: ${err.message}`);

      if (axios.isAxiosError(err)) {
        this.logger.error(
          `[sendSms] -> Error in catch | Unifonic API message: ${JSON.stringify(
            err.response,
          )}`,
        );

        return ResponseHandler.error(
          err.response?.status || HttpStatus.BAD_REQUEST,
          err.response?.data?.message || errorMessage.SOMETHING_WENT_WRONG,
        );
      }
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
}

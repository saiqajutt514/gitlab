import { Injectable, HttpStatus } from '@nestjs/common';
import axios from "axios";

import appConfig from "config/appConfig";
import { ResponseData } from 'src/helpers/responseHandler'
import { errorMessage } from "src/constants/error-message-constant";
import { LoggerHandler } from 'src/helpers/logger-handler';
import { WalletAPIParams } from './enum';

@Injectable()
export class EwalletService {
  private readonly logger = new LoggerHandler(EwalletService.name).getInstance();

  async sendNotification(apiParams: WalletAPIParams) {
    try {
      const apiUrl = `${appConfig().eWalletApiUrl}/private/sendNotification`;
      const authCredentials = `${appConfig().eWalletUsername}:${appConfig().eWalletPassword}`;
      const authToken = Buffer.from(authCredentials).toString('base64');
      const apiHeaders = {
        channelId: appConfig().eWalletChannel,
        Authorization: `Basic ${authToken}`,
        spId: appConfig().eWalletSpId
      };

      this.logger.log(`[sendNotification] Ewallet API : ${apiUrl}`)
      this.logger.log(`[sendNotification] API Headers : ${JSON.stringify(apiHeaders)}`)
      this.logger.log(`[sendNotification] API Params : ${JSON.stringify(apiParams)}`)

      return axios.post(apiUrl, apiParams, { headers: apiHeaders }).then(async (res) => {
        this.logger.log('[sendNotification] Success Response:' + JSON.stringify(res.data))
        // {
        // "status": "SUCCESS",
        // "code": "OK",
        // "description": null
        // }
        if (res && res.status === HttpStatus.OK && res.data?.status === "SUCCESS" && res.data?.code === "OK") {
          this.logger.log('[sendNotification] Notification sent successfully')
          return ResponseData.success(HttpStatus.OK, res.data)
        } else {
          this.logger.error('[sendNotification] Failed to send notification')
          throw new Error(res.data?.message)
        }
      }).catch(async (err) => {
        this.logger.error('[sendNotification] API failure:' + JSON.stringify(err?.message))
        return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG)
      });
    } catch (err) {
      this.logger.error("[sendNotification] Ewallet sendNotification Error" + JSON.stringify(err));
      return ResponseData.error(HttpStatus.BAD_REQUEST, err?.message || errorMessage.SOMETHING_WENT_WRONG)
    }
  }

}

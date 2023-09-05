import { HttpStatus } from '@nestjs/common';
import {
  errorMessage,
  errorMessageAr,
} from 'src/constants/error-message-constant';

export interface ResponseData {
  statusCode: number;
  data?: any;
  message?: string;
  messageAr?: string;
}

export class ResponseHandler {
  static success(
    data: any = null,
    message?: string,
    messageAr?: string,
  ): ResponseData {
    let response: ResponseData = {
      statusCode: HttpStatus.OK,
      data: data,
    };
    if (message) {
      response = { ...response, message };
    }
    if (messageAr) {
      response = { ...response, messageAr };
    }
    return response;
  }

  static error(
    code: number,
    message: string = errorMessage.SOMETHING_WENT_WRONG,
    messageAr: string = errorMessageAr.SOMETHING_WENT_WRONG,
  ): ResponseData {
    return {
      statusCode: code,
      message,
      messageAr,
    };
  }
}

import { errorMessage } from "src/constants/error-message-constant"

export interface ResponseHandler {
  statusCode: number;
  data?: any;
  message?: string
}

export class ResponseData {
  static success(code: number, data: any = null, message?: string): ResponseHandler {
    let response: ResponseHandler = {
        statusCode: code,
        data
    }
    if (message) {
        response = { ...response, message }
    }
    return response
  }
  static error(code: number, message: string = errorMessage.SOMETHING_WENT_WRONG): ResponseHandler {
    return {
        statusCode: code,
        message
    }
  }
}

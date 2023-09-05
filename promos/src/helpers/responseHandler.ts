import { HttpStatus } from "@nestjs/common"
import { errorMessage } from "src/constants/errorMessages"

export interface ResponseHandler {
  statusCode: number;
  data?: any;
  message?: string
}

export class ResponseData {
  static success(data: any = null, message?: string): ResponseHandler {
    
    let response: ResponseHandler = {
      statusCode: HttpStatus.OK,
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
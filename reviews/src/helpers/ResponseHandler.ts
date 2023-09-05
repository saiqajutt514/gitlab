import { HttpStatus } from "@nestjs/common"

export interface ResponseHandler {
  statusCode: number;
  data?: any;
  message?: string
}

export class ResponseData {
  static success(data: any): ResponseHandler {
    return {
      statusCode: HttpStatus.OK,
      data
    }
  }
  static error(code: number, message: string): ResponseHandler {
    return {
      statusCode: code,
      message
    }
  }
}
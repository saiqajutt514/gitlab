import { HttpException, HttpStatus, Logger } from "@nestjs/common"

export interface ResponseHandlerInterface {
  statusCode: number;
  data?: any;
  message?: string
}

export class ResponseData {
  static success(code: number, data: any): ResponseHandlerInterface {
    return {
      statusCode: code,
      data
    }
  }
  static error(code: number, message: string): ResponseHandlerInterface {
    return {
      statusCode: code,
      message
    }
  }
}

export const successStatusCode = [200, 201]

export function ResponseHandler(response: ResponseHandlerInterface) {
  if (successStatusCode.includes(response?.statusCode)) {
    return response
  } else {
    if (response?.data) {
      const result = {
        statusCode: response?.statusCode,
        message: response?.message,
        data: response?.data,
      }
      throw new HttpException(result || "Internal Server Error", response?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR)
    } else {
      throw new HttpException(response?.message || "Internal Server Error", response?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
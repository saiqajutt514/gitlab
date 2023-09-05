import { HttpStatus, Logger } from "@nestjs/common"
import { errorMessage } from "src/constants/error-message-constant"

export interface ResponseData {
	statusCode: number;
	data?: any;
	message?: string
}

export class ResponseHandler {

	static success(data: any = null, message?: string): ResponseData {
		let response: ResponseData = {
			statusCode: HttpStatus.OK,
			data: data
		}
		if (message) {
			response = { ...response, message }
		}
		return response
	}

	static error(code: number, message: string = errorMessage.SOMETHING_WENT_WRONG): ResponseData {
		return {
			statusCode: code,
			message
		}
	}

	static errorWithData(code: number, data: any = null, message: string = errorMessage.SOMETHING_WENT_WRONG): ResponseData {
		return {
			statusCode: code,
			message,
			data
		}
	}

}
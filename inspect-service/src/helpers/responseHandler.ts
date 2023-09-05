import { HttpStatus } from "@nestjs/common"

export interface ResponseHandlerInterface {
	statusCode: number;
	message?: string
	data?: any;
}

export class ResponseData {
	static success(data: any = null, message?: string): ResponseHandlerInterface {
		let response: ResponseHandlerInterface = {
			statusCode: HttpStatus.OK,
			data
		}
		if (message) {
			response = { ...response, message }
		}
		return response
	}
	static error(code: number, message: string = "Something went wrong"): ResponseHandlerInterface {
		return {
			statusCode: code,
			message
		}
	}
}
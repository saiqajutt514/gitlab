
export interface ResponseHandler {
    statusCode: number;
    data?: any;
    message?: string
}

export class ResponseData {
    static success(code: number, data: any): ResponseHandler {
        return {
            statusCode: code,
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
import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class SubscriptionRequestDTO {

    @IsNotEmpty()
    @IsString()
    customerId: string

    @IsNotEmpty()
    @IsNumber()
    amount: number

    @IsNotEmpty()
    @IsNumber()
    fee: number

    @IsNotEmpty()
    @IsNumber()
    tax: number
}

export class SubscriptionResponseDTO {
    success: boolean
    txnId: string
}

export class SubscriptionErrorDto {
    message: string
    errorCode: string
}

export class TransactionForSubscriptionDto {
    userId: number
    txnId: number
    amount: number
    taxAmount: number
    creationDate: string
    status: string
    details: string
}
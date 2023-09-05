import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsPositive,
} from 'class-validator';
import { TRANSACTION_TYPE } from 'src/modules/click-pay/enums/clickpay.enum';

export class topUpMainAccXferDto {
  id?: string;
  amount: number;
  type: TRANSACTION_TYPE;
  tax?: number;
  fee?: number;
}
export class tripMainAccTransfersDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  id?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  senderFee?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  fullAmountToDebit?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  senderTax?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  receiverAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  receiverFee?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  receiverTax?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  receiverId?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  creditAmount?: number;
}
export class HoldAmountsDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  senderFee: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  senderTax: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  receiverFee: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  receiverTax: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  motFee: number;
}

export class HoldDto extends HoldAmountsDto {
  @IsNotEmpty()
  @IsString()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  receiverId: string;

  @IsNotEmpty()
  @IsString()
  tripId: string;

  @IsNotEmpty()
  @IsString()
  details: string;
}

export class HoldUpdateDto extends HoldAmountsDto {
  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsNotEmpty()
  @IsString()
  tripId: string;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @IsString()
  receiverId?: string;
}

export class HoldConfirmDto {
  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsNotEmpty()
  @IsString()
  tripId: string;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @IsString()
  receiverId?: string;

  @IsOptional()
  @IsString()
  transferFee?: number;

  @IsOptional()
  @IsString()
  discount?: number;
}

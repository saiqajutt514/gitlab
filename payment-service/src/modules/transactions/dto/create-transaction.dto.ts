import { IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ENTITY_TYPE, TRANSACTION_SOURCE, TRANSACTION_STATUS } from '../enum';

export class CreateTransactionDto {
  @IsNotEmpty()
  entityId: string;

  @IsNotEmpty()
  @IsEnum(ENTITY_TYPE)
  entityType: ENTITY_TYPE;

  @IsOptional()
  sourceRef?: string;

  @IsOptional()
  @IsEnum(TRANSACTION_SOURCE)
  source?: TRANSACTION_SOURCE;

  @IsNotEmpty()
  senderId: string;

  @IsOptional()
  receiverId: string;

  @IsNotEmpty()
  transactionId: string;

  @IsNotEmpty()
  transactionAmount: number;

  @IsNotEmpty()
  senderAmount: number;

  @IsOptional()
  senderTax: number;
  @IsOptional()
  senderFee?: number;

  @IsNotEmpty()
  receiverAmount: number;

  @IsOptional()
  receiverTax: number;
  @IsOptional()
  receiverFee?: number;

  @IsNotEmpty()
  creditAmount: number;

  @IsNotEmpty()
  debitAmount: number;

  @IsOptional()
  taxAmount: number;

  @IsOptional()
  eWalletAPIResponse: string;

  @IsNotEmpty()
  @IsEnum(TRANSACTION_STATUS)
  status: TRANSACTION_STATUS;
}

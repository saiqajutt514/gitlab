export interface HoldParams {
  senderId: string;
  senderUserType: string;
  receiverId: string;
  receiverUserType: string;
  amount: string;
  senderFee: string;
  senderTax: string;
  receiverFee: string;
  receiverTax: string;
  channel: string;
  details: string;
  motFee?: string;
}

export interface HoldUpdatesDto {
  holderId: string;
  senderId: string;
  senderUserType: string;
  receiverId: string;
  receiverUserType: string;
  amount: string;
  senderFee: string;
  senderTax: string;
  receiverFee: string;
  receiverTax: string;
  channel: string;
}

export interface ConfirmAmountDto {
  holderId: string;
  senderId: string;
  senderUserType: string;
  receiverId: string;
  receiverUserType?: string;
}

export interface updateWalletDto {
  userId: string;
  balance: number;
}

export interface createSubscriptionDto {
  customerId: string;
  amount: number;
  fee: number;
  tax: number;
}

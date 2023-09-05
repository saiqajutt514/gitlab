export interface HoldParams {
  senderId: string
  senderUserType: string
  receiverId: string
  receiverUserType: string
  amount: string
  senderFee: string
  senderTax: string
  receiverFee: string
  receiverTax: string
  channel: string
  details: string
  motFee?: string
}

export interface HoldUpdateParams {
  holderId: string
  senderId: string
  senderUserType: string
  receiverId: string
  receiverUserType: string
  amount: string
  senderFee: string
  senderTax: string
  receiverFee: string
  receiverTax: string
  channel: string
  details: string
}

export interface HoldConfirmParams {
  holderId: string
  senderId: string
  senderUserType: string
  receiverId: string
  receiverUserType: string
}

export interface HoldRollbackParams {
  holderId: string
  senderId: string
  senderUserType: string
  receiverId: string
  receiverUserType: string
}

export class HoldAmountsParams {
  amount: number
  senderFee?: number
  senderTax?: number
  receiverFee?: number
  receiverTax?: number
  motFee?: number
}

export class HoldParams extends HoldAmountsParams {
  senderId: string
  receiverId: string
  tripId: string
  details: string
}

export class HoldUpdateParams extends HoldAmountsParams {
  transactionId?: string
  tripId: string
  details?: string
}

export class HoldConfirmParams {
  transactionId?: string
  tripId: string
  discount?: number
}
export enum ENTITY_TYPE {
  TRIP = 1,
  SUBSCRIPTION = 2,
  TOP_UP = 3,
}

export enum TRANSACTION_STATUS {
  PENDING = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  REFUNDED = 4,
  FAILED = 5,
}
export enum TRANSACTION_SOURCE {
  INTERNAL_WALLET = 1,
  CLICK_PAY = 2,
}

export enum TransactionsSort {
  transactionId = 'transactions.transactionId',
  createdAt = 'transactions.createdAt',
  senderId = 'transactions.senderId',
  packageName = 'package.packageName',
  subscriptionAmount = 'subscription.subscriptionAmount',
  startDate = 'subscription.startDate',
  endDate = 'subscription.endDate',
  status = 'subscription.status',
  remainingDays = 'subscription_remainingDays',
}

export enum AlinmaTransactionsSort {
  transactionId = 'transactions.transactionId',
  createdAt = 'transactions.createdAt',
  parentId = 'transactions.parentId',
  userId = 'transactions.userId',
  srcAccNum = 'transactions.srcAccNum',
  amount = 'transactions.amount',
  targAccNum = 'transactions.targAccNum',
  targIban = 'transactions.targIban',
  srcCurCode = 'transactions.srcCurCode',
  memo = 'transactions.memo',
  pmtDesc = 'transactions.pmtDesc',
  trnDesc = 'transactions.trnDesc',
  targCurCode = 'transactions.targCurCode',
  functionId = 'transactions.functionId',
  status = 'transactions.status',
  entityType = 'transactions.entityType',
}

export enum EARNING_DURATION {
  TODAY = 1,
  WEEKLY = 2,
  MONTHLY = 3,
  LIFETIME = 4,
}

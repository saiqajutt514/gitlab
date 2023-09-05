export interface SubscriptionFindOneInterface {
  userId: string
  status?: number
}

export interface SubscriptionFindAllInterface {
  userIds: string[]
  status?: number
  latest?: boolean
  pagination?: {
    page?: number
    limit?: number
  }
}



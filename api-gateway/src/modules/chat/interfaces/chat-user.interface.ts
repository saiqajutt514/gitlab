export interface UserListingParams {
  filters?: {
    userId?: number
    fullName?: string
    mobileNo?: string
    emailId?: string
    status?: number
  }
  sort?: {
    field: string
    order: string
  }
  take: number
  skip: number
  keyword?: string
}
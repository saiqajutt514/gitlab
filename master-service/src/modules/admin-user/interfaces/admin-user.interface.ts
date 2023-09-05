export interface AdminListParams {
  exclude?: string[]
}

export interface NotifyUserListFilters {
  inquiryId?: string
  fullName?: string
  mobileNo?: string
  email?: string
  city?: string
  createdAt?: string[]
}

export interface ListSearchSortDto {
  filters?: NotifyUserListFilters
  sort?: {
    field: string
    order: string
  }
  take: number
  skip: number
  keyword?: string
}

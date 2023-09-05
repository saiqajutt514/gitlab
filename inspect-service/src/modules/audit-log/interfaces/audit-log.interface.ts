export interface AuditLogListFilters {
  moduleName?: string
  entityName?: string
  entityId?: string
  actionType?: string
  createdAt?: string[]
}

export interface SettingsFilters {
  setting?: number
  subSetting?: string
  oldValue?: string
  newValue?: string
}

export interface CaptainStatusFilters {
  oldStatus?: string
  newStatus?: string
  blockedReason: string
}

export interface ChatUserStatusFilters {
  oldStatus?: string
  newStatus?: string
  reason: string
  subCategory?: number
}

export interface ListSearchSortDto {
  filters?: AuditLogListFilters & SettingsFilters & CaptainStatusFilters & ChatUserStatusFilters
  sort?: {
    field: string
    order: string
  }
  take: number
  skip: number
  keyword?: string
}

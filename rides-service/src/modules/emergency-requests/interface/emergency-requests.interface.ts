export interface EmergencyRequestsFilters {
  tripNo?: string
  createdAt?: string[]
  reason?: string
  location?: string
  tripStatus?: number
  issueStatus?: number
  riderName?: string
  assignedById?: string
}

export interface ListSearchSortDto {
    filters?: EmergencyRequestsFilters
    sort?: {
      field: string
      order: string
    }
    take: number
    skip: number
    keyword?: string
}

export interface CreateEmergencyRequestDto {
  tripId: string
  reason: string
  comments?: string
  location?: string
  latitude?: number
  longitude?: number
  riderId?: number
}

export interface UpdateEmergencyRequestDto {
  remarks?: string
  tripStatus?: number
  issueStatus?: number
  newTripId?: string
  modifiedBy: string
  assignedBy?: string
  resolvedBy?: string
  resolvedAt?: Date
}

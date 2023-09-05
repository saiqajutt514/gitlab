export interface AdminUserInterface {
  fullName: string
  email: string
  role: string
  password?: string
  status: boolean
}

export interface AdminListParams {
  exclude?: string[]
}
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  success: boolean
}

export interface PaginatedRequest {
  page?: number
  pageSize?: number
  [key: string]: unknown
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface BaseEntity {
  id: string // Mapped from BIGINT
  is_deleted: boolean // Mapped from BIT(1)
  created_at: string // Mapped from DATETIME (ISO 8601 string)
  updated_at: string // Mapped from DATETIME (ISO 8601 string)
}

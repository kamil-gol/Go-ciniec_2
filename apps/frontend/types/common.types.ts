// User types
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
}

export interface User {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  createdAt: string
  updatedAt: string
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

/** Error shape from axios mutation callbacks (onError) */
export type MutationError = Error & {
  response?: { data?: { error?: string } }
  error?: string
}

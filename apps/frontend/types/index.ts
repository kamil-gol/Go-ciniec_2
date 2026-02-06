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

// Hall types
export interface Hall {
  id: string
  name: string
  capacity: number
  pricePerPerson: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Event Type
export interface EventType {
  id: string
  name: string
  createdAt: string
}

// Client types
export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Reservation types
export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Reservation {
  id: string
  hallId: string
  hall?: Hall
  clientId: string
  client?: Client
  eventTypeId: string
  eventType?: EventType
  date: string
  startTime: string
  endTime: string
  guests: number
  totalPrice: number
  status: ReservationStatus
  notes?: string
  createdBy: string
  createdByUser?: User
  archivedAt?: string
  createdAt: string
  updatedAt: string
  deposits?: Deposit[]
  history?: ReservationHistory[]
}

// Deposit types
export interface Deposit {
  id: string
  reservationId: string
  amount: number
  dueDate: string
  paid: boolean
  paidDate?: string
  createdAt: string
  updatedAt: string
}

// Reservation History
export enum ChangeType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  CANCELLED = 'CANCELLED',
}

export interface ReservationHistory {
  id: string
  reservationId: string
  changedBy: string
  changedByUser?: User
  changeType: ChangeType
  oldValue?: string
  newValue?: string
  reason?: string
  createdAt: string
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

// Form types
export interface CreateReservationInput {
  hallId: string
  clientId: string
  eventTypeId: string
  date: string
  startTime: string
  endTime: string
  guests: number
  notes?: string
  deposit?: {
    amount: number
    dueDate: string
  }
}

export interface UpdateReservationInput extends Partial<CreateReservationInput> {
  reason: string
}

export interface CancelReservationInput {
  reason: string
}

export interface CreateClientInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  notes?: string
}

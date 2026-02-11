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
  pricePerChild?: number // New field - optional price per child
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
  email?: string // Optional email
  phone: string
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
  RESERVED = 'RESERVED', // New status for queue
}

export interface Reservation {
  id: string
  hallId: string
  hall?: Hall
  clientId: string
  client?: Client
  eventTypeId: string
  eventType?: EventType
  customEventType?: string // New field - for "Inne" event type
  birthdayAge?: number // New field - for "Urodziny" (which birthday)
  anniversaryYear?: number // New field - for "Rocznica" (which anniversary)
  anniversaryOccasion?: string // New field - for "Rocznica" (what occasion)
  
  // Date and time fields - supporting both old and new format
  date?: string // Old format - kept for backwards compatibility
  startTime?: string // Old format - kept for backwards compatibility  
  endTime?: string // Old format - kept for backwards compatibility
  startDateTime: string // New field - full datetime for event start
  endDateTime: string // New field - full datetime for event end
  
  // Guest count split
  adults: number // New field - number of adults
  children: number // New field - number of children
  guests: number // Computed field - total guests (adults + children)
  
  // Pricing
  pricePerAdult: number // New field - price per adult
  pricePerChild: number // New field - price per child  
  totalPrice: number
  
  // Status related
  status: ReservationStatus
  confirmationDeadline?: string // New field - for PENDING status, max 1 day before event
  
  // Queue related
  queuePosition?: number // For RESERVED status
  reservationQueueDate?: string // For RESERVED status - date user wants to book
  
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
export enum DepositStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface Deposit {
  id: string
  reservationId: string
  amount: number
  dueDate: string
  status: DepositStatus // New field - deposit status
  paid: boolean
  paidDate?: string
  paymentMethod?: string
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

// Queue types
export interface QueueItem {
  id: string
  position: number
  queueDate: string
  guests: number
  client: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }
  isManualOrder: boolean
  notes?: string
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface QueueStats {
  totalQueued: number
  queuesByDate: Array<{
    date: string
    count: number
  }>
  oldestQueueDate: string | null
  manualOrderCount: number
}

export interface CreateQueueReservationInput {
  clientId: string
  reservationQueueDate: string // Date user wants to book
  guests: number
  adults: number
  children?: number
  notes?: string
}

export interface PromoteQueueReservationInput {
  hallId: string
  eventTypeId: string
  customEventType?: string
  birthdayAge?: number
  anniversaryYear?: number
  anniversaryOccasion?: string
  startDateTime: string
  endDateTime: string
  adults: number
  children: number
  pricePerAdult: number
  pricePerChild: number
  status: 'PENDING' | 'CONFIRMED'
  confirmationDeadline?: string
  notes?: string
  deposit?: {
    amount: number
    dueDate: string
  }
}

// Dish Category types
export interface DishCategory {
  id: string
  slug: string
  name: string
  icon: string | null
  color: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    dishes: number
  }
}

// Dish types
export interface Dish {
  id: string
  categoryId: string
  category: DishCategory
  name: string
  description: string | null
  allergens: string[]
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateDishInput {
  name: string
  description?: string | null
  categoryId: string
  allergens?: string[]
  isActive?: boolean
}

export interface UpdateDishInput extends Partial<CreateDishInput> {}

export interface CreateDishCategoryInput {
  slug: string
  name: string
  icon?: string | null
  color?: string | null
  displayOrder?: number
  isActive?: boolean
}

export interface UpdateDishCategoryInput extends Partial<CreateDishCategoryInput> {}

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
  customEventType?: string // For "Inne" event type
  birthdayAge?: number // For "Urodziny"
  anniversaryYear?: number // For "Rocznica"
  anniversaryOccasion?: string // For "Rocznica"
  
  startDateTime: string // Full ISO datetime
  endDateTime: string // Full ISO datetime
  
  adults: number
  children: number
  pricePerAdult: number
  pricePerChild: number
  
  confirmationDeadline?: string // For PENDING status
  
  notes?: string
  deposit?: {
    amount: number
    dueDate: string
  }
}

export interface UpdateReservationInput extends Partial<CreateReservationInput> {
  reason: string // Required, min 10 characters
}

export interface CancelReservationInput {
  reason: string
}

export interface CreateClientInput {
  firstName: string
  lastName: string
  email?: string // Optional email
  phone: string
  notes?: string
}

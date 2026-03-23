import type { Hall } from './hall.types'
import type { Client } from './client.types'
import type { EventType } from './hall.types'
import type { User } from './common.types'
import type { MenuSnapshot, MenuOptionSelection } from './menu.domain.types'
import type { ReservationExtra } from './service-extra.types'

// Reservation types
export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESERVED = 'RESERVED', // New status for queue
  ARCHIVED = 'ARCHIVED', // Terminal state for archived reservations
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
  adults: number // Number of adults
  children: number // Number of children (4-12)
  toddlers: number // Number of toddlers (0-3)
  guests: number // Computed field - total guests (adults + children + toddlers)

  // Pricing
  pricePerAdult: number // Price per adult
  pricePerChild: number // Price per child (4-12)
  pricePerToddler: number // Price per toddler (0-3)
  totalPrice: number

  // Venue Surcharge (whole venue booking)
  venueSurcharge?: number | null      // Surcharge amount for whole venue
  venueSurchargeLabel?: string | null  // Label explaining the surcharge (e.g. "Dopłata za cały obiekt (< 30 os.)")

  // Discount fields
  discountType?: string | null       // 'PERCENTAGE' | 'FIXED' | null
  discountValue?: number | null       // e.g. 10 (for 10%) or 500 (for 500 PLN)
  discountAmount?: number | null      // Calculated discount amount in PLN
  discountReason?: string | null      // Reason for the discount
  priceBeforeDiscount?: number | null // Original price before discount was applied

  // Menu Integration
  menuSnapshot?: MenuSnapshot // Menu snapshot if menu package selected

  // Service Extras Integration
  reservationExtras?: ReservationExtra[] // Extras assigned to this reservation
  extrasCount?: number              // Number of extras (from _count)
  extrasTotalPrice?: number         // Sum of all extras prices

  // Category Extras Integration (#216)
  categoryExtras?: ReservationCategoryExtra[]
  categoryExtrasTotal?: number      // Sum of all category extras prices (runtime calculated)

  // Status related
  status: ReservationStatus
  confirmationDeadline?: string // New field - for PENDING status, max 1 day before event

  // Queue related
  queuePosition?: number // For RESERVED status
  reservationQueueDate?: string // For RESERVED status - date user wants to book

  notes?: string
  internalNotes?: string | null  // Etap 5: Notatka wewnętrzna — nie pojawia się w PDF
  createdBy: string
  createdByUser?: User
  archivedAt?: string
  createdAt: string
  updatedAt: string
  deposits?: Deposit[]
  history?: ReservationHistory[]
}

// Category Extras (#216) — per-person pricing model
export interface ReservationCategoryExtra {
  id: string
  packageCategoryId: string
  quantity: number           // Decimal (0.5, 1, 1.5...) — extra portions beyond base maxSelect
  pricePerItem: number       // Snapshot of extraItemPrice per person per extra portion
  guestCount: number         // Snapshot of relevant guest count based on portionTarget
  portionTarget: string      // ALL | ADULTS_ONLY | CHILDREN_ONLY
  totalPrice: number         // quantity × pricePerItem × guestCount
  packageCategory: {
    category: {
      id: string
      name: string
      icon?: string
      slug?: string
    }
  }
  createdAt?: string
  updatedAt?: string
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

  // Guest counts - ALL REQUIRED
  adults: number
  children: number
  toddlers: number

  // Pricing - conditional based on menu package
  pricePerAdult?: number // Optional if menuPackageId provided
  pricePerChild?: number // Optional if menuPackageId provided
  pricePerToddler?: number // Optional if menuPackageId provided

  // Menu Integration
  menuPackageId?: string // Optional - if provided, prices come from package
  selectedOptions?: MenuOptionSelection[] // Optional - additional menu options

  // #216: Category Extras (per-person pricing)
  categoryExtras?: Array<{ packageCategoryId: string; quantity: number; portionTarget?: string }>

  confirmationDeadline?: string // For PENDING status

  notes?: string
  deposit?: {
    amount: number
    dueDate: string
    paid?: boolean
    paymentMethod?: string
    paidAt?: string
  }
}

export interface UpdateReservationInput extends Partial<CreateReservationInput> {
  reason: string // Required, min 10 characters
  internalNotes?: string // Etap 5: Notatka wewnętrzna
}

export interface CancelReservationInput {
  reason: string
}

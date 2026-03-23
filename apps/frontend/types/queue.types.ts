import type { MenuOptionSelection } from './menu.domain.types'

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
  toddlers?: number
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
  toddlers: number
  pricePerAdult: number
  pricePerChild: number
  pricePerToddler: number
  status: 'PENDING' | 'CONFIRMED'
  confirmationDeadline?: string
  notes?: string
  // Menu fields
  menuPackageId?: string
  selectedOptions?: MenuOptionSelection[]
  deposit?: {
    amount: number
    dueDate: string
  }
}

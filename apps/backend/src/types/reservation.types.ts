/**
 * Reservation Types
 * Types and interfaces for reservation management
 */

export interface CreateReservationDTO {
  hallId: string;
  clientId: string;
  eventTypeId: string;
  
  // DateTime fields (new - preferred)
  startDateTime?: string; // ISO datetime string
  endDateTime?: string; // ISO datetime string
  
  // Legacy fields (for backwards compatibility)
  date?: string; // ISO date string
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  
  // Guest count (new - split by adults and children)
  adults?: number;
  children?: number;
  guests?: number; // Computed or legacy
  
  // Pricing (new - separate for adults and children)
  pricePerAdult?: number;
  pricePerChild?: number;
  
  // Confirmation deadline for PENDING status
  confirmationDeadline?: string; // ISO datetime string
  
  // Custom event fields
  customEventType?: string; // For "Inne" event type
  birthdayAge?: number; // For "Urodziny" event type
  anniversaryYear?: number; // For "Rocznica"
  anniversaryOccasion?: string; // For "Rocznica"
  
  notes?: string;
  
  // Deposit (full structure)
  deposit?: {
    amount: number;
    dueDate: string; // ISO date string
    paid?: boolean;
    paymentMethod?: 'CASH' | 'TRANSFER' | 'BLIK';
    paidAt?: string; // ISO datetime string
  };
  
  // Legacy deposit fields (for backwards compatibility)
  depositAmount?: number;
  depositDueDate?: string;
}

export interface UpdateReservationDTO {
  // DateTime fields
  startDateTime?: string;
  endDateTime?: string;
  
  // Legacy fields
  date?: string;
  startTime?: string;
  endTime?: string;
  
  // Guest count
  adults?: number;
  children?: number;
  guests?: number;
  
  // Pricing
  pricePerAdult?: number;
  pricePerChild?: number;
  
  // Confirmation deadline
  confirmationDeadline?: string;
  
  // Custom event fields
  customEventType?: string;
  birthdayAge?: number; // For "Urodziny" event type
  anniversaryYear?: number;
  anniversaryOccasion?: string;
  
  notes?: string;
  depositAmount?: number;
  depositDueDate?: string;
  depositPaid?: boolean;
  
  // Required reason for changes (min 10 characters)
  reason?: string;
}

export interface UpdateStatusDTO {
  status: ReservationStatus;
  reason?: string;
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ReservationFilters {
  status?: ReservationStatus;
  hallId?: string;
  clientId?: string;
  eventTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  archived?: boolean;
}

export interface ReservationResponse {
  id: string;
  hallId: string;
  clientId: string;
  eventTypeId: string;
  createdBy: string;
  
  // DateTime fields
  startDateTime: Date | null;
  endDateTime: Date | null;
  
  // Legacy fields
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  
  // Guest count
  adults: number;
  children: number;
  guests: number;
  
  // Pricing
  pricePerAdult: string;
  pricePerChild: string;
  totalPrice: string;
  
  // Status
  status: string;
  confirmationDeadline: Date | null;
  
  // Custom event fields
  customEventType: string | null;
  birthdayAge: number | null; // For "Urodziny" event type
  anniversaryYear: number | null;
  anniversaryOccasion: string | null;
  
  notes: string | null;
  depositAmount: string | null;
  depositDueDate: Date | null;
  depositPaid: boolean;
  attachments: string[];
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  hall?: {
    id: string;
    name: string;
    capacity: number;
    pricePerPerson: string;
    pricePerChild: string | null;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  eventType?: {
    id: string;
    name: string;
  };
  createdByUser?: {
    id: string;
    email: string;
  };
}

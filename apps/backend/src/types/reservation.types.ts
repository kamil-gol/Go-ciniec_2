/**
 * Reservation Types
 * Types and interfaces for reservation management
 * UPDATED: Menu integration support
 */

// ═══════════════════════════════════════════════════════════════
// Menu-related types
// ═══════════════════════════════════════════════════════════════

export interface MenuOptionSelection {
  optionId: string;
  quantity?: number; // For options that allow multiple
}

export interface UpdateReservationMenuDTO {
  menuPackageId?: string | null; // null to remove menu
  selectedOptions?: MenuOptionSelection[];
  adultsCount?: number; // Override from reservation if different
  childrenCount?: number;
  toddlersCount?: number;
}

// ═══════════════════════════════════════════════════════════════
// Reservation DTOs
// ═══════════════════════════════════════════════════════════════

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
  
  // Guest count (new - split by age groups)
  // NOW REQUIRED: At least one group must have > 0 guests
  adults: number;
  children: number; // 4-12 years
  toddlers: number; // 0-3 years
  guests?: number; // Computed or legacy
  
  // ═══════════════════════════════════════════════════════════════
  // MENU INTEGRATION (NEW)
  // ═══════════════════════════════════════════════════════════════
  menuPackageId?: string; // Optional: Selected menu package
  selectedOptions?: MenuOptionSelection[]; // Optional: Additional menu options
  
  // Pricing (now optional if menuPackageId is provided)
  // If menuPackageId is set, prices come from package
  // If menuPackageId is NOT set, these are REQUIRED
  pricePerAdult?: number;
  pricePerChild?: number; // 4-12 years
  pricePerToddler?: number; // 0-3 years
  
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

  // ═══════════════════════════════════════════════════════════════
  // DISCOUNT (Sprint 7 - applied during creation)
  // ═══════════════════════════════════════════════════════════════
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  discountReason?: string;

  // ═══════════════════════════════════════════════════════════════
  // SERVICE EXTRAS (Sprint 8 - created during reservation)
  // ═══════════════════════════════════════════════════════════════
  serviceExtras?: Array<{
    serviceItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
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
  children?: number; // 4-12 years
  toddlers?: number; // 0-3 years
  guests?: number;

  // ═══════════════════════════════════════════════════════════════
  // MENU INTEGRATION
  // ═══════════════════════════════════════════════════════════════
  menuPackageId?: string | null; // null to remove menu package
  selectedOptions?: MenuOptionSelection[]; // Updated menu options
  
  // Pricing
  pricePerAdult?: number;
  pricePerChild?: number; // 4-12 years
  pricePerToddler?: number; // 0-3 years
  
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
  children: number; // 4-12 years
  toddlers: number; // 0-3 years
  guests: number;
  
  // Pricing
  pricePerAdult: string;
  pricePerChild: string; // 4-12 years
  pricePerToddler: string; // 0-3 years
  totalPrice: string;
  
  // ═══════════════════════════════════════════════════════════════
  // VENUE SURCHARGE (whole venue booking)
  // ═══════════════════════════════════════════════════════════════
  venueSurcharge: string | null;
  venueSurchargeLabel: string | null;
  
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
    isWholeVenue: boolean;
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

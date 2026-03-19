/**
 * Reservation Types — shared between controllers and services
 * Updated: Sprint 7 — Discount fields added
 * Updated: Sprint 8 — Service extras during reservation creation
 * Updated: #137 — Venue surcharge fields
 * Updated: #144 — ARCHIVED status support
 * Updated: Etap 5 — internalNotes field (excluded from PDF)
 * Updated: fix/ts-errors — eventTypeId in ReservationFilters, menuPackageId in UpdateReservationDTO
 */

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESERVED = 'RESERVED',
  ARCHIVED = 'ARCHIVED',
}

export interface CreateReservationDTO {
  hallId: string;
  clientId: string;
  eventTypeId: string;
  customEventType?: string;
  birthdayAge?: number;
  anniversaryYear?: number;
  anniversaryOccasion?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startDateTime?: string;
  endDateTime?: string;
  adults: number;
  children: number;
  toddlers?: number;
  pricePerAdult?: number;
  pricePerChild?: number;
  pricePerToddler?: number;
  notes?: string;
  confirmationDeadline?: string;
  menuPackageId?: string;
  selectedOptions?: Array<{ optionId: string; quantity: number }>;
  // Deposit fields
  deposit?: {
    amount: number;
    dueDate: string;
    paid?: boolean;
    paymentMethod?: string;
    paidAt?: string;
  };
  depositAmount?: number;
  depositDueDate?: string;
  // Discount fields (Sprint 7)
  discountType?: string;
  discountValue?: number;
  discountReason?: string;
  // Sprint 8: Service extras
  serviceExtras?: Array<{
    serviceItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  // #216: Category extras (per-person pricing)
  categoryExtras?: Array<{
    packageCategoryId: string;
    quantity: number;
    portionTarget?: string;
  }>;
}

export interface UpdateReservationDTO {
  hallId?: string;
  clientId?: string;
  eventTypeId?: string;
  customEventType?: string;
  birthdayAge?: number;
  anniversaryYear?: number;
  anniversaryOccasion?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startDateTime?: string;
  endDateTime?: string;
  adults?: number;
  children?: number;
  toddlers?: number;
  pricePerAdult?: number;
  pricePerChild?: number;
  pricePerToddler?: number;
  guests?: number;
  notes?: string;
  internalNotes?: string;  // Etap 5: Notatka wewnętrzna — NIE pojawia się w PDF
  confirmationDeadline?: string;
  reason?: string;
  menuPackageId?: string | null;  // fix: used in updateReservation to delegate to updateReservationMenu
  // Discount fields (Sprint 7)
  discountType?: string;
  discountValue?: number;
  discountReason?: string;
  // #216: Category extras (per-person pricing)
  categoryExtras?: Array<{
    packageCategoryId: string;
    quantity: number;
    portionTarget?: string;
  }>;
}

export interface UpdateStatusDTO {
  status: ReservationStatus;
  reason?: string;
}

export interface ReservationFilters {
  page?: number;
  pageSize?: number;
  status?: ReservationStatus;
  hallId?: string;
  clientId?: string;
  eventTypeId?: string;  // fix: used in getReservations + controller filter
  dateFrom?: string;
  dateTo?: string;
  archived?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReservationResponse {
  id: string;
  hallId: string;
  hall?: {
    id: string;
    name: string;
    capacity: number;
    isWholeVenue: boolean;
  };
  clientId: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
  };
  eventTypeId: string;
  eventType?: {
    id: string;
    name: string;
  };
  customEventType?: string;
  birthdayAge?: number;
  anniversaryYear?: number;
  anniversaryOccasion?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startDateTime?: string;
  endDateTime?: string;
  adults: number;
  children: number;
  toddlers: number;
  guests: number;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  totalPrice: number;
  // #137: Venue surcharge fields
  venueSurcharge?: number | null;
  venueSurchargeLabel?: string | null;
  // Discount fields (Sprint 7)
  discountType?: string | null;
  discountValue?: number | null;
  discountAmount?: number | null;
  discountReason?: string | null;
  priceBeforeDiscount?: number | null;
  status: ReservationStatus;
  confirmationDeadline?: string;
  notes?: string;
  internalNotes?: string | null;  // Etap 5: Notatka wewnętrzna
  attachments?: string[];
  // #216: Category extras (per-person pricing)
  categoryExtras?: Array<{
    id: string;
    packageCategoryId: string;
    quantity: number;
    pricePerItem: number;
    guestCount: number;
    portionTarget: string;
    totalPrice: number;
    packageCategory: { category: { id: string; name: string; icon?: string } };
  }>;
  categoryExtrasTotal?: number;
  createdBy: string;
  createdByUser?: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReservationMenuDTO {
  menuPackageId: string | null;
  adultsCount?: number;
  childrenCount?: number;
  toddlersCount?: number;
  selectedOptions?: Array<{
    optionId: string;
    quantity: number;
  }>;
  dishSelections?: Array<{
    categoryId: string;
    dishes: Array<{
      dishId: string;
      quantity: number;
    }>;
  }>;
  reason?: string;
}

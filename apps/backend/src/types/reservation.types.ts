/**
 * Reservation Types
 * Types and interfaces for reservation management
 */

export interface CreateReservationDTO {
  hallId: string;
  clientId: string;
  eventTypeId: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  guests: number;
  notes?: string;
  depositAmount?: number;
  depositDueDate?: string; // ISO date string
}

export interface UpdateReservationDTO {
  date?: string;
  startTime?: string;
  endTime?: string;
  guests?: number;
  notes?: string;
  depositAmount?: number;
  depositDueDate?: string;
  depositPaid?: boolean;
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
  date: Date;
  startTime: Date;
  endTime: Date;
  guests: number;
  totalPrice: string;
  status: string;
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

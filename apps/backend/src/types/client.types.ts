/**
 * Client Types
 * Types and interfaces for client management
 */

export interface CreateClientDTO {
  firstName: string;
  lastName: string;
  email?: string; // Optional email
  phone: string;
  notes?: string;
}

export interface UpdateClientDTO {
  firstName?: string;
  lastName?: string;
  email?: string; // Optional email
  phone?: string;
  notes?: string;
}

export interface ClientFilters {
  search?: string;
  includeDeleted?: boolean;
}

export interface ClientResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  notes: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientReservationSummary {
  active: number;
  completed: number;
  cancelled: number;
  archived: number;
  total: number;
}

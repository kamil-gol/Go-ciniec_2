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
}

export interface ClientResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

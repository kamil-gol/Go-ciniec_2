/**
 * Client Types
 * Types and interfaces for client management
 */

export interface CreateClientDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateClientDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface ClientFilters {
  search?: string; // Search in firstName, lastName, email, phone
}

export interface ClientResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Client Types
 * Types and interfaces for client management
 */

export interface CreateClientDTO {
  firstName: string;
  lastName: string;
  email?: string; // Optional email
  phone: string;
  address?: string;
  notes?: string;
}

export interface UpdateClientDTO {
  firstName?: string;
  lastName?: string;
  email?: string; // Optional email
  phone?: string;
  address?: string;
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
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

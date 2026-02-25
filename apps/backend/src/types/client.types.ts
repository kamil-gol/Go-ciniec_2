/**
 * Client Types
 * Types and interfaces for client management
 * Extended with company support (#150 Klienci 2.0)
 */

export type ClientType = 'INDIVIDUAL' | 'COMPANY';

// ── Create ──────────────────────────────────────────────

export interface CreateClientDTO {
  clientType?: ClientType;

  // Personal fields (always required for INDIVIDUAL, primary contact for COMPANY)
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  notes?: string;

  // Company fields (required when clientType = COMPANY)
  companyName?: string;
  nip?: string;
  regon?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyPostalCode?: string;
  industry?: string;
  website?: string;

  // Initial contacts (optional, for COMPANY)
  contacts?: CreateClientContactDTO[];
}

export interface UpdateClientDTO {
  clientType?: ClientType;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;

  companyName?: string;
  nip?: string;
  regon?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyPostalCode?: string;
  industry?: string;
  website?: string;
}

// ── Client Contacts ─────────────────────────────────────

export interface CreateClientContactDTO {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface UpdateClientContactDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

// ── Filters ─────────────────────────────────────────────

export interface ClientFilters {
  search?: string;
  clientType?: ClientType;
  includeDeleted?: boolean;
}

// ── Response ────────────────────────────────────────────

export interface ClientContactResponse {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientResponse {
  id: string;
  clientType: ClientType;

  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  notes: string | null;

  companyName: string | null;
  nip: string | null;
  regon: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
  companyCity: string | null;
  companyPostalCode: string | null;
  industry: string | null;
  website: string | null;

  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  contacts?: ClientContactResponse[];
}

export interface ClientReservationSummary {
  active: number;
  completed: number;
  cancelled: number;
  archived: number;
  total: number;
}

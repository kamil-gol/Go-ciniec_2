// apps/frontend/src/types/client.types.ts

// ═══════════════════════════════════════════════════════════════
// Client Type enum
// ═══════════════════════════════════════════════════════════════

export type ClientType = 'INDIVIDUAL' | 'COMPANY';

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  INDIVIDUAL: 'Osoba prywatna',
  COMPANY: 'Firma',
};

export const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  INDIVIDUAL: 'bg-blue-100 text-blue-800',
  COMPANY: 'bg-purple-100 text-purple-800',
};

// ═══════════════════════════════════════════════════════════════
// Client Contact (for COMPANY clients)
// ═══════════════════════════════════════════════════════════════

export interface ClientContact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface UpdateClientContactInput {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Client
// ═══════════════════════════════════════════════════════════════

export interface Client {
  id: string;
  clientType: ClientType;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  notes: string | null;
  // Company fields
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
  // Metadata
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  contacts: ClientContact[];
}

export interface CreateClientInput {
  clientType?: ClientType;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  notes?: string;
  // Company fields
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
  // Inline contacts (for creation)
  contacts?: CreateClientContactInput[];
}

export interface UpdateClientInput {
  clientType?: ClientType;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string;
  notes?: string | null;
  // Company fields
  companyName?: string | null;
  nip?: string | null;
  regon?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyPostalCode?: string | null;
  industry?: string | null;
  website?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// API Response wrappers
// ═══════════════════════════════════════════════════════════════

export interface ClientsListResponse {
  success: boolean;
  data: Client[];
  count: number;
}

export interface ClientResponse {
  success: boolean;
  data: Client;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// Filter params
// ═══════════════════════════════════════════════════════════════

export interface ClientsFilterParams {
  search?: string;
  clientType?: ClientType;
  includeDeleted?: boolean;
}

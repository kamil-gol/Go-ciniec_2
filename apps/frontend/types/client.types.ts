// Client types
export type ClientType = 'INDIVIDUAL' | 'COMPANY'

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  INDIVIDUAL: 'Osoba prywatna',
  COMPANY: 'Firma',
}

export interface ClientContact {
  id: string
  clientId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role?: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string // Optional email
  phone: string
  notes?: string
  clientType: ClientType
  companyName?: string
  nip?: string
  regon?: string
  industry?: string
  website?: string
  companyAddress?: string
  contacts?: ClientContact[]
  createdAt: string
  updatedAt: string
}

export interface CreateClientInput {
  firstName: string
  lastName: string
  email?: string // Optional email
  phone: string
  notes?: string
  clientType?: ClientType
  companyName?: string
  nip?: string
  regon?: string
  industry?: string
  website?: string
  companyAddress?: string
}

export interface CreateClientContactInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role?: string
  isPrimary?: boolean
}

import { apiClient } from '../api-client'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type DepositStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'BLIK'

export interface Deposit {
  id: string
  reservationId: string
  amount: string
  remainingAmount: string
  paidAmount: string
  dueDate: string
  status: DepositStatus
  paid: boolean
  paidAt: string | null
  paymentMethod: PaymentMethod | null
  title: string | null
  description: string | null
  internalNotes: string | null
  receiptNumber: string | null
  createdAt: string
  updatedAt: string
  reservation?: {
    id: string
    date: string
    startTime: string
    endTime: string
    guests: number
    totalPrice: string
    status: string
    client: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
    }
    hall: {
      id: string
      name: string
    }
    eventType: {
      id: string
      name: string
      color: string
    }
  }
}

export interface DepositStats {
  counts: {
    total: number
    pending: number
    paid: number
    overdue: number
    partiallyPaid: number
    cancelled: number
    upcomingIn7Days: number
  }
  amounts: {
    total: number
    paid: number
    pending: number
    overdue: number
  }
}

export interface CreateDepositInput {
  amount: number
  dueDate: string
  title?: string
  description?: string
  internalNotes?: string
}

export interface UpdateDepositInput {
  amount?: number
  dueDate?: string
  title?: string
  description?: string
  internalNotes?: string
}

export interface MarkDepositPaidInput {
  paymentMethod: PaymentMethod
  paidAt?: string
}

// ═══════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════

export const depositsApi = {
  // List all deposits (with optional filters)
  getAll: async (params?: {
    status?: DepositStatus
    overdue?: boolean
    search?: string
  }): Promise<Deposit[]> => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.overdue) searchParams.set('overdue', 'true')
    if (params?.search) searchParams.set('search', params.search)
    const query = searchParams.toString()
    const response = await apiClient.get(`/deposits${query ? `?${query}` : ''}`)
    return response.data.data
  },

  // Get deposit stats
  getStats: async (): Promise<DepositStats> => {
    const response = await apiClient.get('/deposits/stats')
    return response.data.data
  },

  // Get single deposit
  getById: async (id: string): Promise<Deposit> => {
    const response = await apiClient.get(`/deposits/${id}`)
    return response.data.data
  },

  // Get deposits for a reservation
  getByReservation: async (reservationId: string): Promise<Deposit[]> => {
    const response = await apiClient.get(`/reservations/${reservationId}/deposits`)
    return response.data.data
  },

  // Create deposit for a reservation
  create: async (reservationId: string, data: CreateDepositInput): Promise<Deposit> => {
    const response = await apiClient.post(`/reservations/${reservationId}/deposits`, data)
    return response.data.data
  },

  // Update deposit
  update: async (id: string, data: UpdateDepositInput): Promise<Deposit> => {
    const response = await apiClient.put(`/deposits/${id}`, data)
    return response.data.data
  },

  // Delete deposit
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/deposits/${id}`)
  },

  // Mark as paid
  markAsPaid: async (id: string, data: MarkDepositPaidInput): Promise<Deposit> => {
    const response = await apiClient.patch(`/deposits/${id}/mark-paid`, data)
    return response.data.data
  },

  // Mark as unpaid (revert)
  markAsUnpaid: async (id: string): Promise<Deposit> => {
    const response = await apiClient.patch(`/deposits/${id}/mark-unpaid`)
    return response.data.data
  },

  // Cancel deposit
  cancel: async (id: string): Promise<Deposit> => {
    const response = await apiClient.patch(`/deposits/${id}/cancel`)
    return response.data.data
  },

  // Get overdue deposits
  getOverdue: async (): Promise<Deposit[]> => {
    const response = await apiClient.get('/deposits/overdue')
    return response.data.data
  },
}

import { apiClient } from '../api-client'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type DepositStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'BLIK' | 'CARD'

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
  /**
   * #deposits-fix (3/5): Pass limit=500 to ensure ALL deposits are loaded.
   * Previously the default backend limit of 20 silently truncated the list while
   * the stats panel showed accurate full counts — causing a visible discrepancy.
   * 500 is a safe ceiling for a restaurant context (deposits per active period).
   */
  getAll: async (params?: {
    status?: DepositStatus
    overdue?: boolean
    search?: string
    limit?: number
  }): Promise<Deposit[]> => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.overdue) searchParams.set('overdue', 'true')
    if (params?.search) searchParams.set('search', params.search)
    searchParams.set('limit', String(params?.limit ?? 500))
    const query = searchParams.toString()
    const response = await apiClient.get(`/deposits${query ? `?${query}` : ''}`)
    return response.data.data
  },

  getStats: async (): Promise<DepositStats> => {
    const response = await apiClient.get('/deposits/stats')
    return response.data.data
  },

  getById: async (id: string): Promise<Deposit> => {
    const response = await apiClient.get(`/deposits/${id}`)
    return response.data.data
  },

  getByReservation: async (reservationId: string): Promise<Deposit[]> => {
    const response = await apiClient.get(`/reservations/${reservationId}/deposits`)
    return response.data.data
  },

  create: async (reservationId: string, data: CreateDepositInput): Promise<Deposit> => {
    const response = await apiClient.post(`/reservations/${reservationId}/deposits`, data)
    return response.data.data
  },

  update: async (id: string, data: UpdateDepositInput): Promise<Deposit> => {
    const response = await apiClient.put(`/deposits/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/deposits/${id}`)
  },

  markAsPaid: async (id: string, data: MarkDepositPaidInput): Promise<Deposit> => {
    const response = await apiClient.patch(`/deposits/${id}/mark-paid`, data)
    return response.data.data
  },

  markAsUnpaid: async (id: string): Promise<Deposit> => {
    const response = await apiClient.patch(`/deposits/${id}/mark-unpaid`)
    return response.data.data
  },

  cancel: async (id: string): Promise<Deposit> => {
    const response = await apiClient.patch(`/deposits/${id}/cancel`)
    return response.data.data
  },

  getOverdue: async (): Promise<Deposit[]> => {
    const response = await apiClient.get('/deposits/overdue')
    return response.data.data
  },

  /** Download payment confirmation PDF */
  downloadPdf: async (id: string): Promise<void> => {
    const response = await apiClient.get(`/deposits/${id}/pdf`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Potwierdzenie_wplaty_${id.substring(0, 8)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  /** Manually send confirmation email with PDF to client */
  sendEmail: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/deposits/${id}/send-email`)
    return response.data
  },
}

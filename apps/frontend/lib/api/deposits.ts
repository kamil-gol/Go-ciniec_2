import { apiClient } from './client'

export interface MarkDepositPaidInput {
  paymentMethod: 'CASH' | 'TRANSFER' | 'BLIK'
  paidAt: string // ISO date string
}

export const depositsApi = {
  // Mark deposit as paid
  markAsPaid: async (depositId: string, data: MarkDepositPaidInput) => {
    const response = await apiClient.patch(`/deposits/${depositId}/mark-paid`, data)
    return response.data
  },

  // Mark deposit as unpaid (revert)
  markAsUnpaid: async (depositId: string) => {
    const response = await apiClient.patch(`/deposits/${depositId}/mark-unpaid`)
    return response.data
  },
}

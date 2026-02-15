import { apiClient } from '../api-client'
import { Reservation } from '@/types'

export interface ApplyDiscountInput {
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  reason: string
}

export const discountApi = {
  apply: async (reservationId: string, input: ApplyDiscountInput): Promise<Reservation> => {
    const { data } = await apiClient.patch(`/reservations/${reservationId}/discount`, input)
    return data.data || data
  },

  remove: async (reservationId: string): Promise<Reservation> => {
    const { data } = await apiClient.delete(`/reservations/${reservationId}/discount`)
    return data.data || data
  },
}

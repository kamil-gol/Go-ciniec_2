import { apiClient } from '../api-client'
import {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
  CancelReservationInput,
  PaginatedResponse,
  ReservationStatus,
} from '@/types'

export interface ReservationsFilters {
  page?: number
  pageSize?: number
  status?: ReservationStatus
  hallId?: string
  clientId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'date' | 'createdAt' | 'totalPrice'
  sortOrder?: 'asc' | 'desc'
}

export const reservationsApi = {
  // Get all reservations with filters
  getAll: async (filters: ReservationsFilters = {}): Promise<PaginatedResponse<Reservation>> => {
    const { data } = await apiClient.get('/reservations', { params: filters })
    return data
  },

  // Get single reservation by ID
  getById: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.get(`/reservations/${id}`)
    return data
  },

  // Create new reservation
  create: async (input: CreateReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.post('/reservations', input)
    return data
  },

  // Update reservation
  update: async (id: string, input: UpdateReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.patch(`/reservations/${id}`, input)
    return data
  },

  // Cancel reservation
  cancel: async (id: string, input: CancelReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.delete(`/reservations/${id}`, { data: input })
    return data
  },

  // Archive reservation
  archive: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.post(`/reservations/${id}/archive`)
    return data
  },

  // Get reservation PDF
  downloadPdf: async (id: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/reservations/${id}/pdf`, {
      responseType: 'blob',
    })
    return data
  },

  // Export to CSV
  exportCsv: async (filters: ReservationsFilters = {}): Promise<Blob> => {
    const { data } = await apiClient.get('/reservations/export/csv', {
      params: filters,
      responseType: 'blob',
    })
    return data
  },
}

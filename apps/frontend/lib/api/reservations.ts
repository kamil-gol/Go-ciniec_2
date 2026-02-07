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
    console.log('Raw reservations response:', data)
    
    // Backend returns: { success: true, data: [...], count: 8 }
    // Transform to PaginatedResponse format
    if (data.success && Array.isArray(data.data)) {
      const page = filters.page || 1
      const pageSize = filters.pageSize || 20
      const total = data.count || data.data.length
      const totalPages = Math.ceil(total / pageSize)
      
      return {
        data: data.data,
        total,
        page,
        pageSize,
        totalPages
      }
    }
    
    // Fallback if response is already in correct format
    if (data.data && Array.isArray(data.data)) {
      return data
    }
    
    // Fallback for direct array
    console.warn('Unexpected reservations response format:', data)
    return {
      data: Array.isArray(data) ? data : [],
      total: Array.isArray(data) ? data.length : 0,
      page: 1,
      pageSize: 20,
      totalPages: 1
    }
  },

  // Get single reservation by ID
  getById: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.get(`/reservations/${id}`)
    console.log('Raw reservation by ID response:', data)
    return data.data || data // Handle both structures
  },

  // Create new reservation
  create: async (input: CreateReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.post('/reservations', input)
    return data.data || data // Handle both structures
  },

  // Update reservation - Backend uses PUT not PATCH
  update: async (id: string, input: UpdateReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.put(`/reservations/${id}`, input)
    return data.data || data // Handle both structures
  },

  // Cancel reservation
  cancel: async (id: string, input: CancelReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.delete(`/reservations/${id}`, { data: input })
    return data.data || data // Handle both structures
  },

  // Archive reservation
  archive: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.post(`/reservations/${id}/archive`)
    return data.data || data // Handle both structures
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

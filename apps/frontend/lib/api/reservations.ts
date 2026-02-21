import { apiClient } from '../api-client'
import {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
  CancelReservationInput,
  PaginatedResponse,
  ReservationStatus,
} from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ReservationsFilters {
  page?: number
  pageSize?: number
  status?: ReservationStatus
  hallId?: string
  clientId?: string
  dateFrom?: string
  dateTo?: string
  archived?: boolean // NEW: Filter for archived reservations
  sortBy?: 'date' | 'createdAt' | 'totalPrice'
  sortOrder?: 'asc' | 'desc'
}

export const reservationsApi = {
  // Get all reservations with filters
  getAll: async (filters: ReservationsFilters = {}): Promise<PaginatedResponse<Reservation>> => {
    const { data } = await apiClient.get('/reservations', { params: filters })
    
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
    return data.data || data
  },

  // Create new reservation
  create: async (input: CreateReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.post('/reservations', input)
    return data.data || data
  },

  // Update reservation - Backend uses PUT not PATCH
  update: async (id: string, input: UpdateReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.put(`/reservations/${id}`, input)
    return data.data || data
  },

  // Update reservation status - Uses separate endpoint with validation
  updateStatus: async (id: string, status: ReservationStatus, reason?: string): Promise<Reservation> => {
    const { data } = await apiClient.patch(`/reservations/${id}/status`, {
      status,
      reason: reason || 'Status updated'
    })
    return data.data || data
  },

  // Cancel reservation
  cancel: async (id: string, input: CancelReservationInput): Promise<Reservation> => {
    const { data } = await apiClient.delete(`/reservations/${id}`, { data: input })
    return data.data || data
  },

  // Archive reservation
  archive: async (id: string, reason?: string): Promise<Reservation> => {
    const { data } = await apiClient.post(`/reservations/${id}/archive`, { reason })
    return data.data || data
  },

  // Unarchive reservation (NEW)
  unarchive: async (id: string, reason?: string): Promise<Reservation> => {
    const { data } = await apiClient.post(`/reservations/${id}/unarchive`, { reason })
    return data.data || data
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

// Standalone functions for legacy compatibility
export const getReservations = async (filters: ReservationsFilters = {}): Promise<Reservation[]> => {
  const response = await reservationsApi.getAll(filters)
  return response.data
}

export const getReservationById = async (id: string): Promise<Reservation> => {
  return reservationsApi.getById(id)
}

export const downloadReservationPDF = async (id: string): Promise<void> => {
  const blob = await reservationsApi.downloadPdf(id)
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rezerwacja-${id}.pdf`
  document.body.appendChild(link)
  link.click()
  // Delay cleanup to allow browser to initiate the download
  setTimeout(() => {
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, 150)
}

// React Query Hooks
export const RESERVATIONS_QUERY_KEY = 'reservations'

// Get all reservations
export const useReservations = (filters: ReservationsFilters = {}) => {
  return useQuery({
    queryKey: [RESERVATIONS_QUERY_KEY, filters],
    queryFn: () => reservationsApi.getAll(filters),
  })
}

// Get single reservation by ID
export const useReservation = (id: string) => {
  return useQuery({
    queryKey: [RESERVATIONS_QUERY_KEY, id],
    queryFn: () => reservationsApi.getById(id),
    enabled: !!id,
  })
}

// Create reservation
export const useCreateReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateReservationInput) => reservationsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] })
    },
  })
}

// Update reservation
export const useUpdateReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationInput }) =>
      reservationsApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY, variables.id] })
    },
  })
}

// Update reservation status
export const useUpdateReservationStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: ReservationStatus; reason?: string }) =>
      reservationsApi.updateStatus(id, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

// Cancel reservation
export const useCancelReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelReservationInput }) =>
      reservationsApi.cancel(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

// Archive reservation
export const useArchiveReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      reservationsApi.archive(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] })
    },
  })
}

// Unarchive reservation (NEW)
export const useUnarchiveReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      reservationsApi.unarchive(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] })
    },
  })
}

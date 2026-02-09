import { apiClient } from '../api-client'

export interface Hall {
  id: string
  name: string
  capacity: number
  pricePerPerson: number
  pricePerChild?: number
  description?: string
  amenities: string[]
  images: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface HallsResponse {
  halls: Hall[]
  total: number
}

export interface HallAvailability {
  date: string
  isAvailable: boolean
  reservationId?: string
  reservationClient?: string
  reservationStatus?: string
}

export interface CreateHallInput {
  name: string
  capacity: number
  pricePerPerson: number
  pricePerChild?: number
  description?: string
  amenities?: string[]
  images?: string[]
  isActive?: boolean
}

export interface UpdateHallInput {
  name?: string
  capacity?: number
  pricePerPerson?: number
  pricePerChild?: number
  description?: string
  amenities?: string[]
  images?: string[]
  isActive?: boolean
}

export const hallsApi = {
  /**
   * Get all halls with optional filters
   */
  async getAll(params?: {
    isActive?: boolean
    search?: string
  }): Promise<HallsResponse> {
    const { data } = await apiClient.get('/halls', { params })
    
    // Backend returns: { success: true, data: [...], count: 6 }
    // Transform to: { halls: [...], total: 6 }
    return {
      halls: data.data || [],
      total: data.count || 0
    }
  },

  /**
   * Get single hall by ID
   */
  async getById(id: string): Promise<Hall> {
    const { data } = await apiClient.get(`/halls/${id}`)
    return data.data || data
  },

  /**
   * Create new hall (Admin only)
   */
  async create(hall: CreateHallInput): Promise<Hall> {
    const { data } = await apiClient.post('/halls', hall)
    return data.data || data
  },

  /**
   * Update existing hall (Admin only)
   */
  async update(id: string, hall: UpdateHallInput): Promise<Hall> {
    const { data } = await apiClient.put(`/halls/${id}`, hall)
    return data.data || data
  },

  /**
   * Delete hall - soft delete (Admin only)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/halls/${id}`)
  },

  /**
   * Get hall availability for a specific month
   * Returns array of dates with availability status
   */
  async getAvailability(
    hallId: string,
    year: number,
    month: number
  ): Promise<HallAvailability[]> {
    const { data } = await apiClient.get('/reservations', {
      params: {
        hallId,
        dateFrom: `${year}-${String(month).padStart(2, '0')}-01`,
        dateTo: `${year}-${String(month).padStart(2, '0')}-31`,
      }
    })
    
    // Transform reservations to availability format
    const availability: HallAvailability[] = []
    const reservationsMap = new Map()
    
    const reservations = data.data || []
    reservations.forEach((reservation: any) => {
      if (reservation.startDateTime) {
        const date = reservation.startDateTime.split('T')[0]
        reservationsMap.set(date, {
          reservationId: reservation.id,
          reservationClient: `${reservation.client?.firstName} ${reservation.client?.lastName}`,
          reservationStatus: reservation.status,
        })
      }
    })
    
    // Generate all days in month
    const daysInMonth = new Date(year, month, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const reservation = reservationsMap.get(date)
      
      availability.push({
        date,
        isAvailable: !reservation,
        ...reservation,
      })
    }
    
    return availability
  },
}

// Legacy named exports for backward compatibility
export const getHalls = hallsApi.getAll
export const getHallById = hallsApi.getById
export const createHall = hallsApi.create
export const updateHall = hallsApi.update
export const deleteHall = hallsApi.delete
export const getHallAvailability = hallsApi.getAvailability

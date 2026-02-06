import { apiClient } from '../api-client'
import { Client, CreateClientInput, PaginatedResponse } from '@/types'

export interface ClientsFilters {
  page?: number
  pageSize?: number
  search?: string
}

export const clientsApi = {
  // Get all clients with filters
  getAll: async (filters: ClientsFilters = {}): Promise<PaginatedResponse<Client>> => {
    console.log('Fetching clients with filters:', filters)
    const { data } = await apiClient.get('/clients', { params: filters })
    console.log('Raw clients response:', data)
    
    // Backend returns: { success: true, data: [...], count: 8 }
    if (data.success && data.data) {
      const result = {
        data: data.data,
        total: data.count || data.data.length,
        page: filters.page || 1,
        pageSize: filters.pageSize || data.data.length
      }
      console.log('Parsed clients result:', result)
      return result
    }
    
    // Fallback for direct data array
    console.warn('Unexpected response format, using fallback')
    return {
      data: Array.isArray(data) ? data : [],
      total: Array.isArray(data) ? data.length : 0,
      page: 1,
      pageSize: Array.isArray(data) ? data.length : 0
    }
  },

  // Get single client by ID
  getById: async (id: string): Promise<Client> => {
    const { data } = await apiClient.get(`/clients/${id}`)
    return data.data || data // Handle both structures
  },

  // Create new client
  create: async (input: CreateClientInput): Promise<Client> => {
    const { data } = await apiClient.post('/clients', input)
    return data.data || data // Handle both structures
  },

  // Update client
  update: async (id: string, input: Partial<CreateClientInput>): Promise<Client> => {
    const { data } = await apiClient.patch(`/clients/${id}`, input)
    return data.data || data // Handle both structures
  },

  // Delete client
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`)
  },
}

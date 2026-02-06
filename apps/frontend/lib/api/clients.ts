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
    const { data } = await apiClient.get('/clients', { params: filters })
    return data.data || data // Handle both structures
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

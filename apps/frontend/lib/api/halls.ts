import { apiClient } from '../api-client'
import { Hall } from '@/types'

export const hallsApi = {
  // Get all halls
  getAll: async (): Promise<Hall[]> => {
    const { data } = await apiClient.get('/halls')
    return data
  },

  // Get single hall by ID
  getById: async (id: string): Promise<Hall> => {
    const { data } = await apiClient.get(`/halls/${id}`)
    return data
  },
}

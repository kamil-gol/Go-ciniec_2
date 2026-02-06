import { apiClient } from '../api-client'
import { EventType } from '@/types'

export const eventTypesApi = {
  // Get all event types
  getAll: async (): Promise<EventType[]> => {
    const { data } = await apiClient.get('/event-types')
    return data.data || data // Handle both {data: [...]} and {success: true, data: [...]}
  },
}

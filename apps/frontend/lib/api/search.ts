import { apiClient } from '../api-client'

export interface SearchResult {
  reservations: Array<{
    id: string
    date: string | null
    status: string
    startDateTime: string | null
    endDateTime: string | null
    guestCount: number | null
    client: {
      id: string
      firstName: string
      lastName: string
      companyName: string | null
      clientType: string
    } | null
    hall: { id: string; name: string } | null
    eventType: { id: string; name: string } | null
  }>
  clients: Array<{
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string
    companyName: string | null
    clientType: string
  }>
  halls: Array<{
    id: string
    name: string
    capacity: number | null
    description: string | null
  }>
}

export const searchApi = {
  async globalSearch(query: string, limit = 5): Promise<SearchResult> {
    const { data } = await apiClient.get('/search', {
      params: { q: query, limit },
    })
    return data.data
  },
}

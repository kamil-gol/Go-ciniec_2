import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface CalendarReservation {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  guests: number
  totalPrice: string
  hall: { id: string; name: string } | null
  client: { id: string; firstName: string; lastName: string; phone: string }
  eventType: { id: string; name: string; color: string } | null
  customEventType: string | null
}

export interface CalendarHall {
  id: string
  name: string
  capacity: number
  isActive: boolean
}

export function useCalendarReservations(year: number, month: number) {
  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  return useQuery({
    queryKey: ['calendar-reservations', year, month],
    queryFn: async () => {
      const { data } = await apiClient.get('/reservations', {
        params: { dateFrom, dateTo },
      })
      return (data.data || []) as CalendarReservation[]
    },
  })
}

export function useCalendarHalls() {
  return useQuery({
    queryKey: ['calendar-halls'],
    queryFn: async () => {
      const { data } = await apiClient.get('/halls')
      return (data.data || []) as CalendarHall[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

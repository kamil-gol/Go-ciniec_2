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

/** Extract "HH:mm" in UTC from an ISO datetime string */
function utcTime(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(11, 16)
  } catch {
    return ''
  }
}

/** Extract "YYYY-MM-DD" in UTC from an ISO datetime string */
function utcDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
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
      const raw = data.data || data || []
      const list = Array.isArray(raw) ? raw : []

      // Transform: ensure each reservation has date, startTime, endTime, guests
      // The API may return full reservation objects with startDateTime/endDateTime
      // instead of the pre-formatted fields the calendar expects.
      return list.map((r: any) => ({
        ...r,
        // Use existing date field, or extract from startDateTime (UTC)
        date: r.date || (r.startDateTime ? utcDate(r.startDateTime) : null),
        // Use existing startTime, or extract from startDateTime (UTC)
        startTime: r.startTime || (r.startDateTime ? utcTime(r.startDateTime) : ''),
        // Use existing endTime, or extract from endDateTime (UTC)
        endTime: r.endTime || (r.endDateTime ? utcTime(r.endDateTime) : ''),
        // Use existing guests, or compute from adults + children + toddlers
        guests: r.guests || ((Number(r.adults) || 0) + (Number(r.children) || 0) + (Number(r.toddlers) || 0)),
        // Ensure totalPrice is a string
        totalPrice: String(r.totalPrice || '0'),
        // Normalize hall (API might return hallId + hall object)
        hall: r.hall || null,
        // Normalize client
        client: r.client || null,
        // Normalize eventType
        eventType: r.eventType || null,
      })) as CalendarReservation[]
    },
  })
}

export function useCalendarHalls() {
  return useQuery({
    queryKey: ['calendar-halls'],
    queryFn: async () => {
      const { data } = await apiClient.get('/halls')
      return (data.data || data || []) as CalendarHall[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

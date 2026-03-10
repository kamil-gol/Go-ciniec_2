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
  hall: {
    id: string
    name: string
    capacity?: number
    allowMultipleBookings?: boolean
  } | null
  client: { id: string; firstName: string; lastName: string; phone: string }
  eventType: { id: string; name: string; color: string } | null
  customEventType: string | null
}

export interface CalendarHall {
  id: string
  name: string
  capacity: number
  isActive: boolean
  allowMultipleBookings?: boolean
}

/** Extract "HH:mm" in LOCAL (Warsaw) timezone from an ISO datetime string */
function localTime(iso: string): string {
  try {
    const d = new Date(iso)
    return [
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
    ].join(':')
  } catch {
    return ''
  }
}

/** Extract "YYYY-MM-DD" in LOCAL (Warsaw) timezone from an ISO datetime string */
function localDate(iso: string): string {
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
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

      return list.map((r: any) => ({
        ...r,
        date: r.date || (r.startDateTime ? localDate(r.startDateTime) : null),
        startTime: r.startTime || (r.startDateTime ? localTime(r.startDateTime) : ''),
        endTime: r.endTime || (r.endDateTime ? localTime(r.endDateTime) : ''),
        guests: r.guests || ((Number(r.adults) || 0) + (Number(r.children) || 0) + (Number(r.toddlers) || 0)),
        totalPrice: String(r.totalPrice || '0'),
        hall: r.hall
          ? {
              id: r.hall.id,
              name: r.hall.name,
              capacity: r.hall.capacity ?? undefined,
              allowMultipleBookings: r.hall.allowMultipleBookings ?? undefined,
            }
          : null,
        client: r.client || null,
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

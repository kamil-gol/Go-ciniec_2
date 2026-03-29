import type { CalendarReservation } from '@/lib/api/calendar-api'

export function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6
  const lastDay = new Date(year, month, 0).getDate()
  const days: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i)
    days.push({ date: d, day: d.getDate(), isCurrentMonth: false })
  }
  for (let d = 1; d <= lastDay; d++) {
    days.push({ date: new Date(year, month - 1, d), day: d, isCurrentMonth: true })
  }
  while (days.length < 42) {
    const d = days.length - startDow - lastDay + 1
    const date = new Date(year, month, d)
    days.push({ date, day: date.getDate(), isCurrentMonth: false })
  }
  return days
}

export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}


export function isToday(date: Date): boolean {
  const now = new Date()
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

/** #165: Build pill tooltip — includes capacity info for multi-booking halls */
export function buildPillTooltip(
  reservation: CalendarReservation,
  allDayReservations: CalendarReservation[]
): string {
  const eventName = reservation.eventType?.name || 'Wydarzenie'
  const clientName = reservation.client
    ? `${reservation.client.firstName} ${reservation.client.lastName}`
    : 'Klient'
  const time = reservation.startTime || ''

  let base = `${eventName} — ${clientName}${time ? ` (${time})` : ''}`

  const hall = reservation.hall
  if (hall?.allowMultipleBookings && hall?.capacity && hall.capacity > 0) {
    const sameHallActive = allDayReservations.filter(
      (r) => r.hall?.id === hall.id && r.status !== 'CANCELLED'
    )
    const totalGuests = sameHallActive.reduce((sum, r) => sum + (r.guests || 0), 0)
    base += ` · ${hall.name}: ${totalGuests}/${hall.capacity} osób`
  }

  return base
}

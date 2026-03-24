/**
 * Extract a Date (midnight) in LOCAL timezone for grouping by calendar day.
 * Uses local year/month/date so that the reservation appears on the correct
 * Warsaw calendar day (not shifted by UTC offset).
 */
export function getFormattedDate(reservation: any): Date | null {
  if (reservation.startDateTime) {
    const d = new Date(reservation.startDateTime)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  if (reservation.date) {
    return new Date(reservation.date + 'T00:00:00')
  }
  return null
}

/**
 * Format the time range in LOCAL (Warsaw) timezone.
 * Data is stored as UTC with correct offset (e.g. 2026-03-07T13:00:00Z = 14:00 Warsaw),
 * so we use local accessors (getHours/getMinutes) — NOT getUTCHours.
 */
export function getFormattedTimeRange(reservation: any): string {
  if (reservation.startDateTime && reservation.endDateTime) {
    const start = new Date(reservation.startDateTime)
    const end = new Date(reservation.endDateTime)
    const sh = String(start.getHours()).padStart(2, '0')
    const sm = String(start.getMinutes()).padStart(2, '0')
    const eh = String(end.getHours()).padStart(2, '0')
    const em = String(end.getMinutes()).padStart(2, '0')
    return `${sh}:${sm} - ${eh}:${em}`
  }
  if (reservation.startTime && reservation.endTime) {
    return `${reservation.startTime} - ${reservation.endTime}`
  }
  return 'Brak czasu'
}

export function getGuestBreakdown(reservation: any): {
  adults: number;
  childrenCount: number;
  toddlers: number;
  total: number
} {
  const adults = reservation.adults || 0
  const childrenCount = reservation.children || 0
  const toddlers = reservation.toddlers || 0
  const total = reservation.guests || (adults + childrenCount + toddlers)
  return { adults, childrenCount, toddlers, total }
}

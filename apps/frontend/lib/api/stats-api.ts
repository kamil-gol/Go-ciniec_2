/**
 * Stats API — Dashboard statistics
 * Auto-refresh every 60s, refetch on mount for fresh data
 * Transforms upcoming events to handle both date/startDateTime fields
 */

import { apiClient } from '../api-client'
import { useQuery } from '@tanstack/react-query'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface DashboardOverview {
  reservationsToday: number
  reservationsThisWeek: number
  reservationsThisMonth: number
  queueCount: number
  confirmedThisMonth: number
  revenueThisMonth: number
  revenuePrevMonth: number
  revenueChangePercent: number
  totalClients: number
  newClientsThisMonth: number
  pendingDepositsCount: number
  pendingDepositsAmount: number
  activeHalls: number
}

export interface UpcomingReservation {
  id: string
  date: string | null
  startTime: string | null
  endTime: string | null
  startDateTime: string | null
  endDateTime: string | null
  guests: number
  adults: number
  children: number
  toddlers: number
  totalPrice: string
  status: string
  notes: string | null
  hall: { id: string; name: string } | null
  client: { id: string; firstName: string; lastName: string; phone: string }
  eventType: { id: string; name: string; color: string | null } | null
  deposits: { id: string; amount: string; status: string; remainingAmount: string }[]
}

// ═══════════════════════════════════════════════════════════════
// UTC HELPERS — same pattern as calendar-api.ts
// ═══════════════════════════════════════════════════════════════

/** Extract "YYYY-MM-DD" in UTC from an ISO datetime string */
function utcDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

/** Extract "HH:mm" in UTC from an ISO datetime string */
function utcTime(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(11, 16)
  } catch {
    return ''
  }
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const statsApi = {
  /** Get dashboard overview (11 metrics) */
  getOverview: async (): Promise<DashboardOverview> => {
    const { data } = await apiClient.get('/stats/overview')
    return data.data
  },

  /** Get upcoming reservations with relations */
  getUpcoming: async (limit: number = 10): Promise<UpcomingReservation[]> => {
    const { data } = await apiClient.get('/stats/upcoming', { params: { limit } })
    const raw = data.data || []

    // Transform: ensure date/startTime/endTime are populated
    // API may return startDateTime/endDateTime without separate date/startTime fields
    return raw.map((r: any) => ({
      ...r,
      date: r.date || (r.startDateTime ? utcDate(r.startDateTime) : null),
      startTime: r.startTime || (r.startDateTime ? utcTime(r.startDateTime) : null),
      endTime: r.endTime || (r.endDateTime ? utcTime(r.endDateTime) : null),
      guests: r.guests || ((Number(r.adults) || 0) + (Number(r.children) || 0) + (Number(r.toddlers) || 0)),
    })) as UpcomingReservation[]
  },
}

// ═══════════════════════════════════════════════════════════════
// REACT QUERY HOOKS
// ═══════════════════════════════════════════════════════════════

export const STATS_QUERY_KEY = 'dashboard-stats'
export const UPCOMING_QUERY_KEY = 'dashboard-upcoming'

/** Dashboard overview stats — auto-refresh 60s, always fresh on mount */
export const useDashboardOverview = () => {
  return useQuery({
    queryKey: [STATS_QUERY_KEY],
    queryFn: () => statsApi.getOverview(),
    refetchInterval: 60_000,
    staleTime: 10_000,
    refetchOnMount: 'always',
  })
}

/** Upcoming reservations — auto-refresh 60s, always fresh on mount */
export const useDashboardUpcoming = (limit: number = 10) => {
  return useQuery({
    queryKey: [UPCOMING_QUERY_KEY, limit],
    queryFn: () => statsApi.getUpcoming(limit),
    refetchInterval: 60_000,
    staleTime: 10_000,
    refetchOnMount: 'always',
  })
}

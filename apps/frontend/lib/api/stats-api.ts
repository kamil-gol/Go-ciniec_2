/**
 * Stats API — Dashboard statistics
 * Auto-refresh every 60s, stale after 30s
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
    return data.data || []
  },
}

// ═══════════════════════════════════════════════════════════════
// REACT QUERY HOOKS
// ═══════════════════════════════════════════════════════════════

export const STATS_QUERY_KEY = 'dashboard-stats'
export const UPCOMING_QUERY_KEY = 'dashboard-upcoming'

/** Dashboard overview stats — auto-refresh 60s */
export const useDashboardOverview = () => {
  return useQuery({
    queryKey: [STATS_QUERY_KEY],
    queryFn: () => statsApi.getOverview(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

/** Upcoming reservations — auto-refresh 60s */
export const useDashboardUpcoming = (limit: number = 10) => {
  return useQuery({
    queryKey: [UPCOMING_QUERY_KEY, limit],
    queryFn: () => statsApi.getUpcoming(limit),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

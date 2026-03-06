import { apiClient } from '../api-client'
import { useQuery } from '@tanstack/react-query'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type CateringOrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type CateringDeliveryType = 'DELIVERY' | 'PICKUP' | 'ON_SITE'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CateringOrderClient {
  id: string
  firstName: string
  lastName: string
  companyName?: string | null
}

export interface CateringOrderDeposit {
  id: string
  amount: string
  isPaid: boolean
  dueDate: string | null
  remainingAmount: string
}

export interface CateringOrderListItem {
  id: string
  orderNumber: string
  status: CateringOrderStatus
  deliveryType: CateringDeliveryType
  eventDate: string | null
  deliveryTime: string | null
  guestCount: number | null
  totalPrice: string
  finalPrice: string
  notes: string | null
  client: CateringOrderClient
  templateName: string | null
  packageName: string | null
  deposits: CateringOrderDeposit[]
  createdAt: string
}

export interface CateringOrdersResponse {
  data: CateringOrderListItem[]
  total: number
  page: number
  totalPages: number
}

export interface CateringOrdersFilters {
  status?: CateringOrderStatus
  deliveryType?: CateringDeliveryType
  clientId?: string
  eventDateFrom?: string
  eventDateTo?: string
  search?: string
  page?: number
  limit?: number
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const cateringOrdersApi = {
  getAll: async (filters: CateringOrdersFilters = {}): Promise<CateringOrdersResponse> => {
    const { data } = await apiClient.get('/catering/orders', { params: filters })
    if (data.success) {
      return {
        data: data.data ?? [],
        total: data.total ?? data.data?.length ?? 0,
        page: data.page ?? 1,
        totalPages: data.totalPages ?? 1,
      }
    }
    return { data: [], total: 0, page: 1, totalPages: 1 }
  },

  getById: async (id: string): Promise<CateringOrderListItem> => {
    const { data } = await apiClient.get(`/catering/orders/${id}`)
    return data.data
  },
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const CATERING_ORDERS_QUERY_KEY = 'catering-orders' as const

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Lista zamówień z dowolnymi filtrami */
export const useCateringOrders = (filters: CateringOrdersFilters = {}) =>
  useQuery({
    queryKey: [CATERING_ORDERS_QUERY_KEY, filters],
    queryFn: () => cateringOrdersApi.getAll(filters),
  })

/**
 * Zamówienia na konkretny dzień (YYYY-MM-DD).
 * Używa eventDateFrom = eventDateTo = date.
 */
export const useCateringOrdersByDate = (date: string) =>
  useQuery({
    queryKey: [CATERING_ORDERS_QUERY_KEY, 'by-date', date],
    queryFn: () =>
      cateringOrdersApi.getAll({
        eventDateFrom: date,
        eventDateTo: date,
        limit: 50,
      }),
    enabled: !!date,
    staleTime: 30_000, // 30 s — widok dzienny odświeżamy rzadziej
  })

/** Szczegóły pojedynczego zamówienia */
export const useCateringOrder = (id: string) =>
  useQuery({
    queryKey: [CATERING_ORDERS_QUERY_KEY, id],
    queryFn: () => cateringOrdersApi.getById(id),
    enabled: !!id,
  })

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const CATERING_STATUS_LABELS: Record<
  CateringOrderStatus,
  { label: string; emoji: string; classes: string }
> = {
  DRAFT: {
    label: 'Szkic',
    emoji: '📝',
    classes: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  },
  CONFIRMED: {
    label: 'Potwierdzone',
    emoji: '✅',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  IN_PROGRESS: {
    label: 'W realizacji',
    emoji: '🔄',
    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  COMPLETED: {
    label: 'Zakończone',
    emoji: '🏁',
    classes: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500',
  },
  CANCELLED: {
    label: 'Anulowane',
    emoji: '❌',
    classes: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
}

export const CATERING_DELIVERY_LABELS: Record<CateringDeliveryType, string> = {
  DELIVERY: '🚚 Dostawa',
  PICKUP: '🏃 Odbiór własny',
  ON_SITE: '🏠 Na miejscu',
}

export function formatCateringCurrency(amount: string | number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

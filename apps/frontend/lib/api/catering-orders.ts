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
  clientType?: string | null
}

/**
 * Depozyt – pola zgodne z modelem Prisma `cateringDeposit`.
 * Dostępny tylko w getById (nie w listOrders).
 */
export interface CateringOrderDeposit {
  id: string
  amount: string
  /** Prisma: `paid` (nie isPaid) */
  paid: boolean
  dueDate: string | null
  remainingAmount: string
  status?: string | null
  paymentMethod?: string | null
}

/**
 * Kształt danych zwracany przez `listOrders` (endpoint GET /catering/orders).
 *
 * UWAGA: `deposits`, `template`, `package`, `items` NIE są dołączane do
 * listOrders — tylko do getById. Pola opcjonalne (?) są dostępne wyłącznie
 * po użyciu `getById`.
 */
export interface CateringOrderListItem {
  id: string
  orderNumber: string
  status: CateringOrderStatus
  deliveryType: CateringDeliveryType

  // ── Wydarzenie ──
  eventDate: string | null       // YYYY-MM-DD
  eventTime: string | null       // HH:mm
  eventName: string | null
  eventLocation: string | null

  // ── Dostawa ──
  deliveryDate: string | null
  deliveryTime: string | null
  deliveryAddress: string | null

  // ── Goście ──
  /** Nazwa pola w Prisma: guestsCount */
  guestsCount: number | null

  // ── Ceny (Decimal w Prisma → string po JSON) ──
  totalPrice: string
  subtotal?: string
  extrasTotalPrice?: string
  discountAmount?: string

  // ── Kontakt ──
  contactName: string | null
  contactPhone: string | null
  contactEmail?: string | null

  // ── Misc ──
  notes: string | null
  specialRequirements?: string | null
  createdAt: string

  // ── Relacje z listOrders ──
  client: CateringOrderClient
  /** Liczniki z _count – dostępne w listOrders */
  _count?: { items: number; deposits: number }

  // ── Relacje tylko z getById ──
  deposits?: CateringOrderDeposit[]
  template?: { id: string; name: string; slug: string } | null
  package?: { id: string; name: string; basePrice: string } | null
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
        total: data.meta?.total ?? data.total ?? data.data?.length ?? 0,
        page: data.meta?.page ?? data.page ?? 1,
        totalPages: data.meta?.totalPages ?? data.totalPages ?? 1,
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
 *
 * eventDateTo: `${date}T23:59:59.999Z` — pokrywa cały dzień UTC.
 * Bez tego `lte: "2026-03-07"` wyklucza zamówienia dodane po 00:00Z.
 */
export const useCateringOrdersByDate = (date: string) =>
  useQuery({
    queryKey: [CATERING_ORDERS_QUERY_KEY, 'by-date', date],
    queryFn: () =>
      cateringOrdersApi.getAll({
        eventDateFrom: date,
        eventDateTo: `${date}T23:59:59.999Z`,
        limit: 50,
      }),
    enabled: !!date,
    staleTime: 30_000,
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

import { formatCurrency } from '@/lib/utils'

export const formatCateringCurrency = formatCurrency;

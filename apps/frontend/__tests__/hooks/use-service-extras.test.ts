/**
 * useServiceExtras Hook Tests
 *
 * Testy dodatków usługowych:
 * - Kategorie: pobranie listy, pobranie jednej, tworzenie, aktualizacja, usuwanie, reorder
 * - Pozycje (items): pobranie listy, pobranie jednej, tworzenie, aktualizacja, usuwanie
 * - Dodatki rezerwacji: pobranie, przypisanie, bulk assign, aktualizacja, usunięcie
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/api', () => ({
  api: mockApi,
}))

import {
  useServiceCategories,
  useServiceCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
  useServiceItems,
  useServiceItem,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReservationExtras,
  useAssignExtra,
  useBulkAssignExtras,
  useUpdateReservationExtra,
  useRemoveReservationExtra,
} from '@/hooks/use-service-extras'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// ═══ Categories — Queries ═══

describe('useServiceCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches categories', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: 'sc1', name: 'Dekoracje' }] } })
    const { result } = renderHook(() => useServiceCategories(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/service-extras/categories')
    expect(result.current.data).toEqual([{ id: 'sc1', name: 'Dekoracje' }])
  })

  it('passes activeOnly param', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [] } })
    renderHook(() => useServiceCategories(true), { wrapper: createWrapper() })
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith('/service-extras/categories?activeOnly=true'))
  })
})

describe('useServiceCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches single category', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { id: 'sc1' } } })
    const { result } = renderHook(() => useServiceCategory('sc1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/service-extras/categories/sc1')
  })

  it('is disabled for empty id', () => {
    const { result } = renderHook(() => useServiceCategory(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

// ═══ Categories — Mutations ═══

describe('useCreateCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates category', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'new', name: 'Audio' } } })
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Audio' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/service-extras/categories', { name: 'Audio' })
  })
})

describe('useUpdateCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates category', async () => {
    mockApi.put.mockResolvedValue({ data: { data: { id: 'sc1' } } })
    const { result } = renderHook(() => useUpdateCategory(), { wrapper: createWrapper() })
    result.current.mutate({ id: 'sc1', data: { name: 'Audio Pro' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.put).toHaveBeenCalledWith('/service-extras/categories/sc1', { name: 'Audio Pro' })
  })
})

describe('useDeleteCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes category', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() })
    result.current.mutate('sc1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/service-extras/categories/sc1')
  })
})

describe('useReorderCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reorders categories', async () => {
    mockApi.post.mockResolvedValue({ data: { data: [] } })
    const { result } = renderHook(() => useReorderCategories(), { wrapper: createWrapper() })
    result.current.mutate(['sc2', 'sc1'])
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/service-extras/categories/reorder', { orderedIds: ['sc2', 'sc1'] })
  })
})

// ═══ Items — Queries ═══

describe('useServiceItems', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches items', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: 'si1' }] } })
    const { result } = renderHook(() => useServiceItems(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'si1' }])
  })

  it('passes categoryId filter', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [] } })
    renderHook(() => useServiceItems(false, 'sc1'), { wrapper: createWrapper() })
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled())
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).toContain('categoryId=sc1')
  })
})

describe('useServiceItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches single item', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { id: 'si1', name: 'DJ' } } })
    const { result } = renderHook(() => useServiceItem('si1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/service-extras/items/si1')
  })

  it('is disabled for empty id', () => {
    const { result } = renderHook(() => useServiceItem(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

// ═══ Items — Mutations ═══

describe('useCreateItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates item', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'new' } } })
    const { result } = renderHook(() => useCreateItem(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'DJ', categoryId: 'sc1', price: 500 } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/service-extras/items', expect.objectContaining({ name: 'DJ' }))
  })
})

describe('useUpdateItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates item', async () => {
    mockApi.put.mockResolvedValue({ data: { data: { id: 'si1' } } })
    const { result } = renderHook(() => useUpdateItem(), { wrapper: createWrapper() })
    result.current.mutate({ id: 'si1', data: { name: 'DJ Pro' } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.put).toHaveBeenCalledWith('/service-extras/items/si1', { name: 'DJ Pro' })
  })
})

describe('useDeleteItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes item', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteItem(), { wrapper: createWrapper() })
    result.current.mutate('si1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/service-extras/items/si1')
  })
})

// ═══ Reservation Extras ═══

describe('useReservationExtras', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches extras for reservation', async () => {
    mockApi.get.mockResolvedValue({ data: { extras: [], total: 0 } })
    const { result } = renderHook(() => useReservationExtras('r1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/service-extras/reservations/r1/extras')
  })

  it('is disabled for empty reservationId', () => {
    const { result } = renderHook(() => useReservationExtras(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useAssignExtra', () => {
  beforeEach(() => vi.clearAllMocks())

  it('assigns extra to reservation', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'e1' } } })
    const { result } = renderHook(() => useAssignExtra('r1'), { wrapper: createWrapper() })
    result.current.mutate({ itemId: 'si1', quantity: 2 } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/service-extras/reservations/r1/extras', { itemId: 'si1', quantity: 2 })
  })
})

describe('useBulkAssignExtras', () => {
  beforeEach(() => vi.clearAllMocks())

  it('bulk assigns extras', async () => {
    mockApi.put.mockResolvedValue({ data: { extras: [] } })
    const { result } = renderHook(() => useBulkAssignExtras('r1'), { wrapper: createWrapper() })
    result.current.mutate({ extras: [{ itemId: 'si1', quantity: 1 }] } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.put).toHaveBeenCalledWith('/service-extras/reservations/r1/extras', expect.any(Object))
  })
})

describe('useUpdateReservationExtra', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates reservation extra', async () => {
    mockApi.put.mockResolvedValue({ data: { data: { id: 'e1' } } })
    const { result } = renderHook(() => useUpdateReservationExtra('r1'), { wrapper: createWrapper() })
    result.current.mutate({ extraId: 'e1', data: { quantity: 5 } as any })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.put).toHaveBeenCalledWith('/service-extras/reservations/r1/extras/e1', { quantity: 5 })
  })
})

describe('useRemoveReservationExtra', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes reservation extra', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useRemoveReservationExtra('r1'), { wrapper: createWrapper() })
    result.current.mutate('e1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/service-extras/reservations/r1/extras/e1')
  })
})

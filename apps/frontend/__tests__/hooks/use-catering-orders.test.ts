/**
 * useCateringOrders Hook Tests
 *
 * Testy zamówień cateringowych:
 * - Pobranie listy zamówień (z filtrami / bez)
 * - Pobranie pojedynczego zamówienia
 * - Pobranie historii zamówienia
 * - Tworzenie, aktualizacja, zmiana statusu, usuwanie zamówień
 * - Depozyty: tworzenie, aktualizacja, usuwanie, oznaczanie zapłaty
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/api', () => ({
  api: mockApi,
}))

import {
  useCateringOrders,
  useCateringOrder,
  useCateringOrderHistory,
  useCreateCateringOrder,
  useUpdateCateringOrder,
  useChangeCateringOrderStatus,
  useDeleteCateringOrder,
  useCreateCateringDeposit,
  useUpdateCateringDeposit,
  useDeleteCateringDeposit,
  useMarkDepositPaid,
} from '@/hooks/use-catering-orders'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// ═══ Queries ═══

describe('useCateringOrders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches orders without filters', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: 'o1' }], total: 1 } })
    const { result } = renderHook(() => useCateringOrders(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/catering/orders')
  })

  it('passes filter params as query string', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [], total: 0 } })
    renderHook(() => useCateringOrders({ status: 'CONFIRMED', page: 2, limit: 10 }), { wrapper: createWrapper() })
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled())
    const url = mockApi.get.mock.calls[0][0] as string
    expect(url).toContain('status=CONFIRMED')
    expect(url).toContain('page=2')
    expect(url).toContain('limit=10')
  })
})

describe('useCateringOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches single order', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { id: 'o1', status: 'DRAFT' } } })
    const { result } = renderHook(() => useCateringOrder('o1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 'o1', status: 'DRAFT' })
  })

  it('is disabled for empty id', () => {
    const { result } = renderHook(() => useCateringOrder(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCateringOrderHistory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches history for order', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: 'h1', action: 'created' }] } })
    const { result } = renderHook(() => useCateringOrderHistory('o1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/catering/orders/o1/history')
  })

  it('is disabled for empty id', () => {
    const { result } = renderHook(() => useCateringOrderHistory(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

// ═══ Mutations ═══

describe('useCreateCateringOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts new order', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'new' } } })
    const { result } = renderHook(() => useCreateCateringOrder(), { wrapper: createWrapper() })
    result.current.mutate({ clientId: 'c1' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/catering/orders', { clientId: 'c1' })
  })
})

describe('useUpdateCateringOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('patches order', async () => {
    mockApi.patch.mockResolvedValue({ data: { data: { id: 'o1' } } })
    const { result } = renderHook(() => useUpdateCateringOrder('o1'), { wrapper: createWrapper() })
    result.current.mutate({ notes: 'Updated' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.patch).toHaveBeenCalledWith('/catering/orders/o1', { notes: 'Updated' })
  })
})

describe('useChangeCateringOrderStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('patches order status', async () => {
    mockApi.patch.mockResolvedValue({ data: { data: { id: 'o1', status: 'CONFIRMED' } } })
    const { result } = renderHook(() => useChangeCateringOrderStatus('o1'), { wrapper: createWrapper() })
    result.current.mutate({ status: 'CONFIRMED' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.patch).toHaveBeenCalledWith('/catering/orders/o1/status', { status: 'CONFIRMED' })
  })
})

describe('useDeleteCateringOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes order', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteCateringOrder(), { wrapper: createWrapper() })
    result.current.mutate('o1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/catering/orders/o1')
  })
})

// ═══ Deposits ═══

describe('useCreateCateringDeposit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts deposit under order', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'd1' } } })
    const { result } = renderHook(() => useCreateCateringDeposit('o1'), { wrapper: createWrapper() })
    result.current.mutate({ amount: 500 } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/catering/orders/o1/deposits', { amount: 500 })
  })
})

describe('useUpdateCateringDeposit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('patches deposit', async () => {
    mockApi.patch.mockResolvedValue({ data: { data: { id: 'd1' } } })
    const { result } = renderHook(() => useUpdateCateringDeposit('o1', 'd1'), { wrapper: createWrapper() })
    result.current.mutate({ amount: 750 } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.patch).toHaveBeenCalledWith('/catering/orders/o1/deposits/d1', { amount: 750 })
  })
})

describe('useDeleteCateringDeposit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes deposit', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteCateringDeposit('o1'), { wrapper: createWrapper() })
    result.current.mutate('d1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/catering/orders/o1/deposits/d1')
  })
})

describe('useMarkDepositPaid', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks deposit as paid', async () => {
    mockApi.patch.mockResolvedValue({ data: { data: { id: 'd1', isPaid: true } } })
    const { result } = renderHook(() => useMarkDepositPaid('o1', 'd1'), { wrapper: createWrapper() })
    result.current.mutate({ paidAt: '2026-01-15' } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.patch).toHaveBeenCalledWith('/catering/orders/o1/deposits/d1/pay', { paidAt: '2026-01-15' })
  })
})

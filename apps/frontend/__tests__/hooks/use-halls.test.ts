import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const mockHallsApi = {
  getAll: vi.fn(),
  getById: vi.fn(),
  getAvailableCapacity: vi.fn(),
}

vi.mock('@/lib/api/halls', () => ({
  hallsApi: mockHallsApi,
}))

import { useHalls, useHall, useAvailableCapacity } from '@/hooks/use-halls'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useHalls', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches all halls', async () => {
    mockHallsApi.getAll.mockResolvedValue([{ id: 'h1', name: 'Sala A' }])
    const { result } = renderHook(() => useHalls(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 'h1', name: 'Sala A' }])
  })
})

describe('useHall', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches hall by id', async () => {
    mockHallsApi.getById.mockResolvedValue({ id: 'h1', name: 'Sala A', capacity: 200 })
    const { result } = renderHook(() => useHall('h1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Sala A')
  })

  it('is disabled for empty id', () => {
    const { result } = renderHook(() => useHall(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useAvailableCapacity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is disabled when hallId is undefined', () => {
    const { result } = renderHook(
      () => useAvailableCapacity(undefined, '2026-06-01T10:00:00', '2026-06-01T20:00:00'),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when dates are missing', () => {
    const { result } = renderHook(
      () => useAvailableCapacity('h1', undefined, undefined),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches available capacity when all params provided', async () => {
    mockHallsApi.getAvailableCapacity.mockResolvedValue({ availableCapacity: 150, bookedGuests: 50 })
    const { result } = renderHook(
      () => useAvailableCapacity('h1', '2026-06-01T10:00:00', '2026-06-01T20:00:00', 'excl1'),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockHallsApi.getAvailableCapacity).toHaveBeenCalledWith('h1', '2026-06-01T10:00:00', '2026-06-01T20:00:00', 'excl1')
  })
})

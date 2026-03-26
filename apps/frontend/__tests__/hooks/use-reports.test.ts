import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
  },
}))

vi.mock('@/lib/api', () => ({
  api: mockApi,
}))

import {
  useRevenueReport,
  useOccupancyReport,
  usePreparationsReport,
  useMenuPreparationsReport,
} from '@/hooks/use-reports'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useRevenueReport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches revenue report with filters', async () => {
    const reportData = { totalRevenue: 50000, items: [] }
    mockApi.get.mockResolvedValue({ data: { data: reportData } })

    const filters = { dateFrom: '2026-01-01', dateTo: '2026-03-31', groupBy: 'month' as const }
    const { result } = renderHook(() => useRevenueReport(filters), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(reportData)
  })

  it('is disabled when dateFrom is missing', () => {
    const filters = { dateFrom: '', dateTo: '2026-03-31' }
    const { result } = renderHook(() => useRevenueReport(filters as any), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when enabled=false', () => {
    const filters = { dateFrom: '2026-01-01', dateTo: '2026-03-31' }
    const { result } = renderHook(() => useRevenueReport(filters as any, false), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useOccupancyReport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches occupancy report', async () => {
    const reportData = { averageOccupancy: 0.75 }
    mockApi.get.mockResolvedValue({ data: { data: reportData } })

    const filters = { dateFrom: '2026-01-01', dateTo: '2026-03-31' }
    const { result } = renderHook(() => useOccupancyReport(filters as any), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(reportData)
  })

  it('is disabled when dates are empty', () => {
    const { result } = renderHook(
      () => useOccupancyReport({ dateFrom: '', dateTo: '' } as any),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('usePreparationsReport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches preparations report', async () => {
    const reportData = { preparations: [] }
    mockApi.get.mockResolvedValue({ data: { data: reportData } })

    const filters = { dateFrom: '2026-01-01', dateTo: '2026-01-31', view: 'daily' as const }
    const { result } = renderHook(() => usePreparationsReport(filters as any), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(reportData)
  })
})

describe('useMenuPreparationsReport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches menu preparations report', async () => {
    const reportData = { items: [] }
    mockApi.get.mockResolvedValue({ data: { data: reportData } })

    const filters = { dateFrom: '2026-01-01', dateTo: '2026-01-31', view: 'daily' as const }
    const { result } = renderHook(() => useMenuPreparationsReport(filters as any), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(reportData)
  })

  it('is disabled when enabled=false', () => {
    const filters = { dateFrom: '2026-01-01', dateTo: '2026-01-31', view: 'daily' as const }
    const { result } = renderHook(
      () => useMenuPreparationsReport(filters as any, false),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })
})

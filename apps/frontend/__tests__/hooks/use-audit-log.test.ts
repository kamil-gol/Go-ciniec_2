import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const mockApi = {
  get: vi.fn(),
}

vi.mock('@/lib/api', () => ({
  api: mockApi,
}))

import {
  useAuditLogs,
  useRecentAuditLogs,
  useAuditLogStatistics,
  useEntityTypes,
  useActions,
  useEntityAuditLogs,
} from '@/hooks/use-audit-log'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useAuditLogs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches audit logs without filters', async () => {
    const responseData = { data: [{ id: '1' }], total: 1 }
    mockApi.get.mockResolvedValue({ data: responseData })

    const { result } = renderHook(() => useAuditLogs(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(responseData)
  })

  it('passes filters as query params', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [], total: 0 } })
    const filters = { action: 'CREATE' as any, entityType: 'RESERVATION' as any, page: 2, pageSize: 20 }
    renderHook(() => useAuditLogs(filters), { wrapper: createWrapper() })

    await waitFor(() => {
      const callArg = mockApi.get.mock.calls[0][0] as string
      expect(callArg).toContain('action=CREATE')
      expect(callArg).toContain('entityType=RESERVATION')
      expect(callArg).toContain('page=2')
      expect(callArg).toContain('pageSize=20')
    })
  })
})

describe('useRecentAuditLogs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches recent logs with default limit', async () => {
    mockApi.get.mockResolvedValue({ data: [{ id: '1' }] })
    const { result } = renderHook(() => useRecentAuditLogs(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/audit-log/recent?limit=10')
  })

  it('accepts custom limit', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    renderHook(() => useRecentAuditLogs(5), { wrapper: createWrapper() })
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith('/audit-log/recent?limit=5'))
  })
})

describe('useAuditLogStatistics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches statistics', async () => {
    const stats = { totalActions: 100, byType: {} }
    mockApi.get.mockResolvedValue({ data: stats })
    const { result } = renderHook(() => useAuditLogStatistics(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(stats)
  })
})

describe('useEntityTypes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches available entity types', async () => {
    mockApi.get.mockResolvedValue({ data: ['RESERVATION', 'CLIENT'] })
    const { result } = renderHook(() => useEntityTypes(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['RESERVATION', 'CLIENT'])
  })
})

describe('useActions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches available actions', async () => {
    mockApi.get.mockResolvedValue({ data: ['CREATE', 'UPDATE', 'DELETE'] })
    const { result } = renderHook(() => useActions(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['CREATE', 'UPDATE', 'DELETE'])
  })
})

describe('useEntityAuditLogs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches logs for specific entity', async () => {
    mockApi.get.mockResolvedValue({ data: [{ id: '1', action: 'CREATE' }] })
    const { result } = renderHook(
      () => useEntityAuditLogs('RESERVATION' as any, 'r1'),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.get).toHaveBeenCalledWith('/audit-log/entity/RESERVATION/r1')
  })

  it('is disabled when entityType is empty', () => {
    const { result } = renderHook(
      () => useEntityAuditLogs('' as any, 'r1'),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when entityId is empty', () => {
    const { result } = renderHook(
      () => useEntityAuditLogs('RESERVATION' as any, ''),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })
})

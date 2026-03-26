import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const mockGetEventTypes = vi.fn()
const mockGetEventTypeById = vi.fn()

vi.mock('@/lib/api/event-types-api', () => ({
  getEventTypes: (...a: any[]) => mockGetEventTypes(...a),
  getEventTypeById: (...a: any[]) => mockGetEventTypeById(...a),
}))

import { useEventTypes, useEventType } from '@/hooks/use-event-types'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useEventTypes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches active event types by default', async () => {
    mockGetEventTypes.mockResolvedValue([{ id: 'e1', name: 'Wedding' }])
    const { result } = renderHook(() => useEventTypes(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetEventTypes).toHaveBeenCalledWith(true)
    expect(result.current.data).toEqual([{ id: 'e1', name: 'Wedding' }])
  })

  it('passes activeOnly=false', async () => {
    mockGetEventTypes.mockResolvedValue([])
    renderHook(() => useEventTypes(false), { wrapper: createWrapper() })
    await waitFor(() => expect(mockGetEventTypes).toHaveBeenCalledWith(false))
  })
})

describe('useEventType', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches single event type by id', async () => {
    mockGetEventTypeById.mockResolvedValue({ id: 'e1', name: 'Wedding' })
    const { result } = renderHook(() => useEventType('e1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 'e1', name: 'Wedding' })
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useEventType(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

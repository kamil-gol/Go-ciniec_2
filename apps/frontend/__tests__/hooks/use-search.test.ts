/**
 * useGlobalSearch Hook Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - Fires query when query.length >= 2
 * - Does NOT fire when query.length < 2
 * - Uses correct query key
 * - Handles empty/whitespace queries
 */
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGlobalSearch = vi.fn()

vi.mock('@/lib/api/search', () => ({
  searchApi: {
    globalSearch: (...args: any[]) => mockGlobalSearch(...args),
  },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import { useGlobalSearch } from '@/hooks/use-search'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should NOT fetch when query is shorter than 2 chars', () => {
    const { result } = renderHook(() => useGlobalSearch('a'), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGlobalSearch).not.toHaveBeenCalled()
  })

  it('should NOT fetch when query is empty', () => {
    const { result } = renderHook(() => useGlobalSearch(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGlobalSearch).not.toHaveBeenCalled()
  })

  it('should NOT fetch when query is only whitespace', () => {
    const { result } = renderHook(() => useGlobalSearch('   '), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGlobalSearch).not.toHaveBeenCalled()
  })

  it('should fetch when query has 2+ chars', async () => {
    const searchResults = { clients: [{ id: '1', name: 'Jan' }], reservations: [] }
    mockGlobalSearch.mockResolvedValue(searchResults)

    const { result } = renderHook(() => useGlobalSearch('Ja'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGlobalSearch).toHaveBeenCalledWith('Ja')
    expect(result.current.data).toEqual(searchResults)
  })

  it('should fetch with longer queries', async () => {
    mockGlobalSearch.mockResolvedValue({ clients: [], reservations: [] })

    const { result } = renderHook(() => useGlobalSearch('Kowalski'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGlobalSearch).toHaveBeenCalledWith('Kowalski')
  })

  it('should re-fetch when query changes', async () => {
    mockGlobalSearch.mockResolvedValue({ clients: [] })

    const { result, rerender } = renderHook(
      ({ q }: { q: string }) => useGlobalSearch(q),
      {
        wrapper: createWrapper(),
        initialProps: { q: 'Jan' },
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGlobalSearch).toHaveBeenCalledWith('Jan')

    mockGlobalSearch.mockResolvedValue({ clients: [{ id: '2' }] })
    rerender({ q: 'Anna' })

    await waitFor(() => expect(mockGlobalSearch).toHaveBeenCalledWith('Anna'))
  })
})

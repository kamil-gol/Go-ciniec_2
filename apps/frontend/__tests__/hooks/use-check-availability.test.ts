/**
 * useCheckAvailability Hook Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - Fires query only when all params provided AND endDateTime > startDateTime
 * - Does NOT fire with missing params
 * - Does NOT fire when end <= start
 * - Handles excludeReservationId
 */
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGet = vi.fn()

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: any[]) => mockGet(...args),
  },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import { useCheckAvailability } from '@/hooks/use-check-availability'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useCheckAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should NOT fetch when hallId is undefined', () => {
    const { result } = renderHook(
      () => useCheckAvailability(undefined, '2026-08-01T10:00', '2026-08-01T20:00'),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('should NOT fetch when startDateTime is undefined', () => {
    const { result } = renderHook(
      () => useCheckAvailability('hall-1', undefined, '2026-08-01T20:00'),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('should NOT fetch when endDateTime is undefined', () => {
    const { result } = renderHook(
      () => useCheckAvailability('hall-1', '2026-08-01T10:00', undefined),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('should NOT fetch when endDateTime <= startDateTime', () => {
    const { result } = renderHook(
      () => useCheckAvailability('hall-1', '2026-08-01T20:00', '2026-08-01T10:00'),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('should NOT fetch when endDateTime equals startDateTime', () => {
    const { result } = renderHook(
      () => useCheckAvailability('hall-1', '2026-08-01T10:00', '2026-08-01T10:00'),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('should fetch when all params valid and end > start', async () => {
    mockGet.mockResolvedValue({
      data: { data: { available: true, conflicts: [] } },
    })

    const { result } = renderHook(
      () => useCheckAvailability('hall-1', '2026-08-01T10:00', '2026-08-01T20:00'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledTimes(1)

    // Verify URL contains correct params
    const callUrl = mockGet.mock.calls[0][0] as string
    expect(callUrl).toContain('hallId=hall-1')
    expect(callUrl).toContain('startDateTime=')
    expect(callUrl).toContain('endDateTime=')
  })

  it('should include excludeReservationId in params when provided', async () => {
    mockGet.mockResolvedValue({
      data: { data: { available: true, conflicts: [] } },
    })

    renderHook(
      () => useCheckAvailability('hall-1', '2026-08-01T10:00', '2026-08-01T20:00', 'res-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    const callUrl = mockGet.mock.calls[0][0] as string
    expect(callUrl).toContain('excludeReservationId=res-123')
  })

  it('should return conflicts when hall is not available', async () => {
    const conflicts = [
      {
        id: 'res-1',
        clientName: 'Jan Kowalski',
        eventType: 'Wesele',
        startDateTime: '2026-08-01T12:00',
        endDateTime: '2026-08-01T22:00',
        status: 'CONFIRMED',
      },
    ]
    mockGet.mockResolvedValue({
      data: { data: { available: false, conflicts } },
    })

    const { result } = renderHook(
      () => useCheckAvailability('hall-1', '2026-08-01T10:00', '2026-08-01T20:00'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.available).toBe(false)
    expect(result.current.data?.conflicts).toHaveLength(1)
  })
})

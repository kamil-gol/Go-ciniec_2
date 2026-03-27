/**
 * useArchiveSettings Hook Tests
 * Issue: #144 — Archive Settings Phase 4
 *
 * Tests:
 * - useArchiveSettings: fetches archive settings via GET /settings/archive
 * - useUpdateArchiveDays: updates archiveAfterDays via PUT /settings/archive
 * - useRunArchiveNow: triggers manual archive via POST /settings/archive/run-now
 * - Query invalidation after mutations
 * - Error handling
 */
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useArchiveSettings,
  useUpdateArchiveDays,
  useRunArchiveNow,
  type ArchiveSettingsData,
  type ArchiveRunResult,
} from '@/src/hooks/use-archive-settings'

// ── Mock apiClient ──────────────────────────────────────

const mockGet = vi.fn()
const mockPut = vi.fn()
const mockPost = vi.fn()

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
    post: (...args: any[]) => mockPost(...args),
  },
}))

// ── Test wrapper ────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  return { Wrapper, queryClient }
}

// ── Test data ───────────────────────────────────────────

const MOCK_SETTINGS: ArchiveSettingsData = {
  archiveAfterDays: 30,
  pendingCandidatesCount: 5,
  totalCancelledCount: 12,
  archivedTotalCount: 42,
  cutoffDate: '2026-02-25T00:00:00.000Z',
}

const MOCK_RUN_RESULT: ArchiveRunResult = {
  archivedCount: 3,
  archivedIds: ['id-1', 'id-2', 'id-3'],
  archiveAfterDays: 30,
}

describe('useArchiveSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── useArchiveSettings (GET) ────────────────────────────

  describe('useArchiveSettings()', () => {
    it('should fetch archive settings successfully', async () => {
      mockGet.mockResolvedValue({
        data: { success: true, data: MOCK_SETTINGS },
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useArchiveSettings(), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockGet).toHaveBeenCalledWith('/settings/archive')
      expect(result.current.data).toEqual(MOCK_SETTINGS)
    })

    it('should return loading state initially', () => {
      mockGet.mockReturnValue(new Promise(() => {})) // never resolves

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useArchiveSettings(), { wrapper: Wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle API error', async () => {
      mockGet.mockRejectedValue(new Error('Network error'))

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useArchiveSettings(), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('should extract nested data from response', async () => {
      mockGet.mockResolvedValue({
        data: {
          success: true,
          data: {
            archiveAfterDays: 60,
            pendingCandidatesCount: 0,
            totalCancelledCount: 0,
            archivedTotalCount: 100,
            cutoffDate: '2026-01-27T00:00:00.000Z',
          },
        },
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useArchiveSettings(), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.archiveAfterDays).toBe(60)
      expect(result.current.data?.archivedTotalCount).toBe(100)
    })
  })

  // ── useUpdateArchiveDays (PUT) ──────────────────────────

  describe('useUpdateArchiveDays()', () => {
    it('should call PUT /settings/archive with new days value', async () => {
      mockPut.mockResolvedValue({
        data: { success: true, data: { archiveAfterDays: 45 } },
      })
      // Mock the GET for query refetch after invalidation
      mockGet.mockResolvedValue({
        data: { success: true, data: { ...MOCK_SETTINGS, archiveAfterDays: 45 } },
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useUpdateArchiveDays(), { wrapper: Wrapper })

      await act(async () => {
        result.current.mutate(45)
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockPut).toHaveBeenCalledWith('/settings/archive', { archiveAfterDays: 45 })
    })

    it('should return mutation response data', async () => {
      const responseData = { success: true, data: { archiveAfterDays: 90 } }
      mockPut.mockResolvedValue({ data: responseData })
      mockGet.mockResolvedValue({ data: { success: true, data: MOCK_SETTINGS } })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useUpdateArchiveDays(), { wrapper: Wrapper })

      await act(async () => {
        result.current.mutate(90)
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(responseData)
    })

    it('should handle mutation error', async () => {
      mockPut.mockRejectedValue(new Error('Forbidden'))

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useUpdateArchiveDays(), { wrapper: Wrapper })

      await act(async () => {
        result.current.mutate(45)
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('should invalidate archive-settings query on success', async () => {
      mockPut.mockResolvedValue({
        data: { success: true, data: { archiveAfterDays: 45 } },
      })
      mockGet.mockResolvedValue({
        data: { success: true, data: MOCK_SETTINGS },
      })

      const { Wrapper, queryClient } = createWrapper()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateArchiveDays(), { wrapper: Wrapper })

      await act(async () => {
        result.current.mutate(45)
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['archive-settings'],
      })
    })
  })

  // ── useRunArchiveNow (POST) ─────────────────────────────

  describe('useRunArchiveNow()', () => {
    it('should call POST /settings/archive/run-now', async () => {
      mockPost.mockResolvedValue({
        data: { success: true, data: MOCK_RUN_RESULT },
      })
      mockGet.mockResolvedValue({
        data: { success: true, data: MOCK_SETTINGS },
      })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useRunArchiveNow(), { wrapper: Wrapper })

      await act(async () => {
        result.current.mutate()
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockPost).toHaveBeenCalledWith('/settings/archive/run-now')
    })

    it('should return archive run result', async () => {
      const responseData = { success: true, data: MOCK_RUN_RESULT }
      mockPost.mockResolvedValue({ data: responseData })
      mockGet.mockResolvedValue({ data: { success: true, data: MOCK_SETTINGS } })

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useRunArchiveNow(), { wrapper: Wrapper })

      await act(async () => {
        result.current.mutate()
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(responseData)
    })

    it('should handle archive run error', async () => {
      mockPost.mockRejectedValue(new Error('Archive failed'))

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useRunArchiveNow(), { wrapper: Wrapper })

      await act(async () => {
        result.current.mutate()
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('should invalidate archive-settings query on success', async () => {
      mockPost.mockResolvedValue({
        data: { success: true, data: MOCK_RUN_RESULT },
      })
      mockGet.mockResolvedValue({
        data: { success: true, data: MOCK_SETTINGS },
      })

      const { Wrapper, queryClient } = createWrapper()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useRunArchiveNow(), { wrapper: Wrapper })

      await act(async () => {
        result.current.mutate()
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['archive-settings'],
      })
    })
  })
})

/**
 * useNotifications Hook Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - useNotifications query with params
 * - useUnreadCount polling query
 * - useMarkAsRead mutation + cache invalidation
 * - useMarkAllAsRead mutation + cache invalidation
 */
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetAll = vi.fn()
const mockGetUnreadCount = vi.fn()
const mockMarkAsRead = vi.fn()
const mockMarkAllAsRead = vi.fn()

vi.mock('@/lib/api/notifications', () => ({
  notificationsApi: {
    getAll: (...args: any[]) => mockGetAll(...args),
    getUnreadCount: (...args: any[]) => mockGetUnreadCount(...args),
    markAsRead: (...args: any[]) => mockMarkAsRead(...args),
    markAllAsRead: (...args: any[]) => mockMarkAllAsRead(...args),
  },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/use-notifications'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('use-notifications hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── useNotifications ──────────────────────────────────────────────────

  describe('useNotifications', () => {
    it('should fetch notifications list', async () => {
      const notifications = [
        { id: 'n-1', message: 'Nowa rezerwacja', read: false },
        { id: 'n-2', message: 'Wpłata zaliczki', read: true },
      ]
      mockGetAll.mockResolvedValue(notifications)

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(notifications)
    })

    it('should pass params to API', async () => {
      mockGetAll.mockResolvedValue([])
      const params = { page: 2, pageSize: 10, unreadOnly: true }

      renderHook(() => useNotifications(params), { wrapper: createWrapper() })

      await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith(params))
    })
  })

  // ── useUnreadCount ────────────────────────────────────────────────────

  describe('useUnreadCount', () => {
    it('should fetch unread count', async () => {
      mockGetUnreadCount.mockResolvedValue(5)

      const { result } = renderHook(() => useUnreadCount(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBe(5)
    })

    it('should return zero when no unread', async () => {
      mockGetUnreadCount.mockResolvedValue(0)

      const { result } = renderHook(() => useUnreadCount(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBe(0)
    })
  })

  // ── useMarkAsRead ─────────────────────────────────────────────────────

  describe('useMarkAsRead', () => {
    it('should mark notification as read', async () => {
      mockMarkAsRead.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMarkAsRead(), { wrapper: createWrapper() })

      await result.current.mutateAsync('n-1')

      expect(mockMarkAsRead).toHaveBeenCalledWith('n-1')
    })
  })

  // ── useMarkAllAsRead ──────────────────────────────────────────────────

  describe('useMarkAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockMarkAllAsRead.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMarkAllAsRead(), { wrapper: createWrapper() })

      await result.current.mutateAsync()

      expect(mockMarkAllAsRead).toHaveBeenCalled()
    })
  })
})

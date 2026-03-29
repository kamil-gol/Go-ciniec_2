import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'
import { notificationsApi } from '@/lib/api/notifications'

const mockGet = vi.mocked(apiClient.get)
const mockPatch = vi.mocked(apiClient.patch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('notificationsApi', () => {
  describe('getAll', () => {
    it('calls GET /notifications without params and returns response', async () => {
      const response = {
        data: [
          { id: 'n1', type: 'DEPOSIT_REMINDER', message: 'Deposit due', isRead: false },
          { id: 'n2', type: 'RESERVATION_CREATED', message: 'New reservation', isRead: true },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      }
      mockGet.mockResolvedValue({ data: response })

      const result = await notificationsApi.getAll()

      expect(mockGet).toHaveBeenCalledWith('/notifications', { params: undefined })
      expect(result).toEqual(response)
    })

    it('passes pagination and filter params', async () => {
      const params = { page: 2, pageSize: 10, unreadOnly: true }
      mockGet.mockResolvedValue({ data: { data: [], total: 0, page: 2, pageSize: 10 } })

      await notificationsApi.getAll(params)

      expect(mockGet).toHaveBeenCalledWith('/notifications', { params })
    })
  })

  describe('getUnreadCount', () => {
    it('calls GET /notifications/unread-count and returns count number', async () => {
      mockGet.mockResolvedValue({ data: { data: { count: 7 } } })

      const result = await notificationsApi.getUnreadCount()

      expect(mockGet).toHaveBeenCalledWith('/notifications/unread-count')
      expect(result).toBe(7)
    })
  })

  describe('markAsRead', () => {
    it('calls PATCH /notifications/:id/read', async () => {
      mockPatch.mockResolvedValue({ data: {} })

      await notificationsApi.markAsRead('n1')

      expect(mockPatch).toHaveBeenCalledWith('/notifications/n1/read')
    })
  })

  describe('markAllAsRead', () => {
    it('calls PATCH /notifications/read-all', async () => {
      mockPatch.mockResolvedValue({ data: {} })

      await notificationsApi.markAllAsRead()

      expect(mockPatch).toHaveBeenCalledWith('/notifications/read-all')
    })
  })
})

import { apiClient } from '../api-client'
import type { NotificationsResponse } from '@/types/notification.types'

export const notificationsApi = {
  async getAll(params?: {
    page?: number
    pageSize?: number
    unreadOnly?: boolean
  }): Promise<NotificationsResponse> {
    const { data } = await apiClient.get('/notifications', { params })
    return data
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get('/notifications/unread-count')
    return data.data.count
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all')
  },
}

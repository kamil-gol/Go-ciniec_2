export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  entityType: string | null
  entityId: string | null
  createdAt: string
}

export interface NotificationPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface NotificationsResponse {
  data: Notification[]
  pagination: NotificationPagination
}

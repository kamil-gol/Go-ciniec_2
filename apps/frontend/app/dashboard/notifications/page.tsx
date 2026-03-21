'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Calendar, CreditCard, ArrowUpFromLine } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from '@/hooks/use-notifications'
import type { Notification } from '@/types/notification.types'

const typeIcons: Record<string, typeof Bell> = {
  RESERVATION_CREATED: Calendar,
  RESERVATION_UPDATED: Calendar,
  STATUS_CHANGED: Calendar,
  DEPOSIT_OVERDUE: CreditCard,
  DEPOSIT_REMINDER: CreditCard,
  QUEUE_PROMOTED: ArrowUpFromLine,
}

const typeColors: Record<string, string> = {
  RESERVATION_CREATED: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  RESERVATION_UPDATED: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  STATUS_CHANGED: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  DEPOSIT_OVERDUE: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  DEPOSIT_REMINDER: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  QUEUE_PROMOTED: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
}

function getNotificationLink(notif: Notification): string | null {
  if (!notif.entityType) return null
  const type = notif.entityType.toLowerCase()
  switch (type) {
    case 'reservation':
      return notif.entityId
        ? `/dashboard/reservations/${notif.entityId}`
        : '/dashboard/reservations'
    case 'deposit':
      return '/dashboard/deposits'
    case 'queue':
      return '/dashboard/queue'
    default:
      return null
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'Dzisiaj'
  if (diffDays === 1) return 'Wczoraj'
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

function groupByDay(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {}
  for (const notif of notifications) {
    const dayKey = new Date(notif.createdAt).toISOString().substring(0, 10)
    if (!groups[dayKey]) groups[dayKey] = []
    groups[dayKey].push(notif)
  }
  return groups
}

export default function NotificationsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data, isLoading } = useNotifications({
    page,
    pageSize: 20,
    unreadOnly: filter === 'unread',
  })
  const { data: unreadCount = 0 } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const notifications = data?.data || []
  const pagination = data?.pagination

  const handleClick = (notif: Notification) => {
    if (!notif.read) {
      markAsRead.mutate(notif.id)
    }
    const link = getNotificationLink(notif)
    if (link) router.push(link)
  }

  const groupedNotifications = groupByDay(notifications)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Powiadomienia
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {unreadCount} nieprzeczytanych
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Oznacz wszystkie
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setFilter('all'); setPage(1) }}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            filter === 'all'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          )}
        >
          Wszystkie
        </button>
        <button
          onClick={() => { setFilter('unread'); setPage(1) }}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            filter === 'unread'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          )}
        >
          Nieprzeczytane
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-indigo-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {filter === 'unread' ? 'Brak nieprzeczytanych powiadomień' : 'Brak powiadomień'}
          </p>
        </div>
      )}

      {/* Notifications grouped by day */}
      {!isLoading && Object.entries(groupedNotifications).map(([dayKey, dayNotifs]) => (
        <div key={dayKey} className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 px-1">
            {formatDate(dayNotifs[0].createdAt)}
          </h2>
          <div className="space-y-2">
            {dayNotifs.map((notif, i) => {
              const Icon = typeIcons[notif.type] || Bell
              const colorClass = typeColors[notif.type] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleClick(notif)}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md',
                    !notif.read
                      ? 'bg-white dark:bg-neutral-800 border-indigo-200/60 dark:border-indigo-800/40 shadow-sm'
                      : 'bg-neutral-50/50 dark:bg-neutral-800/50 border-neutral-200/50 dark:border-neutral-700/30'
                  )}
                >
                  <div className={cn('flex-shrink-0 p-2.5 rounded-xl', colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm',
                        !notif.read ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'font-medium text-neutral-700 dark:text-neutral-300'
                      )}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Poprzednia
          </button>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {page} z {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Następna
          </button>
        </div>
      )}
    </div>
  )
}

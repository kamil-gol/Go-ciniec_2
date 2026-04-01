// apps/frontend/components/audit-log/EntityActivityTimeline.tsx
// US-9.8: Reusable entity activity timeline component
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { motionTokens } from '@/lib/design-tokens'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Clock, ChevronDown, ChevronUp, History, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useEntityActivityLog } from '@/lib/api/audit-log'
import { actionLabels, actionColors, fieldLabels, HIDDEN_FIELDS } from './timeline/timeline.constants'
import { formatFieldValue, getActionIcon, getIconBgColor } from './timeline/timeline.utils'
import type { AuditLogEntry } from '@/types/audit-log.types'

// ─── Renderer szczegółów zmian ───
function ChangeDetails({ details }: { details: AuditLogEntry['details'] }) {
  if (!details) return null

  const changes = details.changes
  if (!changes || Object.keys(changes).length === 0) return null

  const visibleEntries = Object.entries(changes).filter(([field]) => !HIDDEN_FIELDS.has(field))
  if (visibleEntries.length === 0) return null

  return (
    <div className="mt-2 space-y-2.5">
      {visibleEntries.map(([field, value]) => {
        const label = fieldLabels[field] || field

        // Obiekt z wartościami old/new
        if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
          const oldFormatted = formatFieldValue(field, value.old)
          const newFormatted = formatFieldValue(field, value.new)

          if (oldFormatted === null && newFormatted === null) return null

          return (
            <div key={field} className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{label}:</span>
              <div className="flex items-center gap-2 pl-3 flex-wrap">
                {oldFormatted !== null && (
                  <span className="text-red-600 dark:text-red-400 line-through bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded">
                    {oldFormatted}
                  </span>
                )}
                {oldFormatted !== null && newFormatted !== null && (
                  <span className="text-neutral-500">→</span>
                )}
                {newFormatted !== null && (
                  <span className="text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded">
                    {newFormatted}
                  </span>
                )}
              </div>
            </div>
          )
        }

        // Prosta wartość
        const formatted = formatFieldValue(field, value)
        if (formatted === null) return null

        return (
          <div key={field} className="text-xs">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{label}:</span>{' '}
            <span className="text-neutral-600 dark:text-neutral-300">{formatted}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Pojedynczy element timeline ───
function TimelineItem({ log, index, isLast }: { log: AuditLogEntry; index: number; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)

  const hasDetails = (() => {
    if (!log.details?.changes) return false
    const visibleKeys = Object.keys(log.details.changes).filter(k => !HIDDEN_FIELDS.has(k))
    return visibleKeys.length > 0
  })()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      className="flex gap-4"
    >
      {/* Linia timeline */}
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${getIconBgColor(log.action)} text-white shadow-md`}>
          {getActionIcon(log.action)}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700 mt-2 min-h-[24px]" />
        )}
      </div>

      {/* Treść */}
      <div className={`flex-1 ${!isLast ? 'pb-6' : 'pb-2'}`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${actionColors[log.action] || 'bg-neutral-100 text-neutral-700'}`}
            >
              {actionLabels[log.action] || log.action}
            </Badge>
            {hasDetails && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Zwiń' : 'Szczegóły'}
              </button>
            )}
          </div>
          <time className="text-xs text-neutral-500 dark:text-neutral-300 whitespace-nowrap flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', { locale: pl })}
          </time>
        </div>

        {/* Opis */}
        {log.details?.description && (
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            {log.details.description}
          </p>
        )}

        {/* Powód */}
        {log.details?.reason && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 italic mb-1">
            Powód: {log.details.reason}
          </p>
        )}

        {/* Użytkownik */}
        {log.user && (
          <p className="text-xs text-neutral-500 dark:text-neutral-300">
            przez {log.user.firstName} {log.user.lastName}
          </p>
        )}

        {/* Rozwijalne szczegóły zmian */}
        <AnimatePresence>
          {expanded && hasDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: motionTokens.duration.fast }}
              className="overflow-hidden"
            >
              <div className="mt-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-neutral-200/50 dark:border-neutral-700/30">
                <ChangeDetails details={log.details} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Skeleton ładowania ───
function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
            {i < 3 && <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700 mt-2" />}
          </div>
          <div className="flex-1 pb-6 space-y-2">
            <div className="flex justify-between">
              <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
            <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Główny komponent ───
interface EntityActivityTimelineProps {
  entityType: string
  entityId: string
}

export function EntityActivityTimeline({ entityType, entityId }: EntityActivityTimelineProps) {
  const { data: logs, isLoading, isError } = useEntityActivityLog(entityType, entityId)

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Historia zmian</h2>
          </div>
          <TimelineSkeleton />
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="border-0 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Historia zmian</h2>
          </div>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-neutral-600 dark:text-neutral-300">
              Nie udało się załadować historii zmian
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="border-0 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Historia zmian</h2>
          </div>
          <div className="text-center py-12">
            <History className="h-16 w-16 text-neutral-300 dark:text-neutral-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-neutral-500 dark:text-neutral-300">
              Brak historii zmian
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
              Zmiany dokonane na tym elemencie pojawią się tutaj
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Historia zmian</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-300">
                {logs.length} {logs.length === 1 ? 'wpis' : logs.length < 5 ? 'wpisy' : 'wpisów'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-0">
          {logs.map((log, index) => (
            <TimelineItem
              key={log.id}
              log={log}
              index={index}
              isLast={index === logs.length - 1}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

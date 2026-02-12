'use client'

import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'
import { ReservationHistory as HistoryType, ChangeType } from '@/types'
import { CheckCircle2, Edit, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

function getChangeIcon(changeType: ChangeType) {
  switch (changeType) {
    case 'CREATED':
      return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
    case 'UPDATED':
      return <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    case 'STATUS_CHANGED':
      return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    case 'CANCELLED':
      return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
    default:
      return <AlertCircle className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
  }
}

function getChangeLabel(changeType: ChangeType) {
  switch (changeType) {
    case 'CREATED':
      return 'Utworzono'
    case 'UPDATED':
      return 'Zaktualizowano'
    case 'STATUS_CHANGED':
      return 'Zmiana statusu'
    case 'CANCELLED':
      return 'Anulowano'
    default:
      return changeType
  }
}

interface ReservationHistoryProps {
  history: HistoryType[]
}

export function ReservationHistory({ history }: ReservationHistoryProps) {
  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex gap-4"
        >
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
              {getChangeIcon(item.changeType)}
            </div>
            {index < history.length - 1 && (
              <div className="w-0.5 h-full bg-neutral-200 dark:bg-neutral-700 mt-2" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="flex items-start justify-between mb-1">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {getChangeLabel(item.changeType)}
              </p>
              <time className="text-sm text-neutral-500 dark:text-neutral-400">
                {formatDate(item.createdAt, 'dd.MM.yyyy HH:mm')}
              </time>
            </div>

            {item.changedByUser && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                przez {item.changedByUser.firstName} {item.changedByUser.lastName}
              </p>
            )}

            {(item.oldValue || item.newValue) && (
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 text-sm space-y-1 border border-neutral-200/50 dark:border-neutral-700/30">
                {item.oldValue && (
                  <p>
                    <span className="text-neutral-500 dark:text-neutral-400">Przed:</span>{' '}
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.oldValue}</span>
                  </p>
                )}
                {item.newValue && (
                  <p>
                    <span className="text-neutral-500 dark:text-neutral-400">Po:</span>{' '}
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.newValue}</span>
                  </p>
                )}
              </div>
            )}

            {item.reason && (
              <div className="mt-2">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Powód:</p>
                <p className="text-sm italic text-neutral-600 dark:text-neutral-300">{item.reason}</p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

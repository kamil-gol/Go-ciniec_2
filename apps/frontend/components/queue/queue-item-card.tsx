'use client'

import { QueueItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Phone, Mail, ArrowUp, ArrowDown, Check, Pencil } from 'lucide-react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import { EntityListItem } from '@/components/shared'

const accent = moduleAccents.queue

interface QueueItemCardProps {
  item: QueueItem
  isFirst: boolean
  isLast: boolean
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onPromote?: (id: string) => void
  onEdit?: (id: string) => void
}

export function QueueItemCard({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onPromote,
  onEdit,
}: QueueItemCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && !isFirst && onMoveUp) {
      e.preventDefault()
      onMoveUp(item.id)
    } else if (e.key === 'ArrowDown' && !isLast && onMoveDown) {
      e.preventDefault()
      onMoveDown(item.id)
    }
  }

  return (
    <EntityListItem
      role="listitem"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Pozycja ${item.position}: ${item.client.firstName} ${item.client.lastName}`}
      className="focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Position Badge */}
        <div className="flex-shrink-0">
          <div className={cn(
            'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-md',
            accent.iconBg
          )}>
            #{item.position}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
              {item.client.firstName} {item.client.lastName}
            </h3>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-300">
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {item.client.phone}
              </div>
              {item.client.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {item.client.email}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-300">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(parseISO(item.queueDate), 'd MMMM yyyy', { locale: pl })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-300">
              <Users className="h-3.5 w-3.5" />
              <span>{item.guests} osób</span>
            </div>
          </div>

          {item.notes && (
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-300 italic">
              {item.notes}
            </p>
          )}

          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
            Dodane {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true, locale: pl })}
            {' przez '}
            {item.createdBy.firstName} {item.createdBy.lastName}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5">
          {onPromote && (
            <Button
              size="sm"
              onClick={() => onPromote(item.id)}
              aria-label="Awansuj do rezerwacji"
              className={cn(
                'whitespace-nowrap bg-gradient-to-r text-white shadow-md hover:shadow-lg rounded-xl',
                accent.gradient
              )}
            >
              <Check className="h-4 w-4 mr-1" />
              Awansuj
            </Button>
          )}

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item.id)}
              className="whitespace-nowrap rounded-xl border-neutral-200 dark:border-neutral-700"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edytuj
            </Button>
          )}

          <div className="flex gap-1">
            {!isFirst && onMoveUp && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onMoveUp(item.id)}
                title="Przesuń w górę"
                aria-label="Przesuń w górę"
                className="rounded-xl border-neutral-200 dark:border-neutral-700 h-9 w-9"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
            {!isLast && onMoveDown && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onMoveDown(item.id)}
                title="Przesuń w dół"
                aria-label="Przesuń w dół"
                className="rounded-xl border-neutral-200 dark:border-neutral-700 h-9 w-9"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </EntityListItem>
  )
}

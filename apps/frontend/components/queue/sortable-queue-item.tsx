'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { QueueItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Phone, Mail, Check, Pencil, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'

const accent = moduleAccents.queue

interface SortableQueueItemProps {
  item: QueueItem
  isFirst: boolean
  isLast: boolean
  onPromote?: () => void
  onEdit?: () => void
  disabled?: boolean
}

export function SortableQueueItem({
  item,
  onPromote,
  onEdit,
  disabled = false,
}: SortableQueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} role="listitem" aria-label={`Pozycja ${item.position}: ${item.client.firstName} ${item.client.lastName}`}>
      <div className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-5">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div
            className={cn(
              'flex-shrink-0 touch-none touch-manipulation p-3 -m-2',
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-grab active:cursor-grabbing'
            )}
            aria-label="Przeciągnij aby zmienić kolejność"
            {...attributes}
            {...listeners}
          >
            <div className="flex flex-col items-center gap-1">
              <GripVertical className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              <div className={cn(
                'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-md',
                accent.iconBg
              )}>
                #{item.position}
              </div>
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
                  {format(new Date(item.queueDate), 'd MMMM yyyy', { locale: pl })}
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

            <div className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
              Dodane {format(new Date(item.createdAt), 'd MMM yyyy HH:mm', { locale: pl })}
              {' przez '}
              {item.createdBy.firstName} {item.createdBy.lastName}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5">
            {onPromote && (
              <Button
                size="sm"
                onClick={onPromote}
                disabled={disabled}
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
                onClick={onEdit}
                disabled={disabled}
                className="whitespace-nowrap rounded-xl border-neutral-200 dark:border-neutral-700"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edytuj
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

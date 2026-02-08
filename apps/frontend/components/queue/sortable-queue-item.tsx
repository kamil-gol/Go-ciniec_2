'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { QueueItem } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Phone, Mail, Check, Pencil, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

interface SortableQueueItemProps {
  item: QueueItem
  isFirst: boolean
  isLast: boolean
  onPromote?: () => void
  onEdit?: () => void
  disabled?: boolean // ✨ BUG #6 FIX: Add disabled prop
}

export function SortableQueueItem({
  item,
  isFirst,
  isLast,
  onPromote,
  onEdit,
  disabled = false, // ✨ BUG #6 FIX
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
    disabled, // ✨ BUG #6 FIX: Disable sortable when loading
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              className={`flex-shrink-0 touch-none ${
                disabled 
                  ? 'cursor-not-allowed opacity-50' // ✨ BUG #6 FIX: Disabled styling
                  : 'cursor-grab active:cursor-grabbing'
              }`}
              {...attributes}
              {...listeners}
            >
              <div className="flex flex-col items-center gap-1">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    #{item.position}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Client Info */}
              <div className="mb-2">
                <h3 className="font-semibold text-lg">
                  {item.client.firstName} {item.client.lastName}
                </h3>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {item.client.phone}
                  </div>
                  {item.client.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {item.client.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Queue Date & Guests */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(item.queueDate), 'd MMMM yyyy', { locale: pl })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{item.guests} osób</span>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="mt-2 text-sm text-muted-foreground italic">
                  {item.notes}
                </p>
              )}

              {/* Created Info */}
              <div className="mt-2 text-xs text-muted-foreground">
                Dodane {format(new Date(item.createdAt), 'd MMM yyyy HH:mm', { locale: pl })}
                {' przez '}
                {item.createdBy.firstName} {item.createdBy.lastName}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {/* Promote to Reservation */}
              {onPromote && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onPromote}
                  disabled={disabled} // ✨ BUG #6 FIX: Disable buttons when loading
                  className="whitespace-nowrap"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Awansuj
                </Button>
              )}

              {/* Edit */}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  disabled={disabled} // ✨ BUG #6 FIX: Disable buttons when loading
                  className="whitespace-nowrap"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edytuj
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

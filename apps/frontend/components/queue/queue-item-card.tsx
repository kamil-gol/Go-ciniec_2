'use client'

import { QueueItem } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Phone, Mail, ArrowUp, ArrowDown, Check, Pencil } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

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
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Position Badge */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                #{item.position}
              </span>
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
                  {format(parseISO(item.queueDate), 'd MMMM yyyy', { locale: pl })}
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
              Dodane {format(parseISO(item.createdAt), 'd MMM yyyy HH:mm', { locale: pl })}
              {' przez '}
              {item.createdBy.firstName} {item.createdBy.lastName}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            {/* Promote to Reservation */}
            {onPromote && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPromote(item.id)}
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
                onClick={() => onEdit(item.id)}
                className="whitespace-nowrap"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edytuj
              </Button>
            )}

            {/* Move Up/Down */}
            <div className="flex gap-1">
              {!isFirst && onMoveUp && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onMoveUp(item.id)}
                  title="Przesuwanie w górę"
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
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

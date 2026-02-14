'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText, Pencil, Trash2, Theater, MoreHorizontal } from 'lucide-react'
import { type EventType, type EventTypeStats } from '@/lib/api/event-types-api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface EventTypeCardProps {
  eventType: EventType
  stats?: EventTypeStats
  onUpdate: () => void
}

export function EventTypeCard({ eventType, stats, onUpdate }: EventTypeCardProps) {
  const { toast } = useToast()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const reservationCount = stats?.reservationCount ?? 0
  const templateCount = stats?.menuTemplateCount ?? 0

  const colorStyle = eventType.color
    ? { backgroundColor: eventType.color }
    : { backgroundColor: '#9CA3AF' }

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-neutral-200 dark:border-neutral-700">
      {/* Color bar at top */}
      <div
        className="h-2 w-full"
        style={colorStyle}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
              style={colorStyle}
            >
              <Theater className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                {eventType.name}
              </h3>
              {!eventType.isActive && (
                <Badge variant="secondary" className="text-xs mt-0.5">
                  Nieaktywny
                </Badge>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 transition-opacity ${
                  dropdownOpen
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg"
            >
              <DropdownMenuItem
                onClick={() => {
                  toast({ title: 'Wkrótce', description: 'Edycja typu — Faza 4' })
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  toast({ title: 'Wkrótce', description: 'Usuwanie typu — Faza 4' })
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {eventType.description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2">
            {eventType.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 pt-4 border-t border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <Calendar className="h-4 w-4 text-violet-500" />
            <span className="font-medium">{reservationCount}</span>
            <span className="text-neutral-400">{reservationCount === 1 ? 'rezerwacja' : 'rezerwacji'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="font-medium">{templateCount}</span>
            <span className="text-neutral-400">{templateCount === 1 ? 'szablon' : 'szablonów'}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

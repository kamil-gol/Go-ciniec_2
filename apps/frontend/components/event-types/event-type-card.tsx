'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Calendar, FileText, Pencil, Trash2, Theater, MoreHorizontal } from 'lucide-react'
import { type EventType, type EventTypeStats, updateEventType } from '@/lib/api/event-types-api'
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
  onEdit: (eventType: EventType) => void
  onDelete: (eventType: EventType) => void
}

export function EventTypeCard({ eventType, stats, onUpdate, onEdit, onDelete }: EventTypeCardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [toggling, setToggling] = useState(false)
  const reservationCount = stats?.reservationCount ?? 0
  const templateCount = stats?.menuTemplateCount ?? 0

  const colorStyle = eventType.color
    ? { backgroundColor: eventType.color }
    : { backgroundColor: '#9CA3AF' }

  const handleToggleActive = async (checked: boolean) => {
    try {
      setToggling(true)
      await updateEventType(eventType.id, { isActive: checked })
      toast({
        title: checked ? 'Aktywowany' : 'Dezaktywowany',
        description: `Typ "${eventType.name}" ${checked ? 'jest teraz aktywny' : 'został dezaktywowany'}`,
      })
      onUpdate()
    } catch (error: any) {
      toast({ title: 'Błąd', description: 'Nie udało się zmienić statusu', variant: 'destructive' })
    } finally {
      setToggling(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="menuitem"]') || target.closest('[role="switch"]')) {
      return
    }
    router.push(`/dashboard/event-types/${eventType.id}`)
  }

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-neutral-200 dark:border-neutral-700 cursor-pointer"
      onClick={handleCardClick}
    >
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
              style={colorStyle}
            >
              <Theater className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                {eventType.name}
              </h3>
              {!eventType.isActive && (
                <Badge variant="default" className="text-xs mt-0.5 bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
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
                className={`h-8 w-8 p-0 shrink-0 transition-opacity ${
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
              <DropdownMenuItem onClick={() => onEdit(eventType)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(eventType)}
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

        {/* Footer: Stats + Toggle */}
        <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
          {/* Stats row */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-300">
              <Calendar className="h-4 w-4 shrink-0 text-violet-500" />
              <span className="font-medium">{reservationCount}</span>
              <span className="text-neutral-400">{reservationCount === 1 ? 'rezerwacja' : 'rezerwacji'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-300">
              <FileText className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="font-medium">{templateCount}</span>
              <span className="text-neutral-400">{templateCount === 1 ? 'szablon' : 'szablonów'}</span>
            </div>
          </div>

          {/* Toggle row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {eventType.isActive ? 'Aktywny' : 'Nieaktywny'}
            </span>
            <Switch
              checked={eventType.isActive}
              onCheckedChange={handleToggleActive}
              disabled={toggling}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

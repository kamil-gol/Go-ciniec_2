'use client'

import { Hall, deleteHall, updateHall } from '@/lib/api/halls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Users, Calendar, MoreVertical, Eye, Edit, Trash2, CheckCircle2, Building2, UsersRound, UserCheck } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useState } from 'react'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import { toast } from 'sonner'

const accent = moduleAccents.halls

interface HallCardProps {
  hall: Hall
  onUpdate: () => void
}

export function HallCard({ hall, onUpdate }: HallCardProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const [deleting, setDeleting] = useState(false)
  const [togglingMultiple, setTogglingMultiple] = useState(false)

  const handleDelete = async () => {
    if (hall.isWholeVenue) {
      toast.error('Nie można usunąć sali "Cały Obiekt". Jest wymagana do logiki rezerwacji.')
      return
    }

    if (!await confirm({ title: 'Usuwanie sali', description: `Czy na pewno chcesz usunąć salę "${hall.name}"?`, variant: 'destructive', confirmLabel: 'Usuń' })) return

    try {
      setDeleting(true)
      await deleteHall(hall.id)
      toast.success(`Sala "${hall.name}" została usunięta`)
      onUpdate()
    } catch (error: any) {
      console.error('Error deleting hall:', error)
      toast.error(error.response?.data?.message || 'Nie udało się usunąć sali')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleMultipleBookings = async () => {
    try {
      setTogglingMultiple(true)
      await updateHall(hall.id, { allowMultipleBookings: !hall.allowMultipleBookings })
      toast.success(hall.allowMultipleBookings
          ? `Sala "${hall.name}" — tryb wyłączności (jedna rezerwacja)`
          : `Sala "${hall.name}" — tryb wielu rezerwacji`)
      onUpdate()
    } catch (error: any) {
      console.error('Error toggling multiple bookings:', error)
      toast.error(error.response?.data?.message || 'Nie udało się zmienić trybu rezerwacji')
    } finally {
      setTogglingMultiple(false)
    }
  }

  return (
    <div className="group rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              'p-2.5 rounded-xl bg-gradient-to-br shadow-md flex-shrink-0',
              hall.isWholeVenue
                ? 'from-amber-500 to-orange-500'
                : accent.iconBg
            )}>
              {hall.isWholeVenue
                ? <Building2 className="h-5 w-5 text-white" />
                : <Users className="h-5 w-5 text-white" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                'text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight truncate',
                `group-hover:${accent.text} dark:group-hover:${accent.textDark}`,
                'transition-colors'
              )}>
                {hall.name}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {hall.isWholeVenue && (
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 shadow-none">
                    <Building2 className="h-3 w-3 mr-1" />
                    Cały Obiekt
                  </Badge>
                )}
                {hall.isActive ? (
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0 shadow-none">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Aktywna
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 shadow-none">Nieaktywna</Badge>
                )}
                {/* #165: Multiple bookings badge */}
                {hall.allowMultipleBookings ? (
                  <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-0 shadow-none">
                    <UsersRound className="h-3 w-3 mr-1" />
                    Wiele rezerwacji
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0 shadow-none">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Wyłączność
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={deleting}
                className="rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700"
                aria-label="Opcje sali"
              >
                <MoreVertical className="h-5 w-5 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/50 shadow-xl"
            >
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/halls/${hall.id}`}
                  className="cursor-pointer flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 rounded-lg"
                >
                  <Eye className="mr-3 h-4 w-4 text-sky-600 dark:text-sky-400" />
                  Szczegóły
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/halls/${hall.id}/edit`}
                  className="cursor-pointer flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 rounded-lg"
                >
                  <Edit className="mr-3 h-4 w-4 text-sky-600 dark:text-sky-400" />
                  Edytuj
                </Link>
              </DropdownMenuItem>
              {!hall.isWholeVenue && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleting}
                    className="cursor-pointer flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    {deleting ? 'Usuwanie...' : 'Usuń'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 space-y-4">
        {/* Capacity */}
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-xl border',
          hall.isWholeVenue
            ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/50'
            : `${accent.badge} border-sky-200/50 dark:border-sky-800/50`
        )}>
          <div className={cn(
            'p-2 rounded-lg bg-gradient-to-br shadow-sm',
            hall.isWholeVenue
              ? 'from-amber-500 to-orange-500'
              : accent.iconBg
          )}>
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Pojemność</div>
            <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{hall.capacity} osób</div>
          </div>
        </div>

        {/* #165: Multiple bookings toggle (inline) */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 bg-neutral-50/50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <Label htmlFor={`multi-${hall.id}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
              Wiele rezerwacji
            </Label>
          </div>
          <Switch
            id={`multi-${hall.id}`}
            checked={hall.allowMultipleBookings}
            onCheckedChange={handleToggleMultipleBookings}
            disabled={togglingMultiple}
          />
        </div>

        {/* Description */}
        {hall.description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {hall.description}
          </p>
        )}

        {/* Amenities */}
        {hall.amenities && hall.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hall.amenities.slice(0, 3).map((amenity, idx) => (
              <Badge
                key={idx}
                variant="default"
                className="text-xs bg-transparent border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg"
              >
                {amenity}
              </Badge>
            ))}
            {hall.amenities.length > 3 && (
              <Badge
                variant="default"
                className={cn(
                  'text-xs rounded-lg bg-transparent border',
                  accent.badge, accent.badgeText,
                  'border-sky-200/50 dark:border-sky-800/50'
                )}
              >
                +{hall.amenities.length - 3} więcej
              </Badge>
            )}
          </div>
        )}

        {/* CTA Button */}
        <div className="pt-1">
          <Link href={`/dashboard/halls/${hall.id}`}>
            <Button
              className={cn(
                'w-full bg-gradient-to-r text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl',
                hall.isWholeVenue
                  ? 'from-amber-500 to-orange-500'
                  : accent.gradient
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Zobacz Kalendarz
            </Button>
          </Link>
        </div>
      </div>
      {ConfirmDialog}
    </div>
  )
}

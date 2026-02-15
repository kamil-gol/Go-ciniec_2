'use client'

import { Hall, deleteHall } from '@/lib/api/halls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, MoreVertical, Eye, Edit, Trash2, CheckCircle2, Building2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'

const accent = moduleAccents.halls

interface HallCardProps {
  hall: Hall
  onUpdate: () => void
}

export function HallCard({ hall, onUpdate }: HallCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (hall.isWholeVenue) {
      toast({
        title: 'Operacja zablokowana',
        description: 'Nie mo\u017cna usun\u0105\u0107 sali "Ca\u0142y Obiekt". Jest wymagana do logiki rezerwacji.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Czy na pewno chcesz usun\u0105\u0107 sal\u0119 "${hall.name}"?`)) return

    try {
      setDeleting(true)
      await deleteHall(hall.id)
      toast({
        title: 'Sukces',
        description: `Sala "${hall.name}" zosta\u0142a usuni\u0119ta`,
      })
      onUpdate()
    } catch (error: any) {
      console.error('Error deleting hall:', error)
      toast({
        title: 'B\u0142\u0105d',
        description: error.response?.data?.message || 'Nie uda\u0142o si\u0119 usun\u0105\u0107 sali',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
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
              <div className="flex items-center gap-2 mt-2">
                {hall.isWholeVenue && (
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 shadow-none">
                    <Building2 className="h-3 w-3 mr-1" />
                    Ca\u0142y Obiekt
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
                  Szczeg\u00f3\u0142y
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
                    {deleting ? 'Usuwanie...' : 'Usu\u0144'}
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
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Pojemno\u015b\u0107</div>
            <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{hall.capacity} os\u00f3b</div>
          </div>
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
                variant="outline"
                className="text-xs border-neutral-200 dark:border-neutral-700 rounded-lg"
              >
                {amenity}
              </Badge>
            ))}
            {hall.amenities.length > 3 && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs rounded-lg',
                  accent.badge, accent.badgeText,
                  'border-sky-200/50 dark:border-sky-800/50'
                )}
              >
                +{hall.amenities.length - 3} wi\u0119cej
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
    </div>
  )
}

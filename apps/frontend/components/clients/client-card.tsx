'use client'

import { Client } from '@/types'
import { User, Mail, Phone, MapPin, Calendar, Trash2, Edit, ChevronRight, StickyNote } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'

const accent = moduleAccents.clients

interface ClientCardProps {
  client: Client & { _count?: { reservations: number }; address?: string; notes?: string }
  onDelete?: (id: string) => void
  canDelete?: boolean
}

export default function ClientCard({ client, onDelete, canDelete = false }: ClientCardProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const reservationsCount = client._count?.reservations || 0
  const hasReservations = reservationsCount > 0

  const isNewClient = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return new Date(client.createdAt) >= thirtyDaysAgo
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasReservations) {
      toast.error('Nie można usunąć klienta, który ma rezerwacje!')
      return
    }

    if (await confirm({ title: 'Usuwanie klienta', description: `Czy na pewno chcesz usunąć klienta: ${client.firstName} ${client.lastName}?`, variant: 'destructive', confirmLabel: 'Usuń' })) {
      onDelete?.(client.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="group relative rounded-2xl bg-white dark:bg-neutral-800/80 p-6 shadow-md hover:shadow-lg border border-neutral-200/80 dark:border-neutral-700/50 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Header: Avatar + Name + Badges */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          <div className={cn(
            'w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-md',
            accent.iconBg
          )}>
            <User className="w-7 h-7" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate mb-1">
            {client.firstName} {client.lastName}
          </h3>

          <div className="flex flex-wrap gap-2">
            {hasReservations && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <Calendar className="w-3 h-3" />
                {reservationsCount} {reservationsCount === 1 ? 'rezerwacja' : 'rezerwacji'}
              </span>
            )}

            {isNewClient() && (
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                accent.badge, accent.badgeText
              )}>
                Nowy klient
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {client.email && (
          <a
            href={`mailto:${client.email}`}
            className={cn(
              'flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 transition-colors',
              `hover:${accent.text} dark:hover:${accent.textDark}`
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate" title={client.email}>{client.email}</span>
          </a>
        )}

        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className={cn(
              'flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 transition-colors',
              `hover:${accent.text} dark:hover:${accent.textDark}`
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{client.phone}</span>
          </a>
        )}

        {client.address && (
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{client.address}</span>
          </div>
        )}

        {client.notes && (
          <div className="flex items-start gap-2 text-sm text-neutral-500 dark:text-neutral-500">
            <StickyNote className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{client.notes}</span>
          </div>
        )}
      </div>

      {/* Footer: Date + Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200/80 dark:border-neutral-700/50">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-500">
          <Calendar className="w-3.5 h-3.5" />
          Dodano: {format(new Date(client.createdAt), 'd MMM yyyy', { locale: pl })}
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'p-2 rounded-lg text-neutral-500 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors',
              `hover:${accent.text} dark:hover:${accent.textDark}`
            )}
            title="Edytuj klienta"
            aria-label="Edytuj klienta"
          >
            <Edit className="w-4 h-4" />
          </Link>

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={hasReservations}
              className={cn(
                'p-2 rounded-lg transition-colors',
                hasReservations
                  ? 'text-neutral-300 dark:text-neutral-400 cursor-not-allowed'
                  : 'text-neutral-500 dark:text-neutral-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
              )}
              title={hasReservations ? 'Nie można usunąć klienta z rezerwacjami' : 'Usuń klienta'}
              aria-label={hasReservations ? 'Nie można usunąć klienta z rezerwacjami' : 'Usuń klienta'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <Link
            href={`/dashboard/clients/${client.id}`}
            className={cn(
              'p-2 rounded-lg text-neutral-500 dark:text-neutral-300 transition-colors',
              `hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:${accent.text} dark:hover:${accent.textDark}`
            )}
            title="Szczegóły klienta"
            aria-label="Szczegóły klienta"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      {ConfirmDialog}
    </motion.div>
  )
}

'use client'

import { Client } from '@/types'
import { User, Mail, Phone, MapPin, Calendar, Trash2, Edit, ChevronRight, StickyNote } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

interface ClientCardProps {
  client: Client & { _count?: { reservations: number } }
  onDelete?: (id: string) => void
  canDelete?: boolean
}

export default function ClientCard({ client, onDelete, canDelete = false }: ClientCardProps) {
  const reservationsCount = client._count?.reservations || 0
  const hasReservations = reservationsCount > 0

  // Check if client is new (created within last 30 days)
  const isNewClient = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return new Date(client.createdAt) >= thirtyDaysAgo
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (hasReservations) {
      alert('Nie można usunąć klienta, który ma rezerwacje!')
      return
    }

    if (confirm(`Czy na pewno chcesz usunąć klienta: ${client.firstName} ${client.lastName}?`)) {
      onDelete?.(client.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700 hover:shadow-medium transition-all duration-300"
    >
      {/* Header: Avatar + Name + Badges */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg shadow-soft">
            <User className="w-7 h-7" />
          </div>
        </div>

        {/* Name + Badges */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate mb-1">
            {client.firstName} {client.lastName}
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {/* Reservations Badge */}
            {hasReservations && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <Calendar className="w-3 h-3" />
                {reservationsCount} {reservationsCount === 1 ? 'rezerwacja' : 'rezerwacji'}
              </span>
            )}

            {/* New Client Badge */}
            {isNewClient() && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                ✨ Nowy klient
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {/* Email */}
        {client.email && (
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </a>
        )}

        {/* Phone */}
        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{client.phone}</span>
          </a>
        )}

        {/* Address */}
        {client.address && (
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{client.address}</span>
          </div>
        )}

        {/* Notes Preview */}
        {client.notes && (
          <div className="flex items-start gap-2 text-sm text-neutral-500 dark:text-neutral-500">
            <StickyNote className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{client.notes}</span>
          </div>
        )}
      </div>

      {/* Footer: Date + Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
        {/* Created Date */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-500">
          <Calendar className="w-3.5 h-3.5" />
          Dodano: {format(new Date(client.createdAt), 'd MMM yyyy', { locale: pl })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-primary-500 transition-colors"
            title="Edytuj klienta"
          >
            <Edit className="w-4 h-4" />
          </Link>

          {/* Delete Button (only for ADMIN and if no reservations) */}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={hasReservations}
              className={`p-2 rounded-lg transition-colors ${
                hasReservations
                  ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
              }`}
              title={hasReservations ? 'Nie można usunąć klienta z rezerwacjami' : 'Usuń klienta'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Details Link */}
          <Link
            href={`/dashboard/clients/${client.id}`}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-500 transition-colors"
            title="Szczegóły klienta"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Hover Effect Gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 to-secondary-500/0 group-hover:from-primary-500/5 group-hover:to-secondary-500/5 transition-all duration-300 pointer-events-none" />
    </motion.div>
  )
}

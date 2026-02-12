'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, Mail, Phone, Calendar, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'

const accent = moduleAccents.clients

interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  createdAt: string
  _count?: {
    reservations: number
  }
}

interface ClientsListProps {
  clients: Client[]
  searchQuery?: string
  onUpdate?: () => void
}

export function ClientsList({ clients, searchQuery, onUpdate }: ClientsListProps) {
  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase()
    const email = client.email?.toLowerCase() || ''
    const phone = client.phone.toLowerCase()

    return fullName.includes(query) || email.includes(query) || phone.includes(query)
  })

  if (filteredClients.length === 0) {
    return (
      <div className="text-center py-16">
        <div className={cn(
          'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4 shadow-md',
          accent.iconBg
        )}>
          <User className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {searchQuery ? 'Nie znaleziono klientów' : 'Brak klientów'}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400">
          {searchQuery
            ? 'Spróbuj zmienić kryteria wyszukiwania'
            : 'Dodaj pierwszego klienta, aby rozpocząć'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {filteredClients.map((client) => (
        <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
          <div className="group rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className={cn(
                    'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-md',
                    accent.iconBg
                  )}>
                    {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                  </div>
                  {client._count && client._count.reservations > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{client._count.reservations}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h3 className={cn(
                    'text-lg font-bold text-neutral-900 dark:text-neutral-100 transition-colors',
                    `group-hover:${accent.text} dark:group-hover:${accent.textDark}`
                  )}>
                    {client.firstName} {client.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {client.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{client.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-4">
                {client._count && (
                  <div className={cn(
                    'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border',
                    accent.badge, accent.badgeText,
                    'border-violet-200/50 dark:border-violet-800/50'
                  )}>
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {client._count.reservations} {client._count.reservations === 1 ? 'rezerwacja' : 'rezerwacji'}
                    </span>
                  </div>
                )}

                <ChevronRight className={cn(
                  'h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:translate-x-1 transition-all',
                  `group-hover:${accent.text} dark:group-hover:${accent.textDark}`
                )} />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

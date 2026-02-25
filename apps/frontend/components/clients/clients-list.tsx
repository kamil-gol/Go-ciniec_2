'use client'

import Link from 'next/link'
import { User, Building2, Mail, Phone, Calendar, ChevronRight, ShieldCheck, ShieldAlert, Trash2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import type { ClientType, ClientContact } from '@/types'

const accent = moduleAccents.clients

interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  createdAt: string
  isDeleted?: boolean
  clientType?: ClientType
  companyName?: string
  nip?: string
  contacts?: ClientContact[]
  _count?: {
    reservations: number
  }
}

interface ClientsListProps {
  clients: Client[]
  searchQuery?: string
  rodoMap?: Record<string, boolean>
  onUpdate?: () => void
}

export function ClientsList({ clients, searchQuery, rodoMap = {}, onUpdate }: ClientsListProps) {
  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase()
    const email = client.email?.toLowerCase() || ''
    const phone = client.phone.toLowerCase()
    const companyName = client.companyName?.toLowerCase() || ''
    const nip = client.nip?.toLowerCase() || ''

    return fullName.includes(query) || email.includes(query) || phone.includes(query) || companyName.includes(query) || nip.includes(query)
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
      {filteredClients.map((client) => {
        const hasRodo = rodoMap[client.id]
        const rodoChecked = client.id in rodoMap
        const isDeleted = client.isDeleted === true
        const isCompany = client.clientType === 'COMPANY'
        const primaryContact = client.contacts?.find(c => c.isPrimary)

        return (
          <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
            <div className={cn(
              'group rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer p-5',
              isDeleted && 'opacity-60 border-red-200/50 dark:border-red-800/30'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={cn(
                      'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-md',
                      isDeleted
                        ? 'from-gray-400 to-gray-500'
                        : isCompany
                          ? 'from-purple-500 to-indigo-600'
                          : accent.iconBg
                    )}>
                      {isDeleted ? (
                        <Trash2 className="h-5 w-5" />
                      ) : isCompany ? (
                        <Building2 className="h-5 w-5" />
                      ) : (
                        <>{client.firstName.charAt(0)}{client.lastName.charAt(0)}</>
                      )}
                    </div>
                    {!isDeleted && client._count && client._count.reservations > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{client._count.reservations}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={cn(
                        'text-lg font-bold text-neutral-900 dark:text-neutral-100 transition-colors',
                        isDeleted ? 'text-neutral-500 dark:text-neutral-500' : `group-hover:${accent.text} dark:group-hover:${accent.textDark}`
                      )}>
                        {isCompany && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`}
                      </h3>
                      {/* Client Type Badge */}
                      {!isDeleted && isCompany && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          <Building2 className="h-3 w-3" />
                          Firma
                        </span>
                      )}
                      {/* Deleted Badge */}
                      {isDeleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <Trash2 className="h-3 w-3" />
                          Usunięty
                        </span>
                      )}
                      {/* RODO Badge */}
                      {!isDeleted && rodoChecked && (
                        hasRodo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <ShieldCheck className="h-3 w-3" />
                            RODO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <ShieldAlert className="h-3 w-3" />
                            Brak RODO
                          </span>
                        )
                      )}
                    </div>

                    {/* Company: show contact person name */}
                    {!isDeleted && isCompany && (
                      <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                        <User className="h-3 w-3" />
                        <span>{client.firstName} {client.lastName}</span>
                        {primaryContact && (
                          <>
                            <span className="mx-1">·</span>
                            <Star className="h-3 w-3 text-amber-500" />
                            <span>{primaryContact.firstName} {primaryContact.lastName}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Contact details */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                      {client.email && !isDeleted && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {!isDeleted && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {!isDeleted && isCompany && client.nip && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-neutral-400">NIP:</span>
                          <span>{client.nip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                  {!isDeleted && client._count && (
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
        )
      })}
    </div>
  )
}

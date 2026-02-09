'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, Mail, Phone, Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
  searchQuery: string
  onUpdate?: () => void
}

export function ClientsList({ clients, searchQuery, onUpdate }: ClientsListProps) {
  // Filter clients based on search query
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
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {searchQuery ? 'Nie znaleziono klientów' : 'Brak klientów'}
        </h3>
        <p className="text-muted-foreground">
          {searchQuery 
            ? 'Spróbuj zmienić kryteria wyszukiwania' 
            : 'Dodaj pierwszego klienta, aby rozpocząć'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredClients.map((client) => (
        <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
          <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                    </div>
                    {client._count && client._count.reservations > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{client._count.reservations}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold group-hover:text-orange-600 transition-colors">
                      {client.firstName} {client.lastName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                  {/* Reservations Badge */}
                  {client._count && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {client._count.reservations} {client._count.reservations === 1 ? 'rezerwacja' : 'rezerwacji'}
                      </span>
                    </div>
                  )}

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

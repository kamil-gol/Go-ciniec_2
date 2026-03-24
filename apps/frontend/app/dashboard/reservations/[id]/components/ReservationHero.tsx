'use client'

import { ArrowLeft, Calendar, Archive, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusChanger } from '@/components/reservations/editable'
import type { ReservationStatus } from '@/types'
import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

interface ReservationHeroProps {
  reservation: {
    id: string
    status: ReservationStatus
    archivedAt?: string | null
  }
  eventDate: Date | null
  isArchived: boolean
  isReadOnly: boolean
  downloading: boolean
  onDownloadPDF: () => void
  onRefetch: () => void
}

export function ReservationHero({
  reservation,
  eventDate,
  isArchived,
  isReadOnly,
  downloading,
  onDownloadPDF,
  onRefetch,
}: ReservationHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-5 sm:p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />

      <div className="relative z-10 space-y-4 sm:space-y-6">
        <Link href="/dashboard/reservations">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrot do listy
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold">Rezerwacja #{reservation.id.slice(0, 8)}</h1>
                <p className="text-white/90 text-base sm:text-lg mt-1">Szczegoly rezerwacji</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isArchived && reservation.status !== 'ARCHIVED' && (
                <Badge className="bg-neutral-200 text-neutral-800 border-neutral-300">
                  <Archive className="h-3 w-3 mr-1" />
                  Zarchiwizowane
                </Badge>
              )}
              <StatusChanger
                reservationId={reservation.id}
                currentStatus={reservation.status}
                onStatusChanged={onRefetch}
                disabled={isReadOnly}
              />
              {eventDate && (
                <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(eventDate, 'dd MMMM yyyy', { locale: pl })}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <Button
              size="lg"
              onClick={onDownloadPDF}
              disabled={downloading}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
            >
              <Download className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">{downloading ? 'Pobieranie...' : 'Pobierz PDF'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
    </div>
  )
}

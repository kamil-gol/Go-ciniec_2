'use client'

import { Calendar, Archive, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusChanger } from '@/components/reservations/editable'
import { DetailHero } from '@/components/shared/DetailHero'
import type { ReservationStatus } from '@/types'
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
    <DetailHero
      gradient="from-blue-600 via-cyan-600 to-teal-600"
      backHref="/dashboard/reservations"
      backLabel="Powrot do listy"
      icon={Calendar}
      title={`Rezerwacja #${reservation.id.slice(0, 8)}`}
      subtitle="Szczegoly rezerwacji"
      badges={
        <>
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
        </>
      }
      actions={
        <Button
          size="lg"
          onClick={onDownloadPDF}
          disabled={downloading}
          className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
        >
          <Download className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">{downloading ? 'Pobieranie...' : 'Pobierz PDF'}</span>
        </Button>
      }
    />
  )
}

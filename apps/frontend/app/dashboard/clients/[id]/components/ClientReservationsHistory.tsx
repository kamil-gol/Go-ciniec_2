'use client'

import Link from 'next/link'
import { Calendar, Clock, CheckCircle2, XCircle, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Oczekująca',
  CONFIRMED: 'Potwierdzona',
  CANCELLED: 'Anulowana',
  COMPLETED: 'Zakończona',
}

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  PENDING: { color: 'bg-orange-500', icon: Clock },
  CONFIRMED: { color: 'bg-green-500', icon: CheckCircle2 },
  CANCELLED: { color: 'bg-red-500', icon: XCircle },
  COMPLETED: { color: 'bg-blue-500', icon: CheckCircle2 },
}

interface ClientReservationsHistoryProps {
  reservations: any[]
  clientId: string
  isDeleted: boolean
}

export function ClientReservationsHistory({ reservations, clientId, isDeleted }: ClientReservationsHistoryProps) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">Brak rezerwacji</p>
        <p className="text-sm text-muted-foreground mt-1">Ten klient nie ma jeszcze żadnych rezerwacji</p>
        {!isDeleted && (
          <Link href={`/dashboard/reservations/list?create=true&clientId=${clientId}`}>
            <Button className="mt-4" size="lg">
              <Calendar className="mr-2 h-4 w-4" />
              Utwórz pierwszą rezerwację
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation: any) => {
        const eventDate = reservation.startDateTime
          ? new Date(reservation.startDateTime)
          : reservation.date
          ? new Date(reservation.date)
          : null

        const statusCfg = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.PENDING
        const StatusIcon = statusCfg.icon
        const statusLabel = STATUS_LABELS[reservation.status] || reservation.status

        return (
          <Link key={reservation.id} href={`/dashboard/reservations/${reservation.id}`}>
            <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusCfg.color} text-white border-0`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusLabel}
                      </Badge>
                      {eventDate && (
                        <span className="text-sm text-muted-foreground">
                          {format(eventDate, 'dd MMM yyyy', { locale: pl })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{reservation.hall?.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{reservation.eventType?.name}</span>
                      <span>{"\u2022"}</span>
                      <span>{(reservation.adults || 0) + (reservation.children || 0) + (reservation.toddlers || 0)} osób</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-2xl font-bold">{Number(reservation.totalPrice || 0).toLocaleString('pl-PL')} zł</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

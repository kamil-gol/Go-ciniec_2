'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { useReservation } from '@/hooks/use-reservations'
import { formatDate, formatTime, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Calendar, Clock, Users, Home, User, FileText, DollarSign } from 'lucide-react'
import { ReservationHistory } from './reservation-history'

interface ReservationDetailsModalProps {
  reservationId: string
  open: boolean
  onClose: () => void
}

// Helper to format date/time from either old or new format
function getFormattedDate(reservation: any): string {
  if (reservation.startDateTime) {
    return formatDate(reservation.startDateTime)
  }
  if (reservation.date) {
    return formatDate(reservation.date)
  }
  return 'N/A'
}

function getFormattedTimeRange(reservation: any): string {
  // New format with DateTime
  if (reservation.startDateTime && reservation.endDateTime) {
    const start = new Date(reservation.startDateTime)
    const end = new Date(reservation.endDateTime)
    return `${start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // Old format with separate time fields
  if (reservation.startTime && reservation.endTime) {
    return `${formatTime(reservation.startTime)} - ${formatTime(reservation.endTime)}`
  }
  
  return 'N/A'
}

export function ReservationDetailsModal({
  reservationId,
  open,
  onClose,
}: ReservationDetailsModalProps) {
  const { data: reservation, isLoading } = useReservation(reservationId)

  console.log('Reservation details:', reservation)

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <Loading size="lg" />
        </DialogContent>
      </Dialog>
    )
  }

  if (!reservation) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Szczegóły Rezerwacji</span>
            <Badge className={getStatusColor(reservation.status)}>
              {getStatusLabel(reservation.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-secondary-600">Data</p>
                <p className="font-medium">{getFormattedDate(reservation)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-secondary-600">Godziny</p>
                <p className="font-medium">{getFormattedTimeRange(reservation)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-secondary-600">Sala</p>
                <p className="font-medium">{reservation.hall?.name || 'N/A'}</p>
                {reservation.hall?.capacity && (
                  <p className="text-sm text-secondary-500">
                    Pojemność: {reservation.hall.capacity} osób
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-secondary-600">Liczba gości</p>
                <p className="font-medium">{reservation.guests || 0} osób</p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-secondary-600 mb-1">Klient</p>
                {reservation.client ? (
                  <div className="space-y-1">
                    <p className="font-medium">
                      {reservation.client.firstName} {reservation.client.lastName}
                    </p>
                    {reservation.client.email && (
                      <p className="text-sm text-secondary-600">{reservation.client.email}</p>
                    )}
                    {reservation.client.phone && (
                      <p className="text-sm text-secondary-600">{reservation.client.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-500">Brak danych klienta</p>
                )}
              </div>
            </div>
          </div>

          {/* Event Type */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-secondary-600">Typ wydarzenia</p>
                <p className="font-medium">{reservation.eventType?.name || 'N/A'}</p>
                
                {/* Custom event type for "Inne" */}
                {reservation.customEventType && (
                  <p className="text-sm text-secondary-600 mt-1">
                    Szczegóły: {reservation.customEventType}
                  </p>
                )}
                
                {/* Anniversary details */}
                {reservation.eventType?.name === 'Rocznica' && (
                  <div className="text-sm text-secondary-600 mt-1 space-y-0.5">
                    {reservation.anniversaryYear && (
                      <p>Która: {reservation.anniversaryYear} rocznica</p>
                    )}
                    {reservation.anniversaryOccasion && (
                      <p>Okazja: {reservation.anniversaryOccasion}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-secondary-600">Cena całkowita</p>
                <p className="text-2xl font-bold text-primary-600">
                  {reservation.totalPrice ? formatCurrency(reservation.totalPrice) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Deposits */}
          {reservation.deposits && reservation.deposits.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-secondary-700 mb-2">Zaliczki</p>
              <div className="space-y-2">
                {reservation.deposits.map((deposit: any) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-3 bg-secondary-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{formatCurrency(deposit.amount)}</p>
                      <p className="text-sm text-secondary-600">
                        Termin: {formatDate(deposit.dueDate)}
                      </p>
                    </div>
                    <Badge variant={deposit.paid ? 'success' : 'warning'}>
                      {deposit.paid ? 'Opłacona' : 'Nieopłacona'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {reservation.notes && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-secondary-700 mb-2">Notatki</p>
              <p className="text-sm text-secondary-600 whitespace-pre-wrap">{reservation.notes}</p>
            </div>
          )}

          {/* History */}
          {reservation.history && reservation.history.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-secondary-700 mb-4">Historia zmian</p>
              <ReservationHistory history={reservation.history} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { useReservation } from '@/hooks/use-reservations'
import { formatDate, formatTime, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Calendar, Clock, Users, Home, User, FileText, DollarSign, Baby, AlertCircle, CheckCircle, Edit } from 'lucide-react'
import { ReservationHistory } from './reservation-history'
import { UpdateDepositStatusModal } from '../deposits/update-deposit-status-modal'
import { useQueryClient } from '@tanstack/react-query'

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

// Calculate event duration in hours
function calculateDuration(reservation: any): number {
  if (reservation.startDateTime && reservation.endDateTime) {
    const start = new Date(reservation.startDateTime)
    const end = new Date(reservation.endDateTime)
    const diffMs = end.getTime() - start.getTime()
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10 // Round to 1 decimal
  }
  return 0
}

// Helper to get Polish payment method label
function getPaymentMethodLabel(method: string): string {
  const methodMap: Record<string, string> = {
    'CASH': 'Gotówka',
    'TRANSFER': 'Przelew',
    'BLIK': 'BLIK',
  }
  return methodMap[method] || method
}

export function ReservationDetailsModal({
  reservationId,
  open,
  onClose,
}: ReservationDetailsModalProps) {
  const { data: reservation, isLoading } = useReservation(reservationId)
  const queryClient = useQueryClient()
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)

  console.log('Reservation details:', reservation)

  const handleDepositStatusChange = () => {
    // Refresh reservation data
    queryClient.invalidateQueries({ queryKey: ['reservations', reservationId] })
    setShowDepositModal(false)
    setSelectedDeposit(null)
  }

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

  const duration = calculateDuration(reservation)
  const adults = reservation.adults || 0
  const children = reservation.children || 0
  const toddlers = reservation.toddlers || 0
  const totalGuests = reservation.guests || (adults + children + toddlers)

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onClose={onClose}>
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
                  {duration > 0 && (
                    <p className={`text-sm mt-1 ${
                      duration > 6 ? 'text-amber-600 font-medium' : 'text-secondary-500'
                    }`}>
                      Czas trwania: {duration}h
                      {duration > 6 && ` (+${duration - 6}h ponad standard)`}
                    </p>
                  )}
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

              {/* UPDATED: Show three age groups */}
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <p className="text-sm text-secondary-600">Goście</p>
                  <p className="font-medium text-lg">{totalGuests} osób</p>
                  {(adults > 0 || children > 0 || toddlers > 0) && (
                    <div className="space-y-1 mt-2 text-sm text-secondary-600">
                      {adults > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{adults} dorosłych</span>
                        </div>
                      )}
                      {children > 0 && (
                        <div className="flex items-center gap-1">
                          <Baby className="w-4 h-4 text-blue-600" />
                          <span>{children} dzieci (4-12)</span>
                        </div>
                      )}
                      {toddlers > 0 && (
                        <div className="flex items-center gap-1">
                          <Baby className="w-4 h-4 text-green-600" />
                          <span>{toddlers} dzieci (0-3)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation Deadline (if PENDING) */}
            {reservation.status === 'PENDING' && reservation.confirmationDeadline && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Termin potwierdzenia</p>
                    <p className="text-sm text-amber-700">
                      {formatDate(reservation.confirmationDeadline)} {new Date(reservation.confirmationDeadline).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Rezerwacja musi zostać potwierdzona przed tym terminem
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                <div className="flex-1">
                  <p className="text-sm text-secondary-600">Typ wydarzenia</p>
                  <p className="font-medium">{reservation.eventType?.name || 'N/A'}</p>
                  
                  {/* Custom event type for "Inne" */}
                  {reservation.customEventType && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-medium text-blue-900">Typ własny:</p>
                      <p className="text-sm text-blue-700">{reservation.customEventType}</p>
                    </div>
                  )}
                  
                  {/* Anniversary details */}
                  {reservation.eventType?.name === 'Rocznica' && (reservation.anniversaryYear || reservation.anniversaryOccasion) && (
                    <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded space-y-1">
                      {reservation.anniversaryYear && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-purple-900">Która rocznica:</p>
                          <p className="text-sm text-purple-700">{reservation.anniversaryYear}</p>
                        </div>
                      )}
                      {reservation.anniversaryOccasion && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-purple-900">Okazja:</p>
                          <p className="text-sm text-purple-700">{reservation.anniversaryOccasion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Breakdown - UPDATED: Three age groups */}
            <div className="border-t pt-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-primary-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-secondary-600 mb-2">Rozliczenie</p>
                  
                  {/* Price breakdown if available */}
                  {(reservation.pricePerAdult || reservation.pricePerChild || reservation.pricePerToddler) && (adults > 0 || children > 0 || toddlers > 0) && (
                    <div className="space-y-2 mb-3">
                      {adults > 0 && reservation.pricePerAdult && (
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">
                            Dorośli: {adults} × {reservation.pricePerAdult} zł
                          </span>
                          <span className="font-medium">{adults * reservation.pricePerAdult} zł</span>
                        </div>
                      )}
                      {children > 0 && reservation.pricePerChild && (
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">
                            Dzieci (4-12): {children} × {reservation.pricePerChild} zł
                          </span>
                          <span className="font-medium">{children * reservation.pricePerChild} zł</span>
                        </div>
                      )}
                      {toddlers > 0 && reservation.pricePerToddler && (
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-600">
                            Dzieci (0-3): {toddlers} × {reservation.pricePerToddler} zł
                          </span>
                          <span className="font-medium">{toddlers * reservation.pricePerToddler} zł</span>
                        </div>
                      )}
                      <div className="border-t pt-2"></div>
                    </div>
                  )}
                  
                  {/* Total Price */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-700">Cena całkowita:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {reservation.totalPrice ? formatCurrency(reservation.totalPrice) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deposits - UPDATED: Added buttons for status management */}
            {reservation.deposits && reservation.deposits.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-secondary-700 mb-3">Zaliczki</p>
                <div className="space-y-3">
                  {reservation.deposits.map((deposit: any) => {
                    const isPaid = deposit.paid || deposit.status === 'PAID'
                    
                    return (
                      <div
                        key={deposit.id}
                        className={`p-4 rounded-md border ${
                          isPaid 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-lg">{formatCurrency(deposit.amount)}</p>
                              <Badge variant={isPaid ? 'success' : 'warning'}>
                                {isPaid ? 'Opłacona' : 'Nieopłacona'}
                              </Badge>
                            </div>
                            
                            {/* Show due date ONLY if not paid */}
                            {!isPaid && deposit.dueDate && (
                              <div className="flex items-center gap-1 text-sm text-amber-700 mb-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>Termin płatności: {formatDate(deposit.dueDate)}</span>
                              </div>
                            )}
                            
                            {/* Show payment details ONLY if paid */}
                            {isPaid && (
                              <div className="space-y-1">
                                {deposit.paidAt && (
                                  <div className="flex items-center gap-1 text-sm text-green-700">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Opłacona: {formatDate(deposit.paidAt)}</span>
                                  </div>
                                )}
                                {deposit.paymentMethod && (
                                  <p className="text-sm text-green-700">
                                    Metoda płatności: {getPaymentMethodLabel(deposit.paymentMethod)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action button */}
                          <Button
                            size="sm"
                            variant={isPaid ? 'outline' : 'default'}
                            onClick={() => {
                              setSelectedDeposit(deposit)
                              setShowDepositModal(true)
                            }}
                            className="ml-4"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            {isPaid ? 'Zmień status' : 'Oznacz jako zapłaconą'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {reservation.notes && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-secondary-700 mb-2">Notatki</p>
                <p className="text-sm text-secondary-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {reservation.notes}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4 text-xs text-secondary-500 space-y-1">
              <p>Utworzono: {formatDate(reservation.createdAt)}</p>
              {reservation.createdByUser && (
                <p>Przez: {reservation.createdByUser.firstName} {reservation.createdByUser.lastName}</p>
              )}
              {reservation.updatedAt !== reservation.createdAt && (
                <p>Ostatnia aktualizacja: {formatDate(reservation.updatedAt)}</p>
              )}
            </div>

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

      {/* Deposit Status Update Modal */}
      {selectedDeposit && (
        <UpdateDepositStatusModal
          deposit={selectedDeposit}
          open={showDepositModal}
          onClose={() => {
            setShowDepositModal(false)
            setSelectedDeposit(null)
          }}
          onSuccess={handleDepositStatusChange}
        />
      )}
    </>
  )
}

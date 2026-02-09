'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReservations } from '@/hooks/use-reservations'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ReservationStatus } from '@/types'
import { 
  Eye, Edit, Trash2, Archive, FileText, ChevronLeft, ChevronRight, 
  Users, Baby, Smile, Calendar, Clock, DollarSign, Building2, User, 
  Phone, Mail, MapPin, ChevronRight as ArrowRight
} from 'lucide-react'
import { ReservationDetailsModal } from './reservation-details-modal'
import { EditReservationModal } from './edit-reservation-modal'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { format, parseISO, isSameDay } from 'date-fns'
import { pl } from 'date-fns/locale'
import Link from 'next/link'

// Helper functions
function getFormattedDate(reservation: any): Date | null {
  if (reservation.startDateTime) {
    return new Date(reservation.startDateTime)
  }
  if (reservation.date) {
    return new Date(reservation.date)
  }
  return null
}

function getFormattedTimeRange(reservation: any): string {
  if (reservation.startDateTime && reservation.endDateTime) {
    const start = new Date(reservation.startDateTime)
    const end = new Date(reservation.endDateTime)
    return `${start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  if (reservation.startTime && reservation.endTime) {
    return `${reservation.startTime} - ${reservation.endTime}`
  }
  
  return 'Brak czasu'
}

function getGuestBreakdown(reservation: any): { 
  adults: number; 
  children: number; 
  toddlers: number;
  total: number 
} {
  const adults = reservation.adults || 0
  const children = reservation.children || 0
  const toddlers = reservation.toddlers || 0
  const total = reservation.guests || (adults + children + toddlers)
  
  return { adults, children, toddlers, total }
}

export function ReservationsList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('')
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useReservations({
    page,
    pageSize: 20,
    status: statusFilter || undefined,
  })

  const statusOptions = [
    { value: '', label: 'Wszystkie statusy' },
    { value: 'PENDING', label: 'Oczekujące' },
    { value: 'CONFIRMED', label: 'Potwierdzone' },
    { value: 'COMPLETED', label: 'Zakończone' },
    { value: 'CANCELLED', label: 'Anulowane' },
  ]

  const handleEdit = (reservationId: string) => {
    setEditingReservationId(reservationId)
  }

  const handleEditSuccess = () => {
    refetch()
  }

  const handleGeneratePDF = async (reservationId: string) => {
    try {
      toast.info('Generowanie PDF...')
      toast.success('PDF wygenerowany pomyślnie')
    } catch (error) {
      toast.error('Błąd podczas generowania PDF')
    }
  }

  const handleArchive = async (reservationId: string) => {
    if (!confirm('Czy na pewno chcesz zarchiwizować tę rezerwację?')) {
      return
    }

    try {
      await apiClient.patch(`/reservations/${reservationId}`, {
        archivedAt: new Date().toISOString()
      })
      toast.success('Rezerwacja zarchiwizowana')
      refetch()
    } catch (error) {
      toast.error('Błąd podczas archiwizacji')
    }
  }

  const handleDelete = async (reservationId: string, status: string) => {
    if (status === 'CONFIRMED') {
      toast.error('Nie można usunąć potwierdzonej rezerwacji. Anuluj ją najpierw.')
      return
    }

    if (!confirm('Czy na pewno chcesz anulować tę rezerwację? Ta operacja jest nieodwracalna.')) {
      return
    }

    try {
      await apiClient.delete(`/reservations/${reservationId}`)
      toast.success('Rezerwacja anulowana')
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Błąd podczas anulowania rezerwacji')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie rezerwacji...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Wystąpił błąd podczas ładowania rezerwacji</p>
      </div>
    )
  }

  const allReservations = data?.data || []
  const reservations = allReservations.filter((r: any) => r.status !== 'RESERVED')
  const totalPages = data?.totalPages || 1

  // Group reservations by date
  const reservationsByDate = reservations.reduce((acc: any, res: any) => {
    const date = getFormattedDate(res)
    if (!date) return acc
    
    const dateKey = format(date, 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(res)
    return acc
  }, {})

  // Sort dates
  const dates = Object.keys(reservationsByDate).sort()

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReservationStatus | '')}>
            <SelectTrigger className="h-12 border-2">
              <SelectValue placeholder="Filtruj po statusie" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1" />
        
        <div className="text-sm text-muted-foreground">
          Znaleziono <strong>{reservations.length}</strong> rezerwacji
        </div>
      </div>

      {/* Reservations List - Card Based */}
      {reservations.length === 0 ? (
        <Card className="border-dashed">
          <div className="py-16 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Brak rezerwacji</h3>
            <p className="text-muted-foreground">Nie znaleziono rezerwacji spełniających kryteria</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {dates.map((dateKey) => {
            const dateReservations = reservationsByDate[dateKey]
            const date = parseISO(dateKey)
            const isToday = isSameDay(date, new Date())

            return (
              <div key={dateKey} className="space-y-3">
                {/* Date Header */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isToday 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                    : 'bg-muted'
                }`}>
                  <Calendar className="h-4 w-4" />
                  <div>
                    <div className="font-semibold">
                      {format(date, 'EEEE', { locale: pl })}
                    </div>
                    <div className="text-sm opacity-90">
                      {format(date, 'd MMMM yyyy', { locale: pl })}
                    </div>
                  </div>
                  {dateReservations.length > 1 && (
                    <Badge variant="outline" className="ml-auto border-blue-300 bg-blue-50 dark:bg-blue-950/30">
                      {dateReservations.length} rezerwacji
                    </Badge>
                  )}
                </div>

                {/* Reservation Cards */}
                <div className="grid gap-3">
                  {dateReservations.map((reservation: any) => {
                    const guestInfo = getGuestBreakdown(reservation)
                    
                    return (
                      <Card key={reservation.id} className="border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 p-6">
                          {/* Header: Time + Status */}
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white dark:bg-black/20 rounded-lg">
                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-lg">
                                  {getFormattedTimeRange(reservation)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {reservation.eventType?.name || 'Inne wydarzenie'}
                                  {reservation.customEventType && ` - ${reservation.customEventType}`}
                                </div>
                              </div>
                            </div>
                            
                            <Badge className={getStatusColor(reservation.status)}>
                              {getStatusLabel(reservation.status)}
                            </Badge>
                          </div>

                          {/* Divider */}
                          <div className="my-4 border-t border-blue-200/50 dark:border-blue-800/50" />

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {/* Hall */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                Sala
                              </div>
                              <div className="font-medium">{reservation.hall?.name || 'N/A'}</div>
                            </div>

                            {/* Client */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                Klient
                              </div>
                              <div className="font-medium">
                                {reservation.client
                                  ? `${reservation.client.firstName} ${reservation.client.lastName}`
                                  : 'N/A'}
                              </div>
                            </div>

                            {/* Guests */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                Goście
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{guestInfo.total}</div>
                                {(guestInfo.adults > 0 || guestInfo.children > 0 || guestInfo.toddlers > 0) && (
                                  <div className="flex gap-2 text-xs">
                                    {guestInfo.adults > 0 && (
                                      <div className="flex items-center gap-0.5 text-gray-600 dark:text-gray-400" title="Dorośli">
                                        <Users className="w-3 h-3" />
                                        {guestInfo.adults}
                                      </div>
                                    )}
                                    {guestInfo.children > 0 && (
                                      <div className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400" title="Dzieci 4-12">
                                        <Smile className="w-3 h-3" />
                                        {guestInfo.children}
                                      </div>
                                    )}
                                    {guestInfo.toddlers > 0 && (
                                      <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400" title="Maluchy 0-3">
                                        <Baby className="w-3 h-3" />
                                        {guestInfo.toddlers}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                Wartość
                              </div>
                              <div className="font-bold text-lg text-green-600 dark:text-green-400">
                                {reservation.totalPrice ? formatCurrency(reservation.totalPrice) : 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* Actions Bar */}
                          <div className="flex items-center justify-between pt-3 border-t border-blue-200/50 dark:border-blue-800/50">
                            {/* Contact Info */}
                            {reservation.client && (
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                {reservation.client.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {reservation.client.phone}
                                  </div>
                                )}
                                {reservation.client.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {reservation.client.email}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Link href={`/dashboard/reservations/${reservation.id}`}>
                                <Button size="sm" variant="ghost" title="Zobacz szczegóły">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEdit(reservation.id)}
                                title="Edytuj rezerwację"
                                disabled={reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED'}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleGeneratePDF(reservation.id)}
                                title="Generuj PDF"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleArchive(reservation.id)}
                                title="Archiwizuj"
                                disabled={reservation.status === 'CANCELLED'}
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDelete(reservation.id, reservation.status)}
                                title="Anuluj rezerwację"
                                disabled={reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED'}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Strona <strong>{page}</strong> z <strong>{totalPages}</strong>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Poprzednia
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-2"
            >
              Następna
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedReservationId && (
        <ReservationDetailsModal
          reservationId={selectedReservationId}
          open={!!selectedReservationId}
          onClose={() => setSelectedReservationId(null)}
        />
      )}

      {/* Edit Modal */}
      {editingReservationId && (
        <EditReservationModal
          reservationId={editingReservationId}
          open={!!editingReservationId}
          onClose={() => setEditingReservationId(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

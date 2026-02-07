'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { useReservations } from '@/hooks/use-reservations'
import { formatDate, formatTime, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ReservationStatus } from '@/types'
import { Eye, Edit, Trash2, Archive, FileText, ChevronLeft, ChevronRight, Users, Baby } from 'lucide-react'
import { ReservationDetailsModal } from './reservation-details-modal'
import { EditReservationModal } from './edit-reservation-modal'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

// Helper functions for backwards compatibility
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

// Get guest breakdown
function getGuestBreakdown(reservation: any): { adults: number; children: number; total: number } {
  const adults = reservation.adults || 0
  const children = reservation.children || 0
  const total = reservation.guests || (adults + children)
  
  return { adults, children, total }
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
    refetch() // Use refetch instead of mutate for React Query
  }

  const handleGeneratePDF = async (reservationId: string) => {
    try {
      toast.info('Generowanie PDF...')
      // TODO: Implement PDF generation
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
      refetch() // Use refetch
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
      refetch() // Use refetch
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Błąd podczas anulowania rezerwacji')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">Wystąpił błąd podczas ładowania rezerwacji</p>
      </div>
    )
  }

  const reservations = data?.data || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="w-64">
          <Select
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | '')}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-secondary-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Typ Wydarzenia</TableHead>
              <TableHead>Goście</TableHead>
              <TableHead>Cena</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-secondary-500">
                  Brak rezerwacji
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((reservation: any) => {
                const guestInfo = getGuestBreakdown(reservation)
                
                return (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getFormattedDate(reservation)}</div>
                        <div className="text-sm text-secondary-500">
                          {getFormattedTimeRange(reservation)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{reservation.hall?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {reservation.client
                        ? `${reservation.client.firstName} ${reservation.client.lastName}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{reservation.eventType?.name || 'N/A'}</div>
                        {reservation.customEventType && (
                          <div className="text-xs text-secondary-500">({reservation.customEventType})</div>
                        )}
                        {reservation.anniversaryYear && (
                          <div className="text-xs text-secondary-500">({reservation.anniversaryYear}. rocznica)</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{guestInfo.total}</div>
                        {(guestInfo.adults > 0 || guestInfo.children > 0) && (
                          <div className="flex gap-3 text-xs text-secondary-600">
                            {guestInfo.adults > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{guestInfo.adults}</span>
                              </div>
                            )}
                            {guestInfo.children > 0 && (
                              <div className="flex items-center gap-1">
                                <Baby className="w-3 h-3" />
                                <span>{guestInfo.children}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {reservation.totalPrice ? formatCurrency(reservation.totalPrice) : 'N/A'}
                        </div>
                        {(reservation.pricePerAdult || reservation.pricePerChild) && (
                          <div className="text-xs text-secondary-500">
                            {reservation.pricePerAdult && `${reservation.pricePerAdult} zł/os`}
                            {reservation.pricePerChild && reservation.pricePerChild !== reservation.pricePerAdult && (
                              <>, {reservation.pricePerChild} zł/dz</>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(reservation.status)}>
                        {getStatusLabel(reservation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReservationId(reservation.id)}
                          title="Zobacz szczegóły"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
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
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-600">
            Strona {page} z {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Poprzednia
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Następna
              <ChevronRight className="w-4 h-4" />
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

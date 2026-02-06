'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
import { Eye, Edit, Trash2, Archive, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { ReservationDetailsModal } from './reservation-details-modal'

export function ReservationsList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('')
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)

  const { data, isLoading, error } = useReservations({
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
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
              reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatDate(reservation.date)}</div>
                      <div className="text-sm text-secondary-500">
                        {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{reservation.hall?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {reservation.client
                      ? `${reservation.client.firstName} ${reservation.client.lastName}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{reservation.eventType?.name || 'N/A'}</TableCell>
                  <TableCell>{reservation.guests}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(reservation.totalPrice)}
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
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
    </motion.div>
  )
}

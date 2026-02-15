'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReservations } from '@/hooks/use-reservations'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ReservationStatus } from '@/types'
import {
  Eye, Edit, Trash2, Archive, FileText, ChevronLeft, ChevronRight,
  Users, Baby, Smile, Calendar, Clock, DollarSign, Building2, User,
  Phone, Mail, CheckCircle2, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { format, parseISO, isSameDay } from 'date-fns'
import { pl } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import { LoadingState } from '@/components/shared'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit } from '@/lib/api/deposits'

const accent = moduleAccents.reservations

// Helper functions
function getFormattedDate(reservation: any): Date | null {
  if (reservation.startDateTime) return new Date(reservation.startDateTime)
  if (reservation.date) return new Date(reservation.date)
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

// Deposit Badge Helper
function DepositBadge({ deposits }: { deposits: Deposit[] }) {
  const active = deposits.filter(d => d.status !== 'CANCELLED')
  if (active.length === 0) return null

  const allPaid = active.every(d => d.status === 'PAID')
  const hasOverdue = active.some(d => d.status === 'OVERDUE')
  const totalAmount = active.reduce((s, d) => s + Number(d.amount), 0)
  const paidAmount = active.reduce((s, d) => s + Number(d.paidAmount || 0), 0)

  if (allPaid) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        Zaliczka opłacona
      </span>
    )
  }

  if (hasOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 animate-pulse">
        <AlertTriangle className="h-3 w-3" />
        Zaległa: {totalAmount.toLocaleString('pl-PL')} zł
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
      <Clock className="h-3 w-3" />
      Zaliczka: {paidAmount > 0 ? `${paidAmount.toLocaleString('pl-PL')} / ` : ''}{totalAmount.toLocaleString('pl-PL')} zł
    </span>
  )
}

export function ReservationsList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL')
  const [depositMap, setDepositMap] = useState<Record<string, Deposit[]>>({})

  const { data, isLoading, error, refetch } = useReservations({
    page,
    pageSize: 20,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  // Fetch all deposits once and group by reservationId
  useEffect(() => {
    depositsApi.getAll().then(deposits => {
      const map: Record<string, Deposit[]> = {}
      deposits.forEach(d => {
        if (!map[d.reservationId]) map[d.reservationId] = []
        map[d.reservationId].push(d)
      })
      setDepositMap(map)
    }).catch(console.error)
  }, [])

  const statusOptions = [
    { value: 'ALL', label: 'Wszystkie statusy' },
    { value: 'PENDING', label: 'Oczekujące' },
    { value: 'CONFIRMED', label: 'Potwierdzone' },
    { value: 'COMPLETED', label: 'Zakończone' },
    { value: 'CANCELLED', label: 'Anulowane' },
  ]

  const handleGeneratePDF = async (reservationId: string) => {
    try {
      toast.info('Generowanie PDF...')
      toast.success('PDF wygenerowany pomyślnie')
    } catch (error) {
      toast.error('Błąd podczas generowania PDF')
    }
  }

  const handleArchive = async (reservationId: string) => {
    if (!confirm('Czy na pewno chcesz zarchiwizować tę rezerwację?')) return
    try {
      await apiClient.patch(`/reservations/${reservationId}`, { archivedAt: new Date().toISOString() })
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
    if (!confirm('Czy na pewno chcesz anulować tę rezerwację? Ta operacja jest nieodwracalna.')) return
    try {
      await apiClient.delete(`/reservations/${reservationId}`)
      toast.success('Rezerwacja anulowana')
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Błąd podczas anulowania rezerwacji')
    }
  }

  if (isLoading) {
    return <LoadingState variant="skeleton" count={5} />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600 dark:text-red-400">Wystąpił błąd podczas ładowania rezerwacji</p>
      </div>
    )
  }

  const allReservations = data?.data || []
  const reservations = allReservations.filter((r: any) => r.status !== 'RESERVED')
  const totalPages = data?.totalPages || 1

  const reservationsByDate = reservations.reduce((acc: any, res: any) => {
    const date = getFormattedDate(res)
    if (!date) return acc
    const dateKey = format(date, 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(res)
    return acc
  }, {})

  const dates = Object.keys(reservationsByDate).sort()

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReservationStatus | 'ALL')}>
            <SelectTrigger className="h-11 rounded-xl border-neutral-200 dark:border-neutral-700">
              <SelectValue placeholder="Filtruj po statusie" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Znaleziono <strong className="text-neutral-900 dark:text-neutral-100">{reservations.length}</strong> rezerwacji
        </div>
      </div>

      {/* Reservations List */}
      {reservations.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 py-16 text-center">
          <div className={cn(
            'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4 shadow-md',
            accent.iconBg
          )}>
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Brak rezerwacji</h3>
          <p className="text-neutral-500 dark:text-neutral-400">Nie znaleziono rezerwacji spełniających kryteria</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((dateKey) => {
            const dateReservations = reservationsByDate[dateKey]
            const date = parseISO(dateKey)
            const isToday = isSameDay(date, new Date())

            return (
              <div key={dateKey} className="space-y-3">
                {/* Date Header */}
                <div className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl',
                  isToday
                    ? `bg-gradient-to-r ${accent.gradient} text-white shadow-md`
                    : 'bg-neutral-100 dark:bg-neutral-800/60'
                )}>
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
                    <Badge variant="outline" className={cn(
                      'ml-auto border-0 shadow-none',
                      isToday
                        ? 'bg-white/20 text-white'
                        : cn(accent.badge, accent.badgeText)
                    )}>
                      {dateReservations.length} rezerwacji
                    </Badge>
                  )}
                </div>

                {/* Reservation Cards */}
                <div className="grid gap-3">
                  {dateReservations.map((reservation: any) => {
                    const guestInfo = getGuestBreakdown(reservation)
                    const resDeposits = depositMap[reservation.id] || []

                    return (
                      <div key={reservation.id} className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className={cn(
                          'p-6',
                          `bg-gradient-to-r ${accent.gradientSubtle}`
                        )}>
                          {/* Header: Time + Status + Deposit Badge */}
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'p-2 rounded-xl bg-gradient-to-br shadow-sm',
                                accent.iconBg
                              )}>
                                <Clock className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                                  {getFormattedTimeRange(reservation)}
                                </div>
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {reservation.eventType?.name || 'Inne wydarzenie'}
                                  {reservation.customEventType && ` - ${reservation.customEventType}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <DepositBadge deposits={resDeposits} />
                              <Badge className={getStatusColor(reservation.status)}>
                                {getStatusLabel(reservation.status)}
                              </Badge>
                            </div>
                          </div>

                          <div className="my-4 border-t border-neutral-200/50 dark:border-neutral-700/30" />

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                <Building2 className="h-3 w-3" /> Sala
                              </div>
                              <div className="font-medium text-neutral-900 dark:text-neutral-100">{reservation.hall?.name || 'N/A'}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                <User className="h-3 w-3" /> Klient
                              </div>
                              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                {reservation.client
                                  ? `${reservation.client.firstName} ${reservation.client.lastName}`
                                  : 'N/A'}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                <Users className="h-3 w-3" /> Goście
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-neutral-900 dark:text-neutral-100">{guestInfo.total}</div>
                                {(guestInfo.adults > 0 || guestInfo.children > 0 || guestInfo.toddlers > 0) && (
                                  <div className="flex gap-2 text-xs">
                                    {guestInfo.adults > 0 && (
                                      <div className="flex items-center gap-0.5 text-neutral-500 dark:text-neutral-400" title="Dorośli">
                                        <Users className="w-3 h-3" />{guestInfo.adults}
                                      </div>
                                    )}
                                    {guestInfo.children > 0 && (
                                      <div className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400" title="Dzieci 4-12">
                                        <Smile className="w-3 h-3" />{guestInfo.children}
                                      </div>
                                    )}
                                    {guestInfo.toddlers > 0 && (
                                      <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400" title="Maluchy 0-3">
                                        <Baby className="w-3 h-3" />{guestInfo.toddlers}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                <DollarSign className="h-3 w-3" /> Wartość
                              </div>
                              <div className="font-bold text-lg text-green-600 dark:text-green-400">
                                {reservation.totalPrice ? formatCurrency(reservation.totalPrice) : 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* Actions Bar */}
                          <div className="flex items-center justify-between pt-3 border-t border-neutral-200/50 dark:border-neutral-700/30">
                            {reservation.client && (
                              <div className="flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                                {reservation.client.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />{reservation.client.phone}
                                  </div>
                                )}
                                {reservation.client.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />{reservation.client.email}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex gap-1">
                              <Link href={`/dashboard/reservations/${reservation.id}`}>
                                <Button size="sm" variant="ghost" title="Zobacz szczegóły" className="rounded-lg">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Link href={`/dashboard/reservations/${reservation.id}`}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Edytuj rezerwację (inline)"
                                  disabled={reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED'}
                                  className="rounded-lg"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleGeneratePDF(reservation.id)}
                                title="Generuj PDF"
                                className="rounded-lg"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleArchive(reservation.id)}
                                title="Archiwizuj"
                                disabled={reservation.status === 'CANCELLED'}
                                className="rounded-lg"
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(reservation.id, reservation.status)}
                                title="Anuluj rezerwację"
                                disabled={reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED'}
                                className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
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
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Strona <strong className="text-neutral-900 dark:text-neutral-100">{page}</strong> z <strong className="text-neutral-900 dark:text-neutral-100">{totalPages}</strong>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border-neutral-200 dark:border-neutral-700"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Poprzednia
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border-neutral-200 dark:border-neutral-700"
            >
              Następna
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

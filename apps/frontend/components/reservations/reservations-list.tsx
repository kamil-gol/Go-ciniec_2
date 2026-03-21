'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useReservations, useArchiveReservation, useUnarchiveReservation } from '@/lib/api/reservations'
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ReservationStatus } from '@/types'
import {
  Eye, Trash2, Archive, ArchiveRestore, FileText, ChevronLeft, ChevronRight,
  Users, Baby, Smile, Calendar, Clock, DollarSign, Building2, User,
  Phone, Mail, CheckCircle2, AlertTriangle, FileCheck, FileX, ShieldCheck, ShieldAlert,
  Loader2, Sparkles
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
import { batchCheckContract, batchCheckRodo } from '@/lib/api/attachments'

const accent = moduleAccents.reservations

// Helper functions

/**
 * Extract a Date (midnight) in LOCAL timezone for grouping by calendar day.
 * Uses local year/month/date so that the reservation appears on the correct
 * Warsaw calendar day (not shifted by UTC offset).
 */
function getFormattedDate(reservation: any): Date | null {
  if (reservation.startDateTime) {
    const d = new Date(reservation.startDateTime)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  if (reservation.date) {
    return new Date(reservation.date + 'T00:00:00')
  }
  return null
}

/**
 * Format the time range in LOCAL (Warsaw) timezone.
 * Data is stored as UTC with correct offset (e.g. 2026-03-07T13:00:00Z = 14:00 Warsaw),
 * so we use local accessors (getHours/getMinutes) — NOT getUTCHours.
 */
function getFormattedTimeRange(reservation: any): string {
  if (reservation.startDateTime && reservation.endDateTime) {
    const start = new Date(reservation.startDateTime)
    const end = new Date(reservation.endDateTime)
    const sh = String(start.getHours()).padStart(2, '0')
    const sm = String(start.getMinutes()).padStart(2, '0')
    const eh = String(end.getHours()).padStart(2, '0')
    const em = String(end.getMinutes()).padStart(2, '0')
    return `${sh}:${sm} - ${eh}:${em}`
  }
  if (reservation.startTime && reservation.endTime) {
    return `${reservation.startTime} - ${reservation.endTime}`
  }
  return 'Brak czasu'
}

function getGuestBreakdown(reservation: any): {
  adults: number;
  childrenCount: number;
  toddlers: number;
  total: number
} {
  const adults = reservation.adults || 0
  const childrenCount = reservation.children || 0
  const toddlers = reservation.toddlers || 0
  const total = reservation.guests || (adults + childrenCount + toddlers)
  return { adults, childrenCount, toddlers, total }
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

// Extras Badge Helper
function ExtrasBadge({ extrasCount, extrasTotalPrice }: { extrasCount?: number; extrasTotalPrice?: number }) {
  if (!extrasCount || extrasCount === 0) return null

  const priceLabel = extrasTotalPrice && extrasTotalPrice > 0
    ? ` · ${extrasTotalPrice.toLocaleString('pl-PL')} zł`
    : ''

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800">
      <Sparkles className="h-3 w-3" />
      {extrasCount} {extrasCount === 1 ? 'extra' : 'extras'}{priceLabel}
    </span>
  )
}

// Contract Badge Helper
function ContractBadge({ hasContract }: { hasContract: boolean | undefined }) {
  if (hasContract === undefined) return null

  if (hasContract) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
        <FileCheck className="h-3 w-3" />
        Umowa
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-50 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
      <FileX className="h-3 w-3" />
      Brak umowy
    </span>
  )
}

// RODO Badge Helper
function RodoBadge({ hasRodo }: { hasRodo: boolean | undefined }) {
  if (hasRodo === undefined) return null

  if (hasRodo) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800">
        <ShieldCheck className="h-3 w-3" />
        RODO
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
      <ShieldAlert className="h-3 w-3" />
      Brak RODO
    </span>
  )
}

export function ReservationsList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL')
  const [showArchived, setShowArchived] = useState(false)
  const [depositMap, setDepositMap] = useState<Record<string, Deposit[]>>({})
  const [contractMap, setContractMap] = useState<Record<string, boolean>>({})
  const [rodoMap, setRodoMap] = useState<Record<string, boolean>>({})
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)

  const archiveMutation = useArchiveReservation()
  const unarchiveMutation = useUnarchiveReservation()

  const { data, isLoading, error, refetch } = useReservations({
    page,
    pageSize: 20,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    archived: showArchived,
  })

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

  const allReservations = useMemo(() => data?.data || [], [data])
  const reservations = useMemo(() => allReservations.filter((r: any) => r.status !== 'RESERVED'), [allReservations])

  useEffect(() => {
    if (reservations.length === 0) return

    const reservationIds = reservations.map((r: any) => r.id)
    batchCheckContract(reservationIds)
      .then(setContractMap)
      .catch(console.error)

    const clientIds = [...new Set(
      reservations
        .map((r: any) => r.clientId || r.client?.id)
        .filter(Boolean)
    )] as string[]
    if (clientIds.length > 0) {
      batchCheckRodo(clientIds)
        .then(setRodoMap)
        .catch(console.error)
    }
  }, [data, reservations])

  const statusOptions = [
    { value: 'ALL', label: 'Wszystkie statusy' },
    { value: 'PENDING', label: 'Oczekujące' },
    { value: 'CONFIRMED', label: 'Potwierdzone' },
    { value: 'COMPLETED', label: 'Zakończone' },
    { value: 'CANCELLED', label: 'Anulowane' },
    ...(showArchived ? [{ value: 'ARCHIVED', label: 'Zarchiwizowane' }] : []),
  ]

  const handleGeneratePDF = async (reservationId: string) => {
    try {
      setGeneratingPdfId(reservationId)
      toast.info('Generowanie PDF...')
      const response = await apiClient.get(`/reservations/${reservationId}/pdf`, {
        responseType: 'blob',
      })

      const contentType = response.headers?.['content-type'] || ''
      if (contentType.includes('application/json')) {
        const text = await new Blob([response.data]).text()
        const errorData = JSON.parse(text)
        throw new Error(errorData.error || 'Serwer zwrócił błąd zamiast PDF')
      }

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rezerwacja_${reservationId.slice(0, 8)}.pdf`
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 150)
      toast.success('PDF wygenerowany pomyślnie')
    } catch (error: any) {
      console.error('PDF generation error:', error)
      if (error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text()
          const errorData = JSON.parse(text)
          toast.error(errorData.error || 'Błąd podczas generowania PDF')
        } catch {
          toast.error('Błąd podczas generowania PDF')
        }
      } else {
        toast.error(error?.response?.data?.error || error?.message || 'Błąd podczas generowania PDF')
      }
    } finally {
      setGeneratingPdfId(null)
    }
  }

  const handleArchive = async (reservationId: string) => {
    toast.promise(
      archiveMutation.mutateAsync({ id: reservationId, reason: 'Zarchiwizowano przez użytkownika' }),
      {
        loading: 'Archiwizowanie rezerwacji...',
        success: () => {
          refetch()
          return 'Rezerwacja została zarchiwizowana'
        },
        error: 'Błąd podczas archiwizacji rezerwacji',
      }
    )
  }

  const handleUnarchive = async (reservationId: string) => {
    toast.promise(
      unarchiveMutation.mutateAsync({ id: reservationId, reason: 'Przywrócono z archiwum' }),
      {
        loading: 'Przywracanie rezerwacji...',
        success: () => {
          refetch()
          return 'Rezerwacja została przywrócona z archiwum'
        },
        error: 'Błąd podczas przywracania rezerwacji',
      }
    )
  }

  const handleDelete = async (reservationId: string, status: string) => {
    if (status === 'CONFIRMED') {
      toast.error('Nie można usunąć potwierdzonej rezerwacji. Anuluj ją najpierw.')
      return
    }
    
    const confirmed = window.confirm('Czy na pewno chcesz anulować tę rezerwację? Ta operacja jest nieodwracalna.')
    if (!confirmed) return

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
      {/* Filters — responsive wrap */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
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
        
        {/* Archive Toggle */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={setShowArchived}
          />
          <Label htmlFor="show-archived" className="cursor-pointer font-medium text-sm">
            <span className="hidden sm:inline">Pokaż zarchiwizowane</span>
            <span className="sm:hidden">Archiwum</span>
          </Label>
        </div>
        
        <div className="flex-1" />
        <div className="text-sm text-neutral-500 dark:text-neutral-400 w-full sm:w-auto">
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
                    const hasContract = contractMap[reservation.id]
                    const clientId = reservation.clientId || reservation.client?.id
                    const hasRodo = clientId ? rodoMap[clientId] : undefined
                    const isPdfGenerating = generatingPdfId === reservation.id

                    return (
                      <div key={reservation.id} className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden active:scale-[0.99]">
                        <div className={cn(
                          'p-4 sm:p-6',
                          `bg-gradient-to-r ${accent.gradientSubtle}`
                        )}>
                          {/* Header: Time + Status + Badges — stacks on mobile */}
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {reservation.archivedAt && (
                                <Badge variant="secondary" className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                  <Archive className="h-3 w-3 mr-1" />
                                  Zarchiwizowane
                                </Badge>
                              )}
                              <RodoBadge hasRodo={hasRodo} />
                              <ContractBadge hasContract={hasContract} />
                              <ExtrasBadge extrasCount={reservation.extrasCount} extrasTotalPrice={reservation.extrasTotalPrice} />
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
                                {(guestInfo.adults > 0 || guestInfo.childrenCount > 0 || guestInfo.toddlers > 0) && (
                                  <div className="flex gap-2 text-xs">
                                    {guestInfo.adults > 0 && (
                                      <div className="flex items-center gap-0.5 text-neutral-500 dark:text-neutral-400" title="Dorośli">
                                        <Users className="w-3 h-3" />{guestInfo.adults}
                                      </div>
                                    )}
                                    {guestInfo.childrenCount > 0 && (
                                      <div className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400" title="Dzieci 4-12">
                                        <Smile className="w-3 h-3" />{guestInfo.childrenCount}
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
                              {reservation.extrasTotalPrice > 0 && (
                                <div className="text-xs text-violet-600 dark:text-violet-400">
                                  w tym extras: {formatCurrency(reservation.extrasTotalPrice)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions Bar — stacks on mobile */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-neutral-200/50 dark:border-neutral-700/30">
                            {reservation.client && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                                {reservation.client.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />{reservation.client.phone}
                                  </div>
                                )}
                                {reservation.client.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[180px] sm:max-w-none">{reservation.client.email}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex gap-1 self-end sm:self-auto">
                              <Link href={`/dashboard/reservations/${reservation.id}`}>
                                <Button size="sm" variant="ghost" title="Zobacz szczegóły i edytuj" className="rounded-lg">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleGeneratePDF(reservation.id)}
                                title="Generuj PDF"
                                className="rounded-lg"
                                disabled={isPdfGenerating}
                              >
                                {isPdfGenerating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </Button>
                              {!reservation.archivedAt ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleArchive(reservation.id)}
                                  title="Zarchiwizuj"
                                  disabled={!['CANCELLED', 'COMPLETED'].includes(reservation.status)}
                                  className="rounded-lg"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUnarchive(reservation.id)}
                                  title="Przywróć z archiwum"
                                  className="rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                >
                                  <ArchiveRestore className="w-4 h-4" />
                                </Button>
                              )}
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

      {/* Pagination — responsive */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4">
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

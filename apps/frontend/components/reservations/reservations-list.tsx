'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useReservations, useArchiveReservation, useUnarchiveReservation } from '@/lib/api/reservations'
import type { ReservationStatus } from '@/types'
import { Calendar } from 'lucide-react'
import { Pagination } from '@/components/shared/Pagination'
import { toast } from 'sonner'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import { apiClient } from '@/lib/api-client'
import { format, parseISO, isSameDay } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import { LoadingState, EmptyState } from '@/components/shared'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit } from '@/lib/api/deposits'
import { batchCheckContract, batchCheckRodo } from '@/lib/api/attachments'
import { getFormattedDate } from './reservation-list/reservation-list.helpers'
import { ReservationCard } from './reservation-list/ReservationCard'
import type { ReservationCardHandlers } from './reservation-list/ReservationCard'

const accent = moduleAccents.reservations

export function ReservationsList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL')
  const [showArchived, setShowArchived] = useState(false)
  const [depositMap, setDepositMap] = useState<Record<string, Deposit[]>>({})
  const [contractMap, setContractMap] = useState<Record<string, boolean>>({})
  const [rodoMap, setRodoMap] = useState<Record<string, boolean>>({})
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)

  const { confirm, ConfirmDialog } = useConfirmDialog()
  const archiveMutation = useArchiveReservation()
  const unarchiveMutation = useUnarchiveReservation()

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, showArchived])

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

    const confirmed = await confirm({ title: 'Anulowanie rezerwacji', description: 'Czy na pewno chcesz anulować tę rezerwację? Ta operacja jest nieodwracalna.', variant: 'destructive', confirmLabel: 'Anuluj rezerwację' })
    if (!confirmed) return

    try {
      await apiClient.delete(`/reservations/${reservationId}`)
      toast.success('Rezerwacja anulowana')
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Błąd podczas anulowania rezerwacji')
    }
  }

  const cardHandlers: ReservationCardHandlers = useMemo(() => ({
    onPdf: handleGeneratePDF,
    onArchive: handleArchive,
    onUnarchive: handleUnarchive,
    onDelete: handleDelete,
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

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
            <SelectTrigger className="h-11 rounded-xl border-neutral-200 dark:border-neutral-700" aria-label="Filtruj po statusie">
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
        <div className="text-sm text-neutral-500 dark:text-neutral-300 w-full sm:w-auto">
          Znaleziono <strong className="text-neutral-900 dark:text-neutral-100">{reservations.length}</strong> rezerwacji
        </div>
      </div>

      {/* Reservations List */}
      {reservations.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Brak rezerwacji"
          description="Nie znaleziono rezerwacji spełniających wybrane kryteria. Zmień filtry lub utwórz nową rezerwację."
          actionLabel="Nowa rezerwacja"
          actionHref="/dashboard/reservations/list?create=true"
        />
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
                  {dateReservations.map((reservation: any) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      depositMap={depositMap}
                      contractMap={contractMap}
                      rodoMap={rodoMap}
                      handlers={cardHandlers}
                      generatingPdfId={generatingPdfId}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="pt-4"
      />
      {ConfirmDialog}
    </div>
  )
}

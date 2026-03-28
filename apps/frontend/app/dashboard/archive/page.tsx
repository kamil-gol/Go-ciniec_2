'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ArchiveRestore,
  Eye,
  Calendar,
  Clock,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useReservations, useUnarchiveReservation } from '@/lib/api/reservations'
import { formatCurrency } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { PageLayout, PageHero, StatCard, LoadingState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

const accent = moduleAccents.archive

export default function ArchivePage() {
  const [page, setPage] = useState(1)
  const unarchiveMutation = useUnarchiveReservation()

  const { data, isLoading, error, refetch } = useReservations({
    page,
    pageSize: 20,
    archived: true,
  })

  const reservations = data?.data || []
  const totalPages = data?.totalPages || 1

  const handleUnarchive = async (id: string) => {
    toast.promise(
      unarchiveMutation.mutateAsync({ id, reason: 'Przywrócono z archiwum' }),
      {
        loading: 'Przywracanie rezerwacji...',
        success: () => {
          refetch()
          return 'Rezerwacja przywrócona z archiwum'
        },
        error: 'Błąd podczas przywracania',
      }
    )
  }

  const stats = {
    total: reservations.length,
    completed: reservations.filter((r: any) => r.status === 'COMPLETED').length,
    cancelled: reservations.filter((r: any) => r.status === 'CANCELLED').length,
  }

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Archiwum Rezerwacji"
        subtitle="Przeglądaj i zarządzaj zarchiwizowanymi rezerwacjami"
        icon={Archive}
        action={
          <Link href="/dashboard/reservations">
            <Button
              size="lg"
              className="bg-white text-neutral-600 hover:bg-white/90 shadow-xl"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Wróć do rezerwacji
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          label="Zarchiwizowane"
          value={stats.total}
          subtitle="Łącznie w archiwum"
          icon={Archive}
          iconGradient="from-neutral-500 to-neutral-600"
          delay={0.1}
        />
        <StatCard
          label="Zakończone"
          value={stats.completed}
          subtitle="Pomyślnie zrealizowane"
          icon={Calendar}
          iconGradient="from-emerald-500 to-teal-500"
          delay={0.2}
        />
        <StatCard
          label="Anulowane"
          value={stats.cancelled}
          subtitle="Anulowane rezerwacje"
          icon={Clock}
          iconGradient="from-red-500 to-rose-500"
          delay={0.3}
        />
      </div>

      {/* Archive List */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <LoadingState variant="skeleton" count={5} />
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-600 dark:text-red-400">
                Wystąpił błąd podczas ładowania archiwum
              </p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 py-16 text-center">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4 shadow-md',
                  accent.iconBg
                )}
              >
                <Archive className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Archiwum jest puste
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400">
                Brak zarchiwizowanych rezerwacji
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Count */}
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Znaleziono{' '}
                <strong className="text-neutral-900 dark:text-neutral-100">
                  {reservations.length}
                </strong>{' '}
                zarchiwizowanych rezerwacji
              </div>

              {/* Reservation Cards */}
              {reservations.map((reservation: any) => {
                const guestCount =
                  reservation.guests ||
                  (reservation.adults || 0) +
                    (reservation.children || 0) +
                    (reservation.toddlers || 0)

                return (
                  <div
                    key={reservation.id}
                    className={cn(
                      'rounded-2xl bg-white dark:bg-neutral-800/80',
                      'border border-neutral-200/80 dark:border-neutral-700/50',
                      'shadow-md hover:shadow-lg transition-all duration-300',
                      'overflow-hidden'
                    )}
                  >
                    <div
                      className={cn(
                        'p-4 sm:p-6',
                        `bg-gradient-to-r ${accent.gradientSubtle}`
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'p-2 rounded-xl bg-gradient-to-br shadow-sm',
                              accent.iconBg
                            )}
                          >
                            <Archive className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 truncate">
                              {reservation.client
                                ? `${reservation.client.firstName} ${reservation.client.lastName}`
                                : 'Nieznany klient'}
                            </div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                              {reservation.eventType?.name || 'Wydarzenie'}
                              {reservation.hall?.name &&
                                ` · ${reservation.hall.name}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
                          <StatusBadge type="reservation" status={reservation.status} />
                          {reservation.archivedAt && (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                              Zarchiwizowano:{' '}
                              {format(
                                new Date(reservation.archivedAt),
                                'd MMM yyyy',
                                { locale: pl }
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="my-4 border-t border-neutral-200/50 dark:border-neutral-700/30" />

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            <Calendar className="h-3 w-3" /> Data
                          </div>
                          <div className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                            {reservation.startDateTime
                              ? format(
                                  new Date(reservation.startDateTime),
                                  'd MMM yyyy',
                                  { locale: pl }
                                )
                              : reservation.date || 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            <Users className="h-3 w-3" /> Goście
                          </div>
                          <div className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                            {guestCount} osób
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            <DollarSign className="h-3 w-3" /> Wartość
                          </div>
                          <div className="font-bold text-sm sm:text-lg text-green-600 dark:text-green-400">
                            {reservation.totalPrice
                              ? formatCurrency(reservation.totalPrice)
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="flex items-end justify-end gap-1">
                          <Link
                            href={`/dashboard/reservations/${reservation.id}`}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Zobacz szczegóły"
                              className="rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnarchive(reservation.id)}
                            title="Przywróć z archiwum"
                            className="rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                          >
                            <ArchiveRestore className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Przywróć</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Strona{' '}
                    <strong className="text-neutral-900 dark:text-neutral-100">
                      {page}
                    </strong>{' '}
                    z{' '}
                    <strong className="text-neutral-900 dark:text-neutral-100">
                      {totalPages}
                    </strong>
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
                      <span className="hidden sm:inline">Poprzednia</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="rounded-xl border-neutral-200 dark:border-neutral-700"
                    >
                      <span className="hidden sm:inline">Następna</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}

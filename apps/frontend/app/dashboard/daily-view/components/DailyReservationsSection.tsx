'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar,
  ArrowRight,
  Users,
  Building2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import { useReservations } from '@/lib/api/reservations'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import type { Reservation } from '@/types'


function toLocalTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  if (/^\d{2}:\d{2}/.test(iso)) return iso.slice(0, 5)
  try {
    return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  } catch { return null }
}

function getDayNumber(r: Reservation): string {
  if (r.date) return String(r.date).split('-')[2] ?? '?'
  if (r.startDateTime) return String(new Date(r.startDateTime).getDate()).padStart(2, '0')
  return '?'
}

function getStartTime(r: Reservation): string | null {
  if (r.startDateTime) return toLocalTime(r.startDateTime)
  if (r.startTime) return toLocalTime(r.startTime)
  return null
}

function getEndTime(r: Reservation): string | null {
  if (r.endDateTime) return toLocalTime(r.endDateTime)
  if (r.endTime) return toLocalTime(r.endTime)
  return null
}

function getDeadlineInfo(
  deadline: string | null | undefined
): { daysLeft: number; urgent: boolean } | null {
  if (!deadline) return null
  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (daysLeft < 0 || daysLeft > 7) return null
  return { daysLeft, urgent: daysLeft <= 3 }
}

// ─── Mobile agenda card ─────────────────────────────────────────────────────

function MobileAgendaCard({ reservation, index }: { reservation: Reservation; index: number }) {
  const r = reservation as any
  const clientName = `${r.client?.firstName ?? ''} ${r.client?.lastName ?? ''}`.trim()

  const startTime = getStartTime(r)
  const endTime = getEndTime(r)

  const adults: number = r.adults ?? 0
  const childrenCount: number = r.children ?? 0
  const toddlers: number = r.toddlers ?? 0
  const totalGuests: number = r.guests ?? adults + childrenCount + toddlers

  const deadlineInfo = getDeadlineInfo(r.confirmationDeadline)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + index * 0.04 }}
    >
      <Link
        href={`/dashboard/reservations/${r.id}`}
        className="flex gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/80 active:scale-[0.98] transition-transform"
      >
        {/* Time column */}
        <div className="text-center min-w-[56px] py-1 flex-shrink-0">
          {startTime ? (
            <>
              <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{startTime}</div>
              {endTime && (
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{endTime}</div>
              )}
            </>
          ) : (
            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">--:--</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Hall name */}
          <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {r.hall?.name ?? r.eventType?.name ?? 'Wydarzenie'}
          </div>

          {/* Client + guest count */}
          <div className="text-xs text-neutral-600 dark:text-neutral-300 truncate mt-0.5">
            {clientName || 'Brak klienta'}
            {totalGuests > 0 && <> &bull; {totalGuests} os.</>}
          </div>

          {/* Status badge + alerts */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <StatusBadge type="reservation" status={r.status} />
            {deadlineInfo && (
              <span className={cn(
                'inline-flex items-center gap-0.5 text-[10px] font-medium',
                deadlineInfo.urgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
              )}>
                <AlertTriangle className="h-2.5 w-2.5" />
                {deadlineInfo.daysLeft === 0 ? 'Dziś!' : `${deadlineInfo.daysLeft}d`}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        {Number(r.totalPrice) > 0 && (
          <div className="text-right flex-shrink-0 self-center">
            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
              {formatCurrency(Number(r.totalPrice))}
            </p>
          </div>
        )}
      </Link>
    </motion.div>
  )
}

// ─── Reservation row (desktop) ──────────────────────────────────────────────

function ReservationRow({ reservation, index }: { reservation: Reservation; index: number }) {
  const r = reservation as any
  const accent = moduleAccents.reservations
  const clientName = `${r.client?.firstName ?? ''} ${r.client?.lastName ?? ''}`.trim()

  const startTime = getStartTime(r)
  const endTime = getEndTime(r)
  const dayNumber = getDayNumber(r)

  const adults: number = r.adults ?? 0
  const childrenCount: number = r.children ?? 0
  const toddlers: number = r.toddlers ?? 0
  const totalGuests: number = r.guests ?? adults + childrenCount + toddlers

  const pendingDeposits = (r.deposits ?? []).reduce(
    (sum: number, d: { remainingAmount: string }) => sum + Number(d.remainingAmount),
    0
  )

  const deadlineInfo = getDeadlineInfo(r.confirmationDeadline)

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + index * 0.06 }}
    >
      <Link
        href={`/dashboard/reservations/${r.id}`}
        className="group flex items-start gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 hover:-translate-y-0.5 border border-neutral-100 dark:border-neutral-700/50 hover:border-blue-200 dark:hover:border-blue-800/50"
      >
        {/* Badge: czas lub dzień */}
        <div
          className={cn(
            'flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm flex-shrink-0',
            accent.iconBg
          )}
        >
          {startTime ? (
            <>
              <span className="text-xs font-bold leading-tight">{startTime}</span>
              {endTime && (
                <span className="text-[10px] leading-tight opacity-80">–{endTime}</span>
              )}
            </>
          ) : (
            <>
              <Calendar className="h-3.5 w-3.5 mb-0.5" />
              <span className="text-lg font-bold leading-none">{dayNumber}</span>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Linia 1: typ wydarzenia + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
              {r.eventType?.name ?? 'Wydarzenie'}
            </span>
            <StatusBadge type="reservation" status={r.status} />
          </div>

          {/* Linia 2: klient + sala */}
          <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5 truncate">
            {clientName}
            {r.hall && (
              <> • <Building2 className="inline h-3 w-3 mb-0.5" /> {r.hall.name}</>
            )}
          </p>

          {/* Linia 3: goście z rozbiciem */}
          {totalGuests > 0 && (
            <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5 flex items-center gap-1">
              <Users className="h-3 w-3 flex-shrink-0" />
              {(r.adults != null && r.children != null && r.toddlers != null) ? (
                <span>
                  {adults} dor.
                  {childrenCount > 0 && <> • {childrenCount} dz.</>}
                  {toddlers > 0 && <> • {toddlers} mal.</>}
                  <span className="text-neutral-500"> ({totalGuests} os.)</span>
                </span>
              ) : (
                <span>{totalGuests} os.</span>
              )}
            </p>
          )}

          {/* Alerty */}
          {(deadlineInfo || pendingDeposits > 0) && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {deadlineInfo && (
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  deadlineInfo.urgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                )}>
                  <AlertTriangle className="h-3 w-3" />
                  Potwierdzenie za {deadlineInfo.daysLeft === 0 ? 'dziś' : `${deadlineInfo.daysLeft} dni`}
                </span>
              )}
              {pendingDeposits > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  💰 Zaliczka: {formatCurrency(pendingDeposits)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Cena + strzałka */}
        <div className="text-right flex-shrink-0 ml-1">
          {Number(r.totalPrice) > 0 && (
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
              {formatCurrency(Number(r.totalPrice))}
            </p>
          )}
          <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all mt-1 ml-auto" />
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Summary footer (identyczna struktura co catering) ────────────────────────────

function SummaryFooter({ reservations }: { reservations: Reservation[] }) {
  const accent = moduleAccents.reservations
  const totalValue = reservations.reduce((sum, r) => sum + Number(r.totalPrice ?? 0), 0)
  const confirmedCount = reservations.filter((r) => r.status === 'CONFIRMED').length
  const deadlineCount = reservations.filter((r) => {
    if (!r.confirmationDeadline) return false
    const daysLeft = Math.ceil((new Date(r.confirmationDeadline).getTime() - Date.now()) / 86_400_000)
    return daysLeft >= 0 && daysLeft <= 3
  }).length

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl px-4 py-3 mt-2',
        'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10',
        'border border-blue-100 dark:border-blue-800/30'
      )}
    >
      <div className="flex items-center gap-3 text-sm flex-wrap">
        <span className="text-neutral-600 dark:text-neutral-300">
          <span className="font-bold text-neutral-900 dark:text-neutral-100">{reservations.length}</span>
          {' '}rezerwacji
        </span>
        {confirmedCount > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400 text-xs">
            ✅ {confirmedCount} potw.
          </span>
        )}
        {deadlineCount > 0 && (
          <span className="text-red-600 dark:text-red-400 text-xs flex items-center gap-0.5">
            <AlertTriangle className="h-3 w-3" /> {deadlineCount} deadline
          </span>
        )}
      </div>
      <span className={cn('text-base font-bold whitespace-nowrap', accent.text, accent.textDark)}>
        {formatCurrency(totalValue)}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────────

interface DailyReservationsSectionProps {
  date: string
}

export default function DailyReservationsSection({ date }: DailyReservationsSectionProps) {
  const accent = moduleAccents.reservations

  const { data, isLoading, error, refetch } = useReservations({
    dateFrom: date,
    dateTo: `${date}T23:59:59.999Z`,
    pageSize: 50,
  })

  const reservations = data?.data ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl bg-white dark:bg-neutral-800/80 p-6 shadow-soft border border-neutral-100 dark:border-neutral-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
              accent.iconBg
            )}
          >
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              📅 Rezerwacje
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              Zaplanowane na ten dzień
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="rounded-lg p-1.5 text-neutral-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Odśwież"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/dashboard/reservations"
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80',
              accent.text,
              accent.textDark
            )}
          >
            Wszystkie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {isLoading ? (
          <LoadingState variant="skeleton" count={3} />
        ) : error ? (
          <ErrorState
            message="Nie udało się pobrać rezerwacji"
            onRetry={() => refetch()}
          />
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Brak rezerwacji na ten dzień"
            description="Nie zaplanowano jeszcze żadnych wydarzeń. Dodaj nową rezerwację, aby zapełnić kalendarz."
            actionLabel="Dodaj rezerwację"
            actionHref="/dashboard/reservations/new"
            variant="compact"
          />
        ) : (
          <>
            {/* Desktop: full reservation rows */}
            <div className="hidden md:block space-y-2">
              {reservations.map((reservation, index) => (
                <ReservationRow key={reservation.id} reservation={reservation} index={index} />
              ))}
            </div>

            {/* Mobile: compact agenda-style cards */}
            <div className="md:hidden space-y-2">
              {[...reservations]
                .sort((a, b) => {
                  const timeA = getStartTime(a) ?? '99:99'
                  const timeB = getStartTime(b) ?? '99:99'
                  return timeA.localeCompare(timeB)
                })
                .map((reservation, index) => (
                  <MobileAgendaCard key={reservation.id} reservation={reservation} index={index} />
                ))}
            </div>

            <SummaryFooter reservations={reservations} />
          </>
        )}
      </div>
    </motion.div>
  )
}

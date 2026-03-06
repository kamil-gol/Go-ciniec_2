'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar,
  ArrowRight,
  AlertCircle,
  Clock,
  Users,
  Building2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import { useReservations } from '@/lib/api/reservations'
import type { Reservation } from '@/types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; emoji: string; classes: string }> = {
  CONFIRMED: {
    label: 'Potwierdzone',
    emoji: '✅',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  PENDING: {
    label: 'Oczekuje',
    emoji: '⏳',
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  RESERVED: {
    label: 'W kolejce',
    emoji: '📋',
    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  COMPLETED: {
    label: 'Zakończone',
    emoji: '🏁',
    classes: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  },
  CANCELLED: {
    label: 'Anulowane',
    emoji: '❌',
    classes: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 border border-neutral-100 dark:border-neutral-700/50 animate-pulse">
      <div className="h-14 w-14 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-20 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="h-3 w-56 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
  )
}

// ─── Reservation row ──────────────────────────────────────────────────────────

function ReservationRow({ reservation, index }: { reservation: Reservation; index: number }) {
  const accent = moduleAccents.reservations
  const status = reservation.status as string
  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.PENDING
  const clientName = `${reservation.client?.firstName ?? ''} ${reservation.client?.lastName ?? ''}`.trim()

  const pendingDeposits = (reservation.deposits ?? []).reduce(
    (sum: number, d: { remainingAmount: string }) => sum + Number(d.remainingAmount),
    0
  )

  // Date badge display
  const dateStr = reservation.date ?? ''
  const [, , day] = dateStr.split('-')
  const startTime = (reservation as any).startTime as string | undefined

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + index * 0.06 }}
    >
      <Link
        href={`/dashboard/reservations/${reservation.id}`}
        className="group flex items-center gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 hover:-translate-y-0.5 border border-neutral-100 dark:border-neutral-700/50 hover:border-blue-200 dark:hover:border-blue-800/50"
      >
        {/* Date badge */}
        <div
          className={cn(
            'flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm flex-shrink-0',
            accent.iconBg
          )}
        >
          {startTime ? (
            <>
              <Clock className="h-3.5 w-3.5 mb-0.5" />
              <span className="text-xs font-bold leading-none">{startTime.slice(0, 5)}</span>
            </>
          ) : (
            <>
              <Calendar className="h-3.5 w-3.5 mb-0.5" />
              <span className="text-lg font-bold leading-none">{day ?? '?'}</span>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
              {(reservation as any).eventType?.name ?? 'Wydarzenie'}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0',
                statusInfo.classes
              )}
            >
              {statusInfo.emoji} {statusInfo.label}
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {clientName}
            {(reservation as any).hall && (
              <>
                {' • '}
                <Building2 className="inline h-3 w-3 mb-0.5" />{' '}
                {(reservation as any).hall.name}
              </>
            )}
            {(reservation as any).guests > 0 && (
              <>
                {' • '}
                <Users className="inline h-3 w-3 mb-0.5" />{' '}
                {(reservation as any).guests} os.
              </>
            )}
          </p>

          {pendingDeposits > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              💰 Zaliczka do zapłaty: {formatCurrency(pendingDeposits)}
            </p>
          )}
        </div>

        {/* Price */}
        {Number(reservation.totalPrice) > 0 && (
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(Number(reservation.totalPrice))}
            </p>
          </div>
        )}

        <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </Link>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────────

interface DailyReservationsSectionProps {
  /** Data w formacie YYYY-MM-DD */
  date: string
}

export default function DailyReservationsSection({ date }: DailyReservationsSectionProps) {
  const accent = moduleAccents.reservations

  const { data, isLoading, error, refetch } = useReservations({
    dateFrom: date,
    dateTo: date,
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
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Zaplanowane na ten dzień
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
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
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800 dark:text-red-300 flex-1">
              Nie udało się pobrać rezerwacji
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline flex-shrink-0"
            >
              Spróbuj ponownie
            </button>
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div
              className={cn(
                'mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br opacity-20',
                accent.iconBg
              )}
            >
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Brak rezerwacji na ten dzień
            </p>
            <Link
              href="/dashboard/reservations/new"
              className={cn(
                'mt-2 text-sm font-medium hover:opacity-80 transition-opacity',
                accent.text,
                accent.textDark
              )}
            >
              + Nowa rezerwacja
            </Link>
          </div>
        ) : (
          reservations.map((reservation, index) => (
            <ReservationRow key={reservation.id} reservation={reservation} index={index} />
          ))
        )}
      </div>
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  Users,
  ArrowRight,
  LayoutDashboard,
  Wallet,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { PageLayout, PageHero, StatCard, EmptyState } from '@/components/shared'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'
import { useDashboardOverview, useDashboardUpcoming } from '@/lib/api/stats-api'

// ===============================================================
// HELPERS
// ===============================================================

const statusLabels: Record<string, { label: string; emoji: string; classes: string }> = {
  CONFIRMED: {
    label: 'Potwierdzone',
    emoji: '✅',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  PENDING: {
    label: 'Oczekuje',
    emoji: '⌛',
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  RESERVED: {
    label: 'W kolejce',
    emoji: '📋',
    classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  COMPLETED: {
    label: 'Zakończone',
    emoji: '🏁',
    classes: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300',
  },
}


function formatDate(dateStr: string | null): { day: string; month: string; full: string } {
  if (!dateStr) return { day: '?', month: '?', full: 'Brak daty' }
  const [year, month, day] = dateStr.split('-')
  const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return {
    day,
    month: months[date.getMonth()],
    full: `${day}.${month}.${year}`,
  }
}

// ===============================================================
// SKELETON COMPONENTS
// ===============================================================

function SkeletonEvent() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 border border-neutral-100 dark:border-neutral-700/50">
      <div className="h-16 w-16 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 animate-skeleton" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" />
        <div className="h-3 w-56 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" style={{ animationDelay: '150ms' }} />
        <div className="h-3 w-28 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// ===============================================================
// MAIN COMPONENT
// ===============================================================

export default function DashboardPage() {
  const router = useRouter()
  const accent = moduleAccents.dashboard

  const {
    data: overview,
    isLoading: isLoadingOverview,
    error: overviewError,
    refetch: refetchOverview,
  } = useDashboardOverview()

  const {
    data: upcoming,
    isLoading: isLoadingUpcoming,
    error: upcomingError,
    refetch: refetchUpcoming,
  } = useDashboardUpcoming(10)

  const handleEventClick = (reservationId: string) => {
    router.push(`/dashboard/reservations/${reservationId}`)
  }

  const handleRefresh = () => {
    refetchOverview()
    refetchUpcoming()
  }

  // Build stats cards from real data
  const stats = overview
    ? [
        {
          name: 'Rezerwacje Dziś',
          value: String(overview.reservationsToday),
          change: `${overview.reservationsThisWeek} w tym tygodniu`,
          changeType: 'neutral' as const,
          icon: Calendar,
          gradient: statGradients.count,
        },
        {
          name: 'W Kolejce',
          value: String(overview.queueCount),
          change: `${overview.reservationsThisMonth} rezerwacji w miesiącu`,
          changeType: overview.queueCount > 0 ? ('neutral' as const) : ('positive' as const),
          icon: Clock,
          gradient: statGradients.alert,
        },
        {
          name: 'Potwierdzone',
          value: String(overview.confirmedThisMonth),
          change: 'ten miesiąc',
          changeType: 'positive' as const,
          icon: CheckCircle2,
          gradient: statGradients.success,
        },
        {
          name: 'Przychód miesiąc',
          value: formatCurrency(overview.revenueThisMonth),
          change:
            overview.revenueChangePercent > 0
              ? `+${overview.revenueChangePercent}% vs poprzedni`
              : overview.revenueChangePercent < 0
              ? `${overview.revenueChangePercent}% vs poprzedni`
              : 'bez zmian vs poprzedni',
          changeType:
            overview.revenueChangePercent > 0
              ? ('positive' as const)
              : overview.revenueChangePercent < 0
              ? ('negative' as const)
              : ('neutral' as const),
          icon: DollarSign,
          gradient: statGradients.financial,
        },
        {
          name: 'Klienci',
          value: String(overview.totalClients),
          change: `+${overview.newClientsThisMonth} nowych ten miesiąc`,
          changeType: overview.newClientsThisMonth > 0 ? ('positive' as const) : ('neutral' as const),
          icon: Users,
          gradient: statGradients.count,
        },
        {
          name: 'Oczekujące Zaliczki',
          value: String(overview.pendingDepositsCount),
          change:
            overview.pendingDepositsAmount > 0
              ? `${formatCurrency(overview.pendingDepositsAmount)} do zapłaty`
              : 'wszystko opłacone',
          changeType: overview.pendingDepositsCount > 0 ? ('negative' as const) : ('positive' as const),
          icon: Wallet,
          gradient: statGradients.alert,
        },
      ]
    : []

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Panel Główny"
        subtitle="Przeglądaj statystyki na żywo i zarządzaj rezerwacjami"
        icon={LayoutDashboard}
        action={
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
            title="Dane odświeżają się automatycznie co 60 sekund"
          >
            <RefreshCw className={cn('h-4 w-4', (isLoadingOverview || isLoadingUpcoming) && 'animate-spin')} />
            {isLoadingOverview || isLoadingUpcoming ? 'Ładowanie...' : 'Odśwież'}
          </button>
        }
      />

      {/* Error State */}
      {overviewError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Nie udało się pobrać statystyk
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Sprawdź połączenie z serwerem lub odśwież stronę
            </p>
          </div>
          <button
            onClick={() => refetchOverview()}
            className="ml-auto text-sm font-medium text-red-700 dark:text-red-300 hover:underline"
          >
            Spróbuj ponownie
          </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className={layout.statGrid6}>
        {isLoadingOverview
          ? Array.from({ length: 6 }).map((_, i) => (
              <StatCard key={i} label="" value="" icon={Calendar} iconGradient={statGradients.count} isLoading />
            ))
          : stats.map((stat, index) => (
              <StatCard
                key={stat.name}
                label={stat.name}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                iconGradient={stat.gradient}
                delay={index * 0.08}
              />
            ))}
      </div>

      {/* Upcoming Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-white dark:bg-neutral-800/80 p-6 shadow-soft border border-neutral-100 dark:border-neutral-700/50"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            📅 Najbliższe Wydarzenia
          </h3>
          <Link
            href="/dashboard/reservations"
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors',
              accent.text,
              accent.textDark,
              'hover:opacity-80'
            )}
          >
            Zobacz wszystkie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {isLoadingUpcoming ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonEvent key={i} />)
          ) : upcomingError ? (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-300">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nie udało się pobrać nadchodzących wydarzeń</p>
            </div>
          ) : upcoming && upcoming.length > 0 ? (
            upcoming.map((event, index) => {
              const dateInfo = formatDate(event.date)
              const statusInfo = statusLabels[event.status] || statusLabels.PENDING
              const clientName = `${event.client.firstName} ${event.client.lastName}`
              const pendingDepositTotal = event.deposits.reduce(
                (sum: number, d: { remainingAmount: string }) => sum + Number(d.remainingAmount),
                0
              )

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.08 }}
                  onClick={() => handleEventClick(event.id)}
                  className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-200 hover:-translate-y-0.5 border border-neutral-100 dark:border-neutral-700/50 cursor-pointer"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 sm:h-16 sm:w-16 flex-col items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg flex-shrink-0',
                      accent.iconBg
                    )}
                  >
                    <span className="text-[10px] sm:text-xs font-semibold">{dateInfo.month}</span>
                    <span className="text-base sm:text-2xl font-bold">{dateInfo.day}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {event.eventType?.name || 'Wydarzenie'}
                      </h4>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          statusInfo.classes
                        )}
                      >
                        {statusInfo.emoji} {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {clientName}
                      {event.startTime && ` • ${event.startTime}`}
                      {event.hall && ` • ${event.hall.name}`}
                      {event.guests > 0 && ` • ${event.guests} os.`}
                    </p>
                    {Number(event.totalPrice) > 0 && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                        💰 Wartość: {formatCurrency(Number(event.totalPrice))}
                      </p>
                    )}
                    {pendingDepositTotal > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        ⚠️ Zaliczka do zapłaty: {formatCurrency(pendingDepositTotal)}
                      </p>
                    )}
                  </div>

                  <ArrowRight
                    className={cn(
                      'h-5 w-5 text-neutral-500 group-hover:translate-x-1 transition-all',
                      'group-hover:text-indigo-500'
                    )}
                  />
                </motion.div>
              )
            })
          ) : (
            <EmptyState
              icon={Calendar}
              title="Kalendarz jest wolny"
              description="Nie masz nadchodzących wydarzeń. Czas na nowe rezerwacje!"
              actionLabel="Utwórz rezerwację"
              actionHref="/dashboard/reservations/new"
              variant="compact"
            />
          )}
        </div>
      </motion.div>
    </PageLayout>
  )
}

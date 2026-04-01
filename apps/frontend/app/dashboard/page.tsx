'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
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
  AlertTriangle,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { PageLayout } from '@/components/shared'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCardV2 } from '@/components/shared/StatCardV2'
import { StatusBadge } from '@/components/ui/status-badge'
import { ErrorState } from '@/components/ui/error-state'
import { layout } from '@/lib/design-tokens'
import { listContainerVariants, listItemVariants } from '@/lib/motion-tokens'
import { useDashboardOverview, useDashboardUpcoming } from '@/lib/api/stats-api'
import { Button } from '@/components/ui/button'

// ===============================================================
// HELPERS
// ===============================================================

function formatEventDate(dateStr: string | null): { day: string; month: string; full: string } {
  if (!dateStr) return { day: '?', month: '?', full: 'Brak daty' }
  const date = new Date(dateStr + 'T00:00:00')
  return {
    day: format(date, 'd'),
    month: format(date, 'MMM', { locale: pl }),
    full: format(date, 'dd.MM.yyyy'),
  }
}

// ===============================================================
// SKELETON
// ===============================================================

function SkeletonEvent() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-muted/30 p-4 border border-border animate-pulse">
      <div className="h-14 w-14 rounded-xl bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-3 w-56 rounded bg-muted" />
        <div className="h-3 w-28 rounded bg-muted" />
      </div>
    </div>
  )
}

// ===============================================================
// MAIN COMPONENT
// ===============================================================

export default function DashboardPage() {
  const router = useRouter()

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

  const stats = overview
    ? [
        {
          name: 'Rezerwacje Dziś',
          value: overview.reservationsToday,
          change: `${overview.reservationsThisWeek} w tym tygodniu`,
          changeType: 'neutral' as const,
          icon: Calendar,
        },
        {
          name: 'W Kolejce',
          value: overview.queueCount,
          change: `${overview.reservationsThisMonth} rezerwacji w miesiącu`,
          changeType: overview.queueCount > 0 ? ('neutral' as const) : ('positive' as const),
          icon: Clock,
        },
        {
          name: 'Potwierdzone',
          value: overview.confirmedThisMonth,
          change: 'ten miesiąc',
          changeType: 'positive' as const,
          icon: CheckCircle2,
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
        },
        {
          name: 'Klienci',
          value: overview.totalClients,
          change: `+${overview.newClientsThisMonth} nowych ten miesiąc`,
          changeType: overview.newClientsThisMonth > 0 ? ('positive' as const) : ('neutral' as const),
          icon: Users,
        },
        {
          name: 'Oczekujące Zaliczki',
          value: overview.pendingDepositsCount,
          change:
            overview.pendingDepositsAmount > 0
              ? `${formatCurrency(overview.pendingDepositsAmount)} do zapłaty`
              : 'wszystko opłacone',
          changeType: overview.pendingDepositsCount > 0 ? ('negative' as const) : ('positive' as const),
          icon: Wallet,
        },
      ]
    : []

  return (
    <PageLayout>
      <PageHeader
        title="Panel Główny"
        subtitle="Przeglądaj statystyki na żywo i zarządzaj rezerwacjami"
        icon={LayoutDashboard}
        showBreadcrumb={false}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingOverview || isLoadingUpcoming}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', (isLoadingOverview || isLoadingUpcoming) && 'animate-spin')} />
            {isLoadingOverview || isLoadingUpcoming ? 'Ładowanie...' : 'Odśwież'}
          </Button>
        }
      />

      {overviewError && (
        <ErrorState
          compact
          message="Nie udało się pobrać statystyk"
          description="Sprawdź połączenie z serwerem lub odśwież stronę"
          onRetry={() => refetchOverview()}
        />
      )}

      <div className={layout.statGrid6}>
        {isLoadingOverview
          ? Array.from({ length: 6 }).map((_, i) => (
              <StatCardV2 key={i} label="" value={0} icon={Calendar} isLoading />
            ))
          : stats.map((stat, index) => (
              <StatCardV2
                key={stat.name}
                label={stat.name}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                delay={index * 0.08}
              />
            ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl bg-card p-6 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Najbliższe Wydarzenia
          </h3>
          <Link
            href="/dashboard/reservations"
            className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:opacity-80 transition-colors"
          >
            Zobacz wszystkie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <motion.div
          variants={listContainerVariants}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {isLoadingUpcoming ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonEvent key={i} />)
          ) : upcomingError ? (
            <ErrorState
              compact
              message="Nie udało się pobrać nadchodzących wydarzeń"
              onRetry={() => refetchUpcoming()}
            />
          ) : upcoming && upcoming.length > 0 ? (
            upcoming.map((event) => {
              const dateInfo = formatEventDate(event.date)
              const clientName = `${event.client.firstName} ${event.client.lastName}`
              const pendingDepositTotal = event.deposits.reduce(
                (sum: number, d: { remainingAmount: string }) => sum + Number(d.remainingAmount),
                0
              )

              return (
                <motion.div
                  key={event.id}
                  variants={listItemVariants}
                  onClick={() => handleEventClick(event.id)}
                  className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl bg-muted/30 p-4 hover:bg-muted/50 transition-colors duration-150 border border-border cursor-pointer"
                >
                  <div className="flex h-10 w-10 sm:h-14 sm:w-14 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 flex-shrink-0">
                    <span className="text-[10px] sm:text-xs font-medium uppercase">{dateInfo.month}</span>
                    <span className="text-base sm:text-xl font-bold leading-none">{dateInfo.day}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-foreground">
                        {event.eventType?.name || 'Wydarzenie'}
                      </h4>
                      <StatusBadge type="reservation" status={event.status} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {clientName}
                      {event.startTime && ` \u2022 ${event.startTime}`}
                      {event.hall && ` \u2022 ${event.hall.name}`}
                      {event.guests > 0 && ` \u2022 ${event.guests} os.`}
                    </p>
                    {Number(event.totalPrice) > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        Wartość: {formatCurrency(Number(event.totalPrice))}
                      </p>
                    )}
                    {pendingDepositTotal > 0 && (
                      <p className="text-xs text-warning-600 dark:text-warning-400 mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Zaliczka do zapłaty: {formatCurrency(pendingDepositTotal)}
                      </p>
                    )}
                  </div>

                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:translate-x-1 group-hover:text-primary-500 transition-all hidden sm:block" />
                </motion.div>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Brak nadchodzących wydarzeń</p>
              <Link
                href="/dashboard/reservations/new"
                className="text-sm font-medium mt-2 inline-block text-primary-600 dark:text-primary-400"
              >
                Utwórz nową rezerwację →
              </Link>
            </div>
          )}
        </motion.div>
      </motion.div>
    </PageLayout>
  )
}

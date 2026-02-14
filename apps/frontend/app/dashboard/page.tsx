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
import { cn } from '@/lib/utils'
import { PageLayout, PageHero, StatCard } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'
import { useDashboardOverview, useDashboardUpcoming } from '@/lib/api/stats-api'

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const statusLabels: Record<string, { label: string; emoji: string; classes: string }> = {
  CONFIRMED: {
    label: 'Potwierdzone',
    emoji: '\u2705',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  PENDING: {
    label: 'Oczekuje',
    emoji: '\u231B',
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  RESERVED: {
    label: 'W kolejce',
    emoji: '\uD83D\uDCCB',
    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  COMPLETED: {
    label: 'Zako\u0144czone',
    emoji: '\uD83C\uDFC1',
    classes: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
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

function formatDate(dateStr: string | null): { day: string; month: string; full: string } {
  if (!dateStr) return { day: '?', month: '?', full: 'Brak daty' }
  const [year, month, day] = dateStr.split('-')
  const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Pa\u017A', 'Lis', 'Gru']
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return {
    day,
    month: months[date.getMonth()],
    full: `${day}.${month}.${year}`,
  }
}

// ═══════════════════════════════════════════════════════════════
// SKELETON COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-800/80 p-6 shadow-soft border border-neutral-100 dark:border-neutral-700/50 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-9 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3.5 w-36 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
      </div>
    </div>
  )
}

function SkeletonEvent() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 border border-neutral-100 dark:border-neutral-700/50 animate-pulse">
      <div className="h-16 w-16 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-56 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-28 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

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
          name: 'Rezerwacje Dzi\u015B',
          value: String(overview.reservationsToday),
          change: `${overview.reservationsThisWeek} w tym tygodniu`,
          changeType: 'neutral' as const,
          icon: Calendar,
          gradient: 'from-blue-500 to-cyan-500',
        },
        {
          name: 'W Kolejce',
          value: String(overview.queueCount),
          change: `${overview.reservationsThisMonth} rezerwacji w miesi\u0105cu`,
          changeType: overview.queueCount > 0 ? ('neutral' as const) : ('positive' as const),
          icon: Clock,
          gradient: 'from-amber-500 to-orange-500',
        },
        {
          name: 'Potwierdzone',
          value: String(overview.confirmedThisMonth),
          change: 'ten miesi\u0105c',
          changeType: 'positive' as const,
          icon: CheckCircle2,
          gradient: 'from-emerald-500 to-teal-500',
        },
        {
          name: 'Przych\u00F3d miesi\u0105c',
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
          gradient: 'from-violet-500 to-purple-500',
        },
        {
          name: 'Klienci',
          value: String(overview.totalClients),
          change: `+${overview.newClientsThisMonth} nowych ten miesi\u0105c`,
          changeType: overview.newClientsThisMonth > 0 ? ('positive' as const) : ('neutral' as const),
          icon: Users,
          gradient: 'from-indigo-500 to-blue-500',
        },
        {
          name: 'Oczekuj\u0105ce Zaliczki',
          value: String(overview.pendingDepositsCount),
          change:
            overview.pendingDepositsAmount > 0
              ? `${formatCurrency(overview.pendingDepositsAmount)} do zap\u0142aty`
              : 'wszystko op\u0142acone',
          changeType: overview.pendingDepositsCount > 0 ? ('negative' as const) : ('positive' as const),
          icon: Wallet,
          gradient: 'from-rose-500 to-pink-500',
        },
      ]
    : []

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Panel G\u0142\u00F3wny"
        subtitle="Przegl\u0105daj statystyki na \u017Cywo i zarz\u0105dzaj rezerwacjami"
        icon={LayoutDashboard}
        action={
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Od\u015Bwie\u017C
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
              Nie uda\u0142o si\u0119 pobra\u0107 statystyk
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Sprawd\u017A po\u0142\u0105czenie z serwerem lub od\u015Bwie\u017C stron\u0119
            </p>
          </div>
          <button
            onClick={() => refetchOverview()}
            className="ml-auto text-sm font-medium text-red-700 dark:text-red-300 hover:underline"
          >
            Spr\u00F3buj ponownie
          </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingOverview
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
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
            \uD83D\uDCC5 Najbli\u017Csze Wydarzenia
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
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nie uda\u0142o si\u0119 pobra\u0107 nadchodz\u0105cych wydarze\u0144</p>
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
                  className="group flex items-center gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-200 hover:-translate-y-0.5 border border-neutral-100 dark:border-neutral-700/50 cursor-pointer"
                >
                  <div
                    className={cn(
                      'flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg flex-shrink-0',
                      accent.iconBg
                    )}
                  >
                    <span className="text-xs font-semibold">{dateInfo.month}</span>
                    <span className="text-2xl font-bold">{dateInfo.day}</span>
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
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {clientName}
                      {event.startTime && ` \u2022 ${event.startTime}`}
                      {event.hall && ` \u2022 ${event.hall.name}`}
                      {event.guests > 0 && ` \u2022 ${event.guests} os.`}
                    </p>
                    {pendingDepositTotal > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        \uD83D\uDCB0 Zaliczka do zap\u0142aty: {formatCurrency(pendingDepositTotal)}
                      </p>
                    )}
                    {event.deposits.length === 0 && Number(event.totalPrice) > 0 && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                        \uD83D\uDCB0 Warto\u015B\u0107: {formatCurrency(Number(event.totalPrice))}
                      </p>
                    )}
                  </div>

                  <ArrowRight
                    className={cn(
                      'h-5 w-5 text-neutral-400 group-hover:translate-x-1 transition-all',
                      'group-hover:text-indigo-500'
                    )}
                  />
                </motion.div>
              )
            })
          ) : (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Brak nadchodz\u0105cych wydarze\u0144</p>
              <Link
                href="/dashboard/reservations/new"
                className={cn(
                  'text-sm font-medium mt-2 inline-block',
                  accent.text,
                  accent.textDark
                )}
              >
                Utw\u00F3rz now\u0105 rezerwacj\u0119 \u2192
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </PageLayout>
  )
}

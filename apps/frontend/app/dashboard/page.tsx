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
  TrendingUp,
  Building2,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageLayout, PageHero, StatCard } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

const stats = [
  {
    name: 'Rezerwacje Dzisiaj',
    value: '12',
    change: '+15%',
    changeType: 'positive' as const,
    icon: Calendar,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'W Kolejce',
    value: '5',
    change: '-2 od wczoraj',
    changeType: 'neutral' as const,
    icon: Clock,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Potwierdzone',
    value: '8',
    change: '+3 dzisiaj',
    changeType: 'positive' as const,
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Przychód miesiąc',
    value: '45,000 zł',
    change: '+12%',
    changeType: 'positive' as const,
    icon: DollarSign,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    name: 'Nowi Klienci',
    value: '24',
    change: 'ten miesiąc',
    changeType: 'neutral' as const,
    icon: Users,
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    name: 'Zajętość Sal',
    value: '85%',
    change: 'ten tydzień',
    changeType: 'positive' as const,
    icon: Building2,
    gradient: 'from-rose-500 to-pink-500',
  },
]

const upcomingEvents = [
  {
    id: 1,
    reservationId: '19acd0e5-2b9b-428d-99c9-1989d03a19d5',
    date: '15 Luty',
    time: '18:00',
    type: 'Wesele',
    client: 'Jan i Anna',
    hall: 'Sala Duża',
    status: 'confirmed',
    deposit: '5,000 zł',
  },
  {
    id: 2,
    reservationId: '29acd0e5-2b9b-428d-99c9-1989d03a19d6',
    date: '20 Luty',
    time: '15:00',
    type: 'Komunia Święta',
    client: 'Rodzina Kowalskich',
    hall: 'Sala Mała',
    status: 'pending',
    deposit: '3,000 zł (do zapłaty)',
  },
  {
    id: 3,
    reservationId: '39acd0e5-2b9b-428d-99c9-1989d03a19d7',
    date: '25 Luty',
    time: '16:00',
    type: 'Urodziny',
    client: 'Maria Nowak',
    hall: 'Sala Duża',
    status: 'confirmed',
    deposit: '2,000 zł',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const accent = moduleAccents.dashboard

  const handleEventClick = (reservationId: string) => {
    router.push(`/dashboard/reservations/${reservationId}`)
  }

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Panel Główny"
        subtitle="Przejrzyj kluczowe statystyki i zarządzaj rezerwacjami"
        icon={LayoutDashboard}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
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
              accent.text, accent.textDark,
              'hover:opacity-80'
            )}
          >
            Zobacz wszystkie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.08 }}
              onClick={() => handleEventClick(event.reservationId)}
              className="group flex items-center gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-200 hover:-translate-y-0.5 border border-neutral-100 dark:border-neutral-700/50 cursor-pointer"
            >
              <div className={cn(
                'flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg flex-shrink-0',
                accent.iconBg
              )}>
                <span className="text-xs font-semibold">{event.date.split(' ')[1]}</span>
                <span className="text-2xl font-bold">{event.date.split(' ')[0]}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {event.type}
                  </h4>
                  <span className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    event.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  )}>
                    {event.status === 'confirmed' ? '✅ Potwierdzone' : '⌛ Oczekuje'}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {event.client} • {event.time} • {event.hall}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  💰 Zaliczka: {event.deposit}
                </p>
              </div>

              <ArrowRight className={cn(
                'h-5 w-5 text-neutral-400 group-hover:translate-x-1 transition-all',
                `group-hover:${accent.text}`
              )} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </PageLayout>
  )
}

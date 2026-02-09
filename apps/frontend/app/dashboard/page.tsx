'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  Users,
  TrendingUp,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const stats = [
  {
    name: 'Rezerwacje Dzisiaj',
    value: '12',
    change: '+15%',
    changeType: 'positive',
    icon: Calendar,
    color: 'from-primary-500 to-primary-600',
  },
  {
    name: 'W Kolejce',
    value: '5',
    change: '-2 od wczoraj',
    changeType: 'neutral',
    icon: Clock,
    color: 'from-warning-500 to-warning-600',
  },
  {
    name: 'Potwierdzone',
    value: '8',
    change: '+3 dzisiaj',
    changeType: 'positive',
    icon: CheckCircle2,
    color: 'from-success-500 to-success-600',
  },
  {
    name: 'Przychód miesiąc',
    value: '45,000 zł',
    change: '+12%',
    changeType: 'positive',
    icon: DollarSign,
    color: 'from-secondary-500 to-secondary-600',
  },
  {
    name: 'Nowi Klienci',
    value: '24',
    change: 'ten miesiąc',
    changeType: 'neutral',
    icon: Users,
    color: 'from-primary-500 to-secondary-500',
  },
  {
    name: 'Zajętość Sal',
    value: '85%',
    change: 'ten tydzień',
    changeType: 'positive',
    icon: Building2,
    color: 'from-warning-500 to-error-500',
  },
]

const upcomingEvents = [
  {
    id: 1,
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
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Panel Główny
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Przejrzyj kluczowe statystyki i zarządzaj rezerwacjami
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border border-neutral-200 dark:border-neutral-700"
            >
              {/* Gradient overlay */}
              <div className={cn(
                'absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity',
                `bg-gradient-to-br ${stat.color}`
              )} />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      {stat.name}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stat.value}
                    </p>
                    <p className={cn(
                      'mt-2 text-sm flex items-center gap-1',
                      stat.changeType === 'positive' && 'text-success-600 dark:text-success-400',
                      stat.changeType === 'neutral' && 'text-neutral-600 dark:text-neutral-400'
                    )}>
                      {stat.changeType === 'positive' && <TrendingUp className="h-4 w-4" />}
                      {stat.change}
                    </p>
                  </div>
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-glow',
                    stat.color
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Upcoming Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            📅 Najbliższe Wydarzenia
          </h3>
          <Link
            href="/dashboard/reservations"
            className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            Zobacz wszystkie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="group flex items-center gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all hover:scale-[1.01] border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-glow flex-shrink-0">
                <span className="text-xs font-semibold">{event.date.split(' ')[1]}</span>
                <span className="text-2xl font-bold">{event.date.split(' ')[0]}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {event.type}
                  </h4>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    event.status === 'confirmed'
                      ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                      : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
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

              <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

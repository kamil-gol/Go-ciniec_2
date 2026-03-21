'use client'

import { Client } from '@/types'
import { Users, UserPlus, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'


interface ClientStatsProps {
  clients: (Client & { _count?: { reservations: number } })[]
  isLoading?: boolean
}

export default function ClientStats({ clients, isLoading = false }: ClientStatsProps) {
  const stats = useMemo(() => {
    if (!clients || clients.length === 0) {
      return {
        totalClients: 0,
        newClients: 0,
        withReservations: 0,
      }
    }

    const totalClients = clients.length
    const withReservations = clients.filter(
      (c) => c._count && c._count.reservations > 0
    ).length

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newClients = clients.filter(
      (c) => new Date(c.createdAt) >= thirtyDaysAgo
    ).length

    return { totalClients, newClients, withReservations }
  }, [clients])

  const statCards = [
    {
      label: 'Wszyscy klienci',
      value: stats.totalClients,
      icon: Users,
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      valueColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Nowi (30 dni)',
      value: stats.newClients,
      icon: UserPlus,
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      valueColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Z rezerwacjami',
      value: stats.withReservations,
      icon: Calendar,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      valueColor: 'text-blue-600 dark:text-blue-400',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-neutral-800/80 p-6 shadow-md border border-neutral-200/80 dark:border-neutral-700/50 animate-pulse"
          >
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-4" />
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group rounded-2xl bg-white dark:bg-neutral-800/80 p-6 shadow-md border border-neutral-200/80 dark:border-neutral-700/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            {/* Icon */}
            <div className={cn('inline-flex p-3 rounded-xl mb-4', stat.iconBg)}>
              <Icon className={cn('w-6 h-6', stat.iconColor)} />
            </div>

            {/* Label */}
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              {stat.label}
            </p>

            {/* Value */}
            <p className={cn('text-3xl font-bold', stat.valueColor)}>
              {stat.value.toLocaleString('pl-PL')}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}

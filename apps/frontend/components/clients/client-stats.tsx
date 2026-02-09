'use client'

import { Client } from '@/types'
import { Users, UserPlus, Calendar, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

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

    // Clients with at least one reservation
    const withReservations = clients.filter(
      (c) => c._count && c._count.reservations > 0
    ).length

    // New clients (created within last 30 days)
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
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Nowi (30 dni)',
      value: stats.newClients,
      icon: UserPlus,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Z rezerwacjami',
      value: stats.withReservations,
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700 animate-pulse"
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
            className="group relative rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-soft border border-neutral-200 dark:border-neutral-700 hover:shadow-medium transition-all duration-300 overflow-hidden"
          >
            {/* Background Gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />

            {/* Icon */}
            <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} mb-4`}>
              <Icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>

            {/* Label */}
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {stat.label}
            </p>

            {/* Value */}
            <p className={`text-3xl font-bold ${stat.textColor}`}>
              {stat.value.toLocaleString('pl-PL')}
            </p>

            {/* Decorative Element */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10">
              <Icon className="w-full h-full" />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

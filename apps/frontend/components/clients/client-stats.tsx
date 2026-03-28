'use client'

import { Client } from '@/types'
import { Users, UserPlus, Calendar } from 'lucide-react'
import { useMemo } from 'react'
import { StatCard } from '@/components/shared/StatCard'

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
      iconGradient: 'from-violet-500 to-purple-500',
    },
    {
      label: 'Nowi (30 dni)',
      value: stats.newClients,
      icon: UserPlus,
      iconGradient: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Z rezerwacjami',
      value: stats.withReservations,
      icon: Calendar,
      iconGradient: 'from-blue-500 to-cyan-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value.toLocaleString('pl-PL')}
          icon={stat.icon}
          iconGradient={stat.iconGradient}
          delay={index * 0.1}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}

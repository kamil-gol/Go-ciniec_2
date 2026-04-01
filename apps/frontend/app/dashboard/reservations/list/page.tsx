'use client'

import { useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Calendar, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReservationsList } from '@/components/reservations/reservations-list'
import { useReservations } from '@/lib/api/reservations'
import { PageLayout, PageHero, StatCard, FilterTabs } from '@/components/shared'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import type { Reservation } from '@/types'

export default function ReservationsListPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const accent = moduleAccents.reservations

  const defaultHallId = searchParams.get('hallId') || undefined

  // Redirect ?create=true to the dedicated new-reservation page
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      const url = defaultHallId
        ? `/dashboard/reservations/new?hallId=${defaultHallId}`
        : '/dashboard/reservations/new'
      router.replace(url)
    }
  }, [searchParams, defaultHallId, router])

  // Single data source for stats — same filters as the list component
  // (non-archived, excluding RESERVED status which is filtered client-side)
  const { data: statsResponse } = useReservations({ page: 1, pageSize: 200, archived: false })

  const stats = useMemo(() => {
    const all = (statsResponse?.data ?? []).filter((r: Reservation) => r.status !== 'RESERVED')
    const now = new Date()
    return {
      total: all.length,
      confirmed: all.filter((r: Reservation) => r.status === 'CONFIRMED').length,
      pending: all.filter((r: Reservation) => r.status === 'PENDING').length,
      thisMonth: all.filter((r: Reservation) => {
        const date = r.startDateTime ? new Date(r.startDateTime) : r.date ? new Date(r.date) : null
        if (!date) return false
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }).length,
    }
  }, [statsResponse])

  return (
    <PageLayout>
      <Breadcrumb />
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Rezerwacje"
        subtitle="Zarządzaj rezerwacjami sal weselnych"
        icon={Calendar}
        action={
          <Button
            size="lg"
            onClick={() => {
              const url = defaultHallId
                ? `/dashboard/reservations/new?hallId=${defaultHallId}`
                : '/dashboard/reservations/new'
              router.push(url)
            }}
            className="bg-white text-blue-600 hover:bg-white/90 shadow-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowa Rezerwacja
          </Button>
        }
      />

      {/* Stats */}
      <div className={layout.statGrid}>
        <StatCard label="Wszystkie" value={stats.total} subtitle="Łącznie rezerwacji" icon={Calendar} iconGradient={statGradients.count} delay={0.1} />
        <StatCard label="Potwierdzone" value={stats.confirmed} subtitle="Aktywne rezerwacje" icon={CheckCircle2} iconGradient={statGradients.success} delay={0.2} />
        <StatCard label="Oczekujące" value={stats.pending} subtitle="Do potwierdzenia" icon={Clock} iconGradient={statGradients.alert} delay={0.3} />
        <StatCard label="Ten miesiąc" value={stats.thisMonth} subtitle="Wydarzeń w tym miesiącu" icon={TrendingUp} iconGradient={statGradients.info} delay={0.4} />
      </div>

      {/* View toggle */}
      <FilterTabs
        tabs={[
          { key: 'list', label: 'Lista' },
          { key: 'calendar', label: 'Kalendarz' },
        ]}
        activeKey="list"
        onChange={(key) => {
          if (key === 'calendar') router.push('/dashboard/reservations/calendar')
        }}
      />

      {/* Reservations List */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <ReservationsList />
        </CardContent>
      </Card>
    </PageLayout>
  )
}

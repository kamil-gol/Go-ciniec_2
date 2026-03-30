'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Calendar, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReservationsList } from '@/components/reservations/reservations-list'
import { getReservations } from '@/lib/api/reservations'
import { PageLayout, PageHero, StatCard, FilterTabs } from '@/components/shared'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function ReservationsListPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [reservations, setReservations] = useState<any[]>([])
  const [, setLoading] = useState(true)
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

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getReservations()
      setReservations(data)
    } catch (error: unknown) {
      console.error('Error loading reservations:', error)
      toast.error('Nie udało się załadować rezerwacji')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    pending: reservations.filter(r => r.status === 'PENDING').length,
    thisMonth: reservations.filter(r => {
      const date = r.startDateTime ? new Date(r.startDateTime) : r.date ? new Date(r.date) : null
      if (!date) return false
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length,
  }

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

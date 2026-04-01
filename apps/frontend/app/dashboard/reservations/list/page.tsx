'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle2, Clock, TrendingUp, CalendarDays, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReservationsList } from '@/components/reservations/reservations-list'
import { getReservations } from '@/lib/api/reservations'
import { PageLayout, StatCard  } from '@/components/shared'
import { PageHeader } from '@/components/shared/PageHeader'
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
      <PageHeader
        title="Rezerwacje"
        subtitle="Zarządzaj rezerwacjami sal weselnych"
        icon={Calendar}
        actions={
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

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 mr-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-neutral-700 text-sm font-medium text-neutral-900 dark:text-neutral-100 shadow-sm">
              <List className="h-3.5 w-3.5" />
              Lista
            </span>
            <Link
              href="/dashboard/reservations/calendar"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-neutral-500 dark:text-neutral-300 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Kalendarz
            </Link>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <ReservationsList />
        </CardContent>
      </Card>
    </PageLayout>
  )
}

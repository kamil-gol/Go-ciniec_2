'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle2, Clock, TrendingUp, Search, CalendarDays, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ReservationsList } from '@/components/reservations/reservations-list'
import { CreateReservationForm } from '@/components/reservations/create-reservation-form'
import { getReservations } from '@/lib/api/reservations'
import { useToast } from '@/hooks/use-toast'
import { PageLayout, PageHero, StatCard, LoadingState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

export default function ReservationsListPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const accent = moduleAccents.reservations

  const defaultHallId = searchParams.get('hallId') || undefined

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateForm(true)
    }
  }, [searchParams])

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const data = await getReservations()
      setReservations(data)
    } catch (error: any) {
      console.error('Error loading reservations:', error)
      toast({
        title: 'B\u0142\u0105d',
        description: 'Nie uda\u0142o si\u0119 za\u0142adowa\u0107 rezerwacji',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

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
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Rezerwacje"
        subtitle="Zarz\u0105dzaj rezerwacjami sal weselnych"
        icon={Calendar}
        action={
          <Button
            size="lg"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-white text-blue-600 hover:bg-white/90 shadow-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowa Rezerwacja
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Wszystkie" value={stats.total} subtitle="\u0141\u0105cznie rezerwacji" icon={Calendar} iconGradient="from-blue-500 to-cyan-500" delay={0.1} />
        <StatCard label="Potwierdzone" value={stats.confirmed} subtitle="Aktywne rezerwacje" icon={CheckCircle2} iconGradient="from-emerald-500 to-teal-500" delay={0.2} />
        <StatCard label="Oczekuj\u0105ce" value={stats.pending} subtitle="Do potwierdzenia" icon={Clock} iconGradient="from-amber-500 to-orange-500" delay={0.3} />
        <StatCard label="Ten miesi\u0105c" value={stats.thisMonth} subtitle="Wydarze\u0144 w tym miesi\u0105cu" icon={TrendingUp} iconGradient="from-violet-500 to-purple-500" delay={0.4} />
      </div>

      {/* Controls bar - same as calendar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View Toggle - Kalendarz left, Lista right */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 mr-3">
            <Link
              href="/dashboard/reservations/calendar"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Kalendarz
            </Link>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-neutral-700 text-sm font-medium text-neutral-900 dark:text-neutral-100 shadow-sm">
              <List className="h-3.5 w-3.5" />
              Lista
            </span>
          </div>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <Input
            placeholder="Szukaj rezerwacji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-12 text-base"
          />
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className={`bg-gradient-to-br ${accent.gradientSubtle} p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg shadow-lg`}>
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Nowa Rezerwacja</h2>
            </div>
            <CreateReservationForm
              onSuccess={() => {
                setShowCreateForm(false)
                loadReservations()
              }}
              onCancel={() => setShowCreateForm(false)}
              defaultHallId={defaultHallId}
            />
          </div>
        </Card>
      )}

      {/* Reservations List */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <LoadingState variant="skeleton" rows={4} message="\u0141adowanie rezerwacji..." />
          ) : (
            <ReservationsList
              reservations={reservations}
              searchQuery={searchQuery}
              onUpdate={loadReservations}
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}

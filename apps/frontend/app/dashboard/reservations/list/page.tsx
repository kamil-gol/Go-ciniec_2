'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle2, Clock, TrendingUp, CalendarDays, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReservationsList } from '@/components/reservations/reservations-list'
import { CreateReservationForm } from '@/components/reservations/create-reservation-form'
import { getReservations } from '@/lib/api/reservations'
import { PageLayout, PageHero, StatCard } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'
import { toast } from 'sonner'

export default function ReservationsListPage() {
  const searchParams = useSearchParams()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [reservations, setReservations] = useState<any[]>([])
  const [, setLoading] = useState(true)
  const accent = moduleAccents.reservations
  const formRef = useRef<HTMLDivElement>(null)

  const defaultHallId = searchParams.get('hallId') || undefined

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateForm(true)
    }
  }, [searchParams])

  // Auto-scroll to form when opened
  useEffect(() => {
    if (showCreateForm && formRef.current) {
      // Small delay to let the animation start, then scroll
      const timer = setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showCreateForm])

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getReservations()
      setReservations(data)
    } catch (error: any) {
      console.error('Error loading reservations:', error)
      toast.error('Nie udało się załadować rezerwacji')
    } finally {
      setLoading(false)
    }
  }, [toast])

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
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Rezerwacje"
        subtitle="Zarządzaj rezerwacjami sal weselnych"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Wszystkie" value={stats.total} subtitle="Łącznie rezerwacji" icon={Calendar} iconGradient="from-blue-500 to-cyan-500" delay={0.1} />
        <StatCard label="Potwierdzone" value={stats.confirmed} subtitle="Aktywne rezerwacje" icon={CheckCircle2} iconGradient="from-emerald-500 to-teal-500" delay={0.2} />
        <StatCard label="Oczekujące" value={stats.pending} subtitle="Do potwierdzenia" icon={Clock} iconGradient="from-amber-500 to-orange-500" delay={0.3} />
        <StatCard label="Ten miesiąc" value={stats.thisMonth} subtitle="Wydarzeń w tym miesiącu" icon={TrendingUp} iconGradient="from-violet-500 to-purple-500" delay={0.4} />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Kalendarz
            </Link>
          </div>
        </div>
      </div>

      {/* Create Form — with ref for auto-scroll */}
      {showCreateForm && (
        <div ref={formRef} className="scroll-mt-4">
          <Card className="overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className={`bg-gradient-to-br ${accent.gradientSubtle} p-4 sm:p-8`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg shadow-lg`}>
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Nowa Rezerwacja</h2>
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
        </div>
      )}

      {/* Reservations List */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <ReservationsList />
        </CardContent>
      </Card>
    </PageLayout>
  )
}

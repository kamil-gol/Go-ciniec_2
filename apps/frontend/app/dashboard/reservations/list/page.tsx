'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle2, Clock, TrendingUp, Search, CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const DAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
  const MONTHS_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6
    const lastDay = new Date(year, month + 1, 0).getDate()
    const days: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = []
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d, day: d.getDate(), isCurrentMonth: false })
    }
    for (let d = 1; d <= lastDay; d++) {
      days.push({ date: new Date(year, month, d), day: d, isCurrentMonth: true })
    }
    while (days.length < 42) {
      const d = days.length - startDow - lastDay + 1
      const date = new Date(year, month + 1, d)
      days.push({ date, day: date.getDate(), isCurrentMonth: false })
    }
    return days
  }

  const isToday = (date: Date) => {
    const now = new Date()
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }

  const isSameDay = (a: Date, b: Date | null) => {
    if (!b) return false
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  }

  const getReservationsForDate = (date: Date) => {
    return reservations.filter(r => {
      const rDate = r.startDateTime ? new Date(r.startDateTime) : r.date ? new Date(r.date) : null
      if (!rDate) return false
      return rDate.getDate() === date.getDate() && rDate.getMonth() === date.getMonth() && rDate.getFullYear() === date.getFullYear()
    })
  }

  const filteredByDate = selectedDate
    ? reservations.filter(r => {
        const rDate = r.startDateTime ? new Date(r.startDateTime) : r.date ? new Date(r.date) : null
        if (!rDate) return false
        return rDate.getDate() === selectedDate.getDate() && rDate.getMonth() === selectedDate.getMonth() && rDate.getFullYear() === selectedDate.getFullYear()
      })
    : reservations

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

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
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

      {/* Layout: Calendar sidebar + Reservations List */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mini Calendar - left sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <Card className="sticky top-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {MONTHS_PL[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </span>
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAYS_PL.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {getCalendarDays().map((dayInfo, idx) => {
                  const hasReservations = getReservationsForDate(dayInfo.date).length > 0
                  const isSelected = isSameDay(dayInfo.date, selectedDate)
                  const isTodayCell = isToday(dayInfo.date)
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(isSelected ? null : dayInfo.date)}
                      className={`relative text-xs p-1.5 rounded-lg transition-all text-center ${
                        !dayInfo.isCurrentMonth ? 'text-neutral-300 dark:text-neutral-600' : ''
                      } ${isSelected ? 'bg-blue-600 text-white font-bold' : ''} ${
                        isTodayCell && !isSelected ? 'bg-indigo-100 dark:bg-indigo-900/30 font-bold text-indigo-600 dark:text-indigo-400' : ''
                      } ${!isSelected && dayInfo.isCurrentMonth ? 'hover:bg-neutral-100 dark:hover:bg-neutral-700' : ''}`}
                    >
                      {dayInfo.day}
                      {hasReservations && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                      )}
                    </button>
                  )
                })}
              </div>
              {selectedDate && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Filtr: <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                        {selectedDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </p>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Wyczyść
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {filteredByDate.length} rezerwacji
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reservations List - main area */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-6">
              <ReservationsList />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}

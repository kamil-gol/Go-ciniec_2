'use client'

import { useState, useMemo, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarDays,
  Users,
  Clock,
  MapPin,
  Filter,
  AlertCircle,
  List,
  Plus,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageLayout, PageHero, StatCard, ErrorState } from '@/components/shared'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'
import { getReservations } from '@/lib/api/reservations'
import {
  useCalendarReservations,
  useCalendarHalls,
  CalendarReservation,
} from '@/lib/api/calendar-api'
import { DAYS_PL, MONTHS_PL } from './calendar.constants'
import { reservationStatusColors } from '@/lib/status-colors'
import { getMonthGrid, dateKey, isToday, buildPillTooltip } from './calendar.helpers'
import DayDetailPanel from './DayDetailPanel'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

function ReservationPill({
  reservation,
  allDayReservations,
  onClick,
}: {
  reservation: CalendarReservation
  allDayReservations: CalendarReservation[]
  onClick: () => void
}) {
  const color = reservation.eventType?.color || '#6366f1'
  const status = reservationStatusColors[reservation.status]
  const name = reservation.client
    ? `${reservation.client.firstName} ${reservation.client.lastName.charAt(0)}.`
    : 'Klient'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="group w-full text-left rounded px-1.5 py-[3px] text-[11px] leading-tight font-medium truncate transition-all hover:shadow-sm cursor-pointer"
      style={{ backgroundColor: `${color}18`, color, borderLeft: `3px solid ${color}` }}
      title={buildPillTooltip(reservation, allDayReservations)}
    >
      <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1 flex-shrink-0', status?.dot || 'bg-neutral-400')} />
      {reservation.startTime && <span className="opacity-70">{reservation.startTime} </span>}
      {name}
    </button>
  )
}

function MobileDots({ reservations }: { reservations: CalendarReservation[] }) {
  if (reservations.length === 0) return null
  const maxDots = 4
  const shown = reservations.slice(0, maxDots)
  const extra = reservations.length - maxDots
  return (
    <div className="flex flex-wrap items-center justify-center gap-[3px] mt-0.5">
      {shown.map((r) => (
        <span
          key={r.id}
          className="w-[6px] h-[6px] rounded-full flex-shrink-0"
          style={{ backgroundColor: r.eventType?.color || '#6366f1' }}
        />
      ))}
      {extra > 0 && (
        <span className="text-[8px] text-neutral-400 font-medium leading-none">+{extra}</span>
      )}
    </div>
  )
}

/** #165: Mini capacity bars for multi-booking halls in calendar grid cells */
function CellCapacityBars({ reservations }: { reservations: CalendarReservation[] }) {
  const hallBars = useMemo(() => {
    const halls = new Map<string, { name: string; capacity: number; totalGuests: number }>()
    for (const r of reservations) {
      const h = r.hall
      if (!h?.allowMultipleBookings || !h?.capacity || h.capacity <= 0) continue
      if (r.status === 'CANCELLED') continue
      if (!halls.has(h.id)) halls.set(h.id, { name: h.name, capacity: h.capacity, totalGuests: 0 })
      halls.get(h.id)!.totalGuests += r.guests || 0
    }
    return Array.from(halls.values())
  }, [reservations])

  if (hallBars.length === 0) return null

  return (
    <div className="hidden md:flex flex-col gap-[2px] mt-1">
      {hallBars.map((bar) => {
        const pct = Math.min(100, Math.round((bar.totalGuests / bar.capacity) * 100))
        return (
          <div
            key={bar.name}
            className="w-full h-[3px] bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden"
            title={`${bar.name}: ${bar.totalGuests}/${bar.capacity} osób (${pct}%)`}
          >
            <div
              className={cn(
                'h-full rounded-full',
                pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-violet-500'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-700 rounded-xl overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={`h-${i}`} className="bg-neutral-100 dark:bg-neutral-800 p-2 text-center text-xs font-semibold text-neutral-500">{DAYS_PL[i]}</div>
      ))}
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={`s-${i}`} className="bg-white dark:bg-neutral-800/80 p-2 h-16 sm:h-24 animate-pulse">
          <div className="h-4 w-6 rounded bg-neutral-200 dark:bg-neutral-700 mb-2" />
          {i % 3 === 0 && <div className="h-4 w-full rounded bg-neutral-100 dark:bg-neutral-700/50" />}
        </div>
      ))}
    </div>
  )
}

export default function CalendarPage() {
  const router = useRouter()
  const accent = moduleAccents.reservations || moduleAccents.dashboard
  const today = new Date()

  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [hallFilter, setHallFilter] = useState<string>('all')
  const [allReservations, setAllReservations] = useState<any[]>([])

  const { data: reservations, isLoading, error } = useCalendarReservations(currentYear, currentMonth)
  const { data: halls } = useCalendarHalls()

  useEffect(() => {
    getReservations().then(setAllReservations).catch(() => {})
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    return {
      total: allReservations.length,
      confirmed: allReservations.filter(r => r.status === 'CONFIRMED').length,
      pending: allReservations.filter(r => r.status === 'PENDING').length,
      thisMonth: allReservations.filter(r => {
        const date = r.startDateTime ? new Date(r.startDateTime) : r.date ? new Date(r.date) : null
        if (!date) return false
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }).length,
    }
  }, [allReservations])

  const goToPrevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear((y) => y - 1) }
    else { setCurrentMonth((m) => m - 1) }
    setSelectedDate(null)
  }
  const goToNextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear((y) => y + 1) }
    else { setCurrentMonth((m) => m + 1) }
    setSelectedDate(null)
  }
  const goToToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth() + 1)
    setSelectedDate(null)
  }

  const filteredReservations = useMemo(() => {
    if (!reservations) return []
    let filtered = reservations.filter((r) => r.status !== 'CANCELLED')
    if (hallFilter !== 'all') filtered = filtered.filter((r) => r.hall?.id === hallFilter)
    return filtered
  }, [reservations, hallFilter])

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, CalendarReservation[]>()
    for (const r of filteredReservations) {
      if (!r.date) continue
      const existing = map.get(r.date) || []
      existing.push(r)
      map.set(r.date, existing)
    }
    for (const [, list] of map) list.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    return map
  }, [filteredReservations])

  const days = useMemo(() => getMonthGrid(currentYear, currentMonth), [currentYear, currentMonth])
  const selectedDayReservations = useMemo(() => {
    if (!selectedDate) return []
    return reservationsByDate.get(dateKey(selectedDate)) || []
  }, [selectedDate, reservationsByDate])

  const eventTypes = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>()
    for (const r of filteredReservations) {
      if (r.eventType && !map.has(r.eventType.id)) map.set(r.eventType.id, { name: r.eventType.name, color: r.eventType.color })
    }
    return Array.from(map.values())
  }, [filteredReservations])

  const MAX_PILLS = 3

  const DAYS_FULL_PL = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
  const MONTHS_GENITIVE_PL = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
  ]

  /** Sorted date keys for the mobile agenda view */
  const sortedAgendaDates = useMemo(() => {
    return Array.from(reservationsByDate.keys()).sort()
  }, [reservationsByDate])

  const formatAgendaDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const dayName = DAYS_FULL_PL[d.getDay()]
    const dayNum = d.getDate()
    const monthName = MONTHS_GENITIVE_PL[d.getMonth()]
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNum} ${monthName}`
  }

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Rezerwacje"
        subtitle="Zarządzaj rezerwacjami sal weselnych"
        icon={CalendarIcon}
        action={
          <Button
            size="lg"
            onClick={() => router.push('/dashboard/reservations/new')}
            className="bg-white text-blue-600 hover:bg-white/90 shadow-xl"
          >
            <Plus className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Nowa Rezerwacja</span>
          </Button>
        }
      />

      {/* Stats */}
      <div className={layout.statGrid}>
        <StatCard label="Wszystkie" value={stats.total} subtitle="Łącznie rezerwacji" icon={CalendarIcon} iconGradient={statGradients.count} delay={0.1} />
        <StatCard label="Potwierdzone" value={stats.confirmed} subtitle="Aktywne rezerwacje" icon={CheckCircle2} iconGradient={statGradients.success} delay={0.2} />
        <StatCard label="Oczekujące" value={stats.pending} subtitle="Do potwierdzenia" icon={Clock} iconGradient={statGradients.alert} delay={0.3} />
        <StatCard label="Ten miesiąc" value={stats.thisMonth} subtitle="Wydarzeń w tym miesiącu" icon={TrendingUp} iconGradient={statGradients.info} delay={0.4} />
      </div>

      {/* Controls bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <Link
              href="/dashboard/reservations/list"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium text-neutral-500 dark:text-neutral-300 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </Link>
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-white dark:bg-neutral-700 text-sm font-medium text-neutral-900 dark:text-neutral-100 shadow-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kalendarz</span>
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto sm:ml-0">
            <button onClick={goToPrevMonth} className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 min-w-[120px] sm:min-w-[200px] text-center">
              {MONTHS_PL[currentMonth - 1]} {currentYear}
            </h2>
            <button onClick={goToNextMonth} className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={goToToday} className="px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              Dziś
            </button>
          </div>
        </div>

        {halls && halls.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400 flex-shrink-0" />
            <Select value={hallFilter} onValueChange={setHallFilter}>
              <SelectTrigger className="w-auto min-w-[160px] h-9">
                <SelectValue placeholder="Wszystkie sale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie sale</SelectItem>
                {halls.filter((h) => h.isActive).map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {error && (
        <ErrorState message="Nie udało się załadować rezerwacji" variant="banner" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn('lg:col-span-2', selectedDate ? '' : 'lg:col-span-3')}>
          {isLoading ? <SkeletonGrid /> : (
            <>
              {/* Desktop/Tablet Calendar Grid */}
              <div className="hidden md:block rounded-2xl bg-white dark:bg-neutral-800/80 shadow-soft border border-neutral-100 dark:border-neutral-700/50 overflow-hidden">
                <div className="grid grid-cols-7 bg-neutral-50 dark:bg-neutral-800">
                  {DAYS_PL.map((day, i) => (
                    <div key={day} className={cn('py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider',
                      i >= 5 ? 'text-rose-400 dark:text-rose-500' : 'text-neutral-500 dark:text-neutral-300'
                    )}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-700">
                  {days.map((dayInfo, idx) => {
                    const key = dateKey(dayInfo.date)
                    const dayReservations = reservationsByDate.get(key) || []
                    const isTodayCell = isToday(dayInfo.date)
                    const isSelected = selectedDate && dateKey(selectedDate) === key
                    const isWeekend = idx % 7 >= 5
                    return (
                      <div key={idx} onClick={() => setSelectedDate(dayInfo.date)}
                        className={cn(
                          'min-h-[68px] sm:min-h-[90px] md:min-h-[110px] p-1 sm:p-1.5 cursor-pointer transition-colors',
                          dayInfo.isCurrentMonth ? 'bg-white dark:bg-neutral-800/80' : 'bg-neutral-50/70 dark:bg-neutral-900/40',
                          isSelected && 'ring-2 ring-indigo-500 ring-inset',
                          !isSelected && 'hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
                        )}
                      >
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <span className={cn(
                            'text-[10px] sm:text-xs font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full',
                            !dayInfo.isCurrentMonth && 'text-neutral-300 dark:text-neutral-400',
                            dayInfo.isCurrentMonth && !isTodayCell && (isWeekend ? 'text-rose-400 dark:text-rose-500' : 'text-neutral-700 dark:text-neutral-300'),
                            isTodayCell && 'bg-indigo-600 text-white font-bold'
                          )}>{dayInfo.day}</span>
                          {dayReservations.length > 0 && (
                            <span className="text-[9px] sm:text-[10px] font-medium text-neutral-400 dark:text-neutral-500">{dayReservations.length}</span>
                          )}
                        </div>

                        <div className="sm:hidden">
                          <MobileDots reservations={dayReservations} />
                        </div>

                        <div className="hidden sm:block space-y-0.5">
                          {dayReservations.slice(0, MAX_PILLS).map((r) => (
                            <ReservationPill
                              key={r.id}
                              reservation={r}
                              allDayReservations={dayReservations}
                              onClick={() => router.push(`/dashboard/reservations/${r.id}`)}
                            />
                          ))}
                          {dayReservations.length > MAX_PILLS && (
                            <div className="text-[10px] text-center text-neutral-400 dark:text-neutral-500 font-medium pt-0.5">
                              +{dayReservations.length - MAX_PILLS} więcej
                            </div>
                          )}
                          {/* #165: Mini capacity bars for multi-booking halls */}
                          <CellCapacityBars reservations={dayReservations} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mobile Agenda View */}
              <div className="md:hidden space-y-4">
                {sortedAgendaDates.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 dark:text-neutral-400 text-sm">
                    Brak rezerwacji w tym miesiącu
                  </div>
                ) : (
                  sortedAgendaDates.map((date) => {
                    const dayReservations = reservationsByDate.get(date) || []
                    return (
                      <div key={date}>
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 px-1 border-b border-neutral-200 dark:border-neutral-700">
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {formatAgendaDate(date)}
                          </h3>
                        </div>
                        <div className="space-y-2 mt-2">
                          {dayReservations.map((r) => {
                            const status = reservationStatusColors[r.status]
                            const clientName = r.client
                              ? `${r.client.firstName} ${r.client.lastName}`
                              : 'Klient'
                            const eventName = r.eventType?.name || r.customEventType || 'Wydarzenie'
                            return (
                              <Link
                                href={`/dashboard/reservations/${r.id}`}
                                key={r.id}
                                className="block p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/80 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between">
                                  <Breadcrumb />
                                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    <Clock className="inline h-3.5 w-3.5 mr-1 text-neutral-400" />
                                    {r.startTime} - {r.endTime}
                                  </span>
                                  {status && (
                                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', status.bg, status.text)}>
                                      {status.label}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                  {eventName}
                                </div>
                                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 flex-wrap">
                                  {r.hall && (
                                    <>
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span>{r.hall.name}</span>
                                      <span className="text-neutral-300 dark:text-neutral-400">&#183;</span>
                                    </>
                                  )}
                                  <Users className="h-3 w-3 flex-shrink-0" />
                                  <span>{clientName}</span>
                                  <span className="text-neutral-300 dark:text-neutral-400">&#183;</span>
                                  <span>{r.guests} os.</span>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
        <AnimatePresence>
          {selectedDate && (
            <div className="lg:col-span-1">
              <DayDetailPanel
                date={selectedDate}
                reservations={selectedDayReservations}
                onClose={() => setSelectedDate(null)}
                onReservationClick={(id) => router.push(`/dashboard/reservations/${id}`)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {eventTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-neutral-500 dark:text-neutral-300">
          <span className="font-semibold">Typy wydarzeń:</span>
          {eventTypes.map((et) => (
            <span key={et.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: et.color }} />
              {et.name}
            </span>
          ))}
          <span className="ml-2 sm:ml-4 font-semibold">Statusy:</span>
          {Object.values(reservationStatusColors).filter((s) => s.label !== 'Anulowana').map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', s.dot)} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </PageLayout>
  )
}

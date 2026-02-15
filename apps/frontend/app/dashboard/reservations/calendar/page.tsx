'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarDays,
  X,
  Users,
  Clock,
  MapPin,
  ArrowRight,
  Filter,
  AlertCircle,
  List,
  Plus,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PageLayout, PageHero, StatCard } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'
import { getReservations } from '@/lib/api/reservations'
import {
  useCalendarReservations,
  useCalendarHalls,
  CalendarReservation,
} from '@/lib/api/calendar-api'

const DAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

const STATUS_CONFIG: Record<string, { label: string; dotClass: string; bgClass: string }> = {
  CONFIRMED: {
    label: 'Potwierdzone',
    dotClass: 'bg-emerald-500',
    bgClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  PENDING: {
    label: 'Oczekujące',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  RESERVED: {
    label: 'W kolejce',
    dotClass: 'bg-blue-500',
    bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  COMPLETED: {
    label: 'Zakończone',
    dotClass: 'bg-slate-400',
    bgClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
  },
  CANCELLED: {
    label: 'Anulowane',
    dotClass: 'bg-red-500',
    bgClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6
  const lastDay = new Date(year, month, 0).getDate()
  const days: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i)
    days.push({ date: d, day: d.getDate(), isCurrentMonth: false })
  }
  for (let d = 1; d <= lastDay; d++) {
    days.push({ date: new Date(year, month - 1, d), day: d, isCurrentMonth: true })
  }
  while (days.length < 42) {
    const d = days.length - startDow - lastDay + 1
    const date = new Date(year, month, d)
    days.push({ date, day: date.getDate(), isCurrentMonth: false })
  }
  return days
}

function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatCurrency(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function isToday(date: Date): boolean {
  const now = new Date()
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function ReservationPill({ reservation, onClick }: { reservation: CalendarReservation; onClick: () => void }) {
  const color = reservation.eventType?.color || '#6366f1'
  const status = STATUS_CONFIG[reservation.status]
  const name = reservation.client
    ? `${reservation.client.firstName} ${reservation.client.lastName.charAt(0)}.`
    : 'Klient'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="group w-full text-left rounded px-1.5 py-[3px] text-[11px] leading-tight font-medium truncate transition-all hover:shadow-sm cursor-pointer"
      style={{ backgroundColor: `${color}18`, color, borderLeft: `3px solid ${color}` }}
      title={`${reservation.eventType?.name || 'Wydarzenie'} — ${reservation.client?.firstName} ${reservation.client?.lastName} (${reservation.startTime || ''})`}
    >
      <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1 flex-shrink-0', status?.dotClass || 'bg-gray-400')} />
      {reservation.startTime && <span className="opacity-70">{reservation.startTime} </span>}
      {name}
    </button>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-700 rounded-xl overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={`h-${i}`} className="bg-neutral-100 dark:bg-neutral-800 p-2 text-center text-xs font-semibold text-neutral-500">{DAYS_PL[i]}</div>
      ))}
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={`s-${i}`} className="bg-white dark:bg-neutral-800/80 p-2 h-24 animate-pulse">
          <div className="h-4 w-6 rounded bg-neutral-200 dark:bg-neutral-700 mb-2" />
          {i % 3 === 0 && <div className="h-4 w-full rounded bg-neutral-100 dark:bg-neutral-700/50" />}
        </div>
      ))}
    </div>
  )
}

function DayDetailPanel({ date, reservations, onClose, onReservationClick }: {
  date: Date; reservations: CalendarReservation[]; onClose: () => void; onReservationClick: (id: string) => void
}) {
  const dayName = date.toLocaleDateString('pl-PL', { weekday: 'long' })
  const fullDate = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="rounded-2xl bg-white dark:bg-neutral-800/80 p-5 shadow-soft border border-neutral-100 dark:border-neutral-700/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 capitalize">{dayName}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{fullDate}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          <X className="h-4 w-4 text-neutral-500" />
        </button>
      </div>
      {reservations.length === 0 ? (
        <div className="text-center py-6 text-neutral-400 dark:text-neutral-500">
          <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Brak rezerwacji</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const color = r.eventType?.color || '#6366f1'
            const status = STATUS_CONFIG[r.status]
            return (
              <button key={r.id} onClick={() => onReservationClick(r.id)}
                className="group w-full text-left rounded-xl p-3 border border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        {r.eventType?.name || r.customEventType || 'Wydarzenie'}
                      </span>
                      {status && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', status.bgClass)}>{status.label}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.client?.firstName} {r.client?.lastName}</span>
                      {r.startTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.startTime}{r.endTime ? ` - ${r.endTime}` : ''}</span>}
                      {r.hall && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.hall.name}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">{r.guests} os. • {formatCurrency(r.totalPrice)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </motion.div>
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

  // Fetch all reservations for stats
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

  return (
    <PageLayout>
      {/* Hero - same as list view */}
      <PageHero
        accent={accent}
        title="Rezerwacje"
        subtitle="Zarządzaj rezerwacjami sal weselnych"
        icon={CalendarIcon}
        action={
          <Button
            size="lg"
            onClick={() => router.push('/dashboard/reservations/list?create=true')}
            className="bg-white text-blue-600 hover:bg-white/90 shadow-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowa Rezerwacja
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Wszystkie" value={stats.total} subtitle="Łącznie rezerwacji" icon={CalendarIcon} iconGradient="from-blue-500 to-cyan-500" delay={0.1} />
        <StatCard label="Potwierdzone" value={stats.confirmed} subtitle="Aktywne rezerwacje" icon={CheckCircle2} iconGradient="from-emerald-500 to-teal-500" delay={0.2} />
        <StatCard label="Oczekujące" value={stats.pending} subtitle="Do potwierdzenia" icon={Clock} iconGradient="from-amber-500 to-orange-500" delay={0.3} />
        <StatCard label="Ten miesiąc" value={stats.thisMonth} subtitle="Wydarzeń w tym miesiącu" icon={TrendingUp} iconGradient="from-violet-500 to-purple-500" delay={0.4} />
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View Toggle - Kalendarz left, Lista right */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 mr-3">
            <Link
              href="/dashboard/reservations/list"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </Link>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-neutral-700 text-sm font-medium text-neutral-900 dark:text-neutral-100 shadow-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              Kalendarz
            </span>
          </div>

          <button onClick={goToPrevMonth} className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 min-w-[200px] text-center">
            {MONTHS_PL[currentMonth - 1]} {currentYear}
          </h2>
          <button onClick={goToNextMonth} className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={goToToday} className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            Dziś
          </button>
        </div>

        {halls && halls.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select value={hallFilter} onChange={(e) => setHallFilter(e.target.value)}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Wszystkie sale</option>
              {halls.filter((h) => h.isActive).map((h) => (<option key={h.id} value={h.id}>{h.name}</option>))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">Nie udało się załadować rezerwacji</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn('lg:col-span-2', selectedDate ? '' : 'lg:col-span-3')}>
          {isLoading ? <SkeletonGrid /> : (
            <div className="rounded-2xl bg-white dark:bg-neutral-800/80 shadow-soft border border-neutral-100 dark:border-neutral-700/50 overflow-hidden">
              <div className="grid grid-cols-7 bg-neutral-50 dark:bg-neutral-800">
                {DAYS_PL.map((day, i) => (
                  <div key={day} className={cn('py-2.5 text-center text-xs font-semibold uppercase tracking-wider',
                    i >= 5 ? 'text-rose-400 dark:text-rose-500' : 'text-neutral-500 dark:text-neutral-400'
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
                        'min-h-[90px] md:min-h-[110px] p-1.5 cursor-pointer transition-colors',
                        dayInfo.isCurrentMonth ? 'bg-white dark:bg-neutral-800/80' : 'bg-neutral-50/70 dark:bg-neutral-900/40',
                        isSelected && 'ring-2 ring-indigo-500 ring-inset',
                        !isSelected && 'hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                          !dayInfo.isCurrentMonth && 'text-neutral-300 dark:text-neutral-600',
                          dayInfo.isCurrentMonth && !isTodayCell && (isWeekend ? 'text-rose-400 dark:text-rose-500' : 'text-neutral-700 dark:text-neutral-300'),
                          isTodayCell && 'bg-indigo-600 text-white font-bold'
                        )}>{dayInfo.day}</span>
                        {dayReservations.length > 0 && (
                          <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">{dayReservations.length}</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayReservations.slice(0, MAX_PILLS).map((r) => (
                          <ReservationPill key={r.id} reservation={r} onClick={() => router.push(`/dashboard/reservations/${r.id}`)} />
                        ))}
                        {dayReservations.length > MAX_PILLS && (
                          <div className="text-[10px] text-center text-neutral-400 dark:text-neutral-500 font-medium pt-0.5">
                            +{dayReservations.length - MAX_PILLS} więcej
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
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
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold">Typy wydarzeń:</span>
          {eventTypes.map((et) => (
            <span key={et.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: et.color }} />
              {et.name}
            </span>
          ))}
          <span className="ml-4 font-semibold">Statusy:</span>
          {Object.values(STATUS_CONFIG).filter((s) => s.label !== 'Anulowane').map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', s.dotClass)} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </PageLayout>
  )
}

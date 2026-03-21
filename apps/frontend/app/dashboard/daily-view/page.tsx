'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react'
import { PageLayout, PageHero } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'
import DailyReservationsSection from './components/DailyReservationsSection'
import CateringDailyWidget from './components/CateringDailyWidget'

// ─── Date helpers ────────────────────────────────────────────────────────────

/** Bezpieczna konwersja Date -> YYYY-MM-DD (bez UTC offset) */
function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Dodaj/odejmij dni od stringa YYYY-MM-DD */
function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

/** Polska nazwa dnia tygodnia + data */
function formatDisplayDate(dateStr: string, isToday: boolean, isTomorrow: boolean): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('pl-PL', { weekday: 'long' })
  const dayMonth = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1)

  if (isToday) return `Dzisiaj — ${capitalized}, ${dayMonth}`
  if (isTomorrow) return `Jutro — ${capitalized}, ${dayMonth}`
  return `${capitalized}, ${dayMonth}`
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DailyViewPage() {
  const accent = moduleAccents.dailyView
  const todayStr = toDateString(new Date())
  const tomorrowStr = shiftDate(todayStr, 1)

  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  const isToday = selectedDate === todayStr
  const isTomorrow = selectedDate === tomorrowStr

  const goTo = useCallback((date: string, dir: 'left' | 'right') => {
    setDirection(dir)
    setSelectedDate(date)
  }, [])

  const goToPrev = useCallback(() => goTo(shiftDate(selectedDate, -1), 'left'), [selectedDate, goTo])
  const goToNext = useCallback(() => goTo(shiftDate(selectedDate, 1), 'right'), [selectedDate, goTo])
  const goToToday = useCallback(() => goTo(todayStr, 'left'), [todayStr, goTo])

  const subtitle = formatDisplayDate(selectedDate, isToday, isTomorrow)

  return (
    <PageLayout>
      {/* Hero z nawigacją dat */}
      <PageHero
        accent={accent}
        title="Widok Dzienny"
        subtitle={subtitle}
        icon={CalendarDays}
        action={
          <div className="flex items-center gap-2">
            {/* Przycisk Dziś — widoczny tylko gdy nie jesteśmy na dziś */}
            {!isToday && (
              <button
                onClick={goToToday}
                className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                Dziś
              </button>
            )}

            {/* Poprzedni dzień */}
            <button
              onClick={goToPrev}
              aria-label="Poprzedni dzień"
              className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Następny dzień */}
            <button
              onClick={goToNext}
              aria-label="Następny dzień"
              className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        }
      />

      {/* Dwie kolumny na xl, jedna na mobile */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, x: direction === 'right' ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === 'right' ? -24 : 24 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          <DailyReservationsSection date={selectedDate} />
          <CateringDailyWidget date={selectedDate} />
        </motion.div>
      </AnimatePresence>
    </PageLayout>
  )
}

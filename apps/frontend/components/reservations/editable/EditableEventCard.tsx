'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { Sparkles, Calendar, Clock, AlertCircle, Lock } from 'lucide-react'
import { EditableCard } from './EditableCard'
import { useUpdateReservation } from '@/lib/api/reservations'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

const STANDARD_HOURS = 6
const EXTRA_HOUR_RATE = 500

// ══ LOCAL-TIME helpers (Warsaw / browser timezone) ═══════════════════════════════════════

// Returns HH:MM in browser’s local timezone (not UTC)
function localTime(dt: string | Date): string {
  const d = typeof dt === 'string' ? new Date(dt) : dt
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

// Returns YYYY-MM-DD in browser’s local timezone
function localDate(dt: string | Date): string {
  const d = typeof dt === 'string' ? new Date(dt) : dt
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Returns a plain Date (midnight) in local timezone, suitable for date-fns format()
function localDateForDisplay(dt: string | Date): Date {
  const d = typeof dt === 'string' ? new Date(dt) : dt
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Builds an ISO string with the local timezone offset, e.g. "2026-03-07T14:00:00+01:00"
// Prevents the backend (UTC) from shifting the time on storage.
function toLocalISO(dateStr: string, timeStr: string): string {
  const dt = new Date(`${dateStr}T${timeStr}:00`)
  const offsetMin = -dt.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${dateStr}T${timeStr}:00${sign}${hh}:${mm}`
}
// ══════════════════════════════════════════════════════════════════════════════

interface EditableEventCardProps {
  reservationId: string
  eventTypeId: string
  eventTypeName: string
  startDateTime: string | null
  endDateTime: string | null
  customEventType?: string
  birthdayAge?: number
  anniversaryYear?: number
  anniversaryOccasion?: string
  disabled?: boolean
  onUpdated?: () => void
}

export function EditableEventCard({
  reservationId,
  eventTypeName: initialEventTypeName,
  startDateTime: initialStart,
  endDateTime: initialEnd,
  customEventType: initialCustom,
  birthdayAge: initialBirthdayAge,
  anniversaryYear: initialAnniversaryYear,
  anniversaryOccasion: initialAnniversaryOccasion,
  disabled,
  onUpdated,
}: EditableEventCardProps) {
  const initStart = initialStart ? new Date(initialStart) : null
  const initEnd = initialEnd ? new Date(initialEnd) : null

  // Initialise form fields with LOCAL time so the user sees Warsaw time in the pickers
  const [startDate, setStartDate] = useState(initStart ? localDate(initStart) : '')
  const [startTime, setStartTime] = useState(initStart ? localTime(initStart) : '')
  const [endDate, setEndDate] = useState(initEnd ? localDate(initEnd) : '')
  const [endTime, setEndTime] = useState(initEnd ? localTime(initEnd) : '')
  const [customEventType, setCustomEventType] = useState(initialCustom || '')
  const [birthdayAge, setBirthdayAge] = useState(initialBirthdayAge || 0)
  const [anniversaryYear, setAnniversaryYear] = useState(initialAnniversaryYear || 0)
  const [anniversaryOccasion, setAnniversaryOccasion] = useState(initialAnniversaryOccasion || '')

  const updateMutation = useUpdateReservation()

  // Event type is read-only — use initial name for conditional fields
  const isBirthday = initialEventTypeName === 'Urodziny'
  const isAnniversary = initialEventTypeName === 'Rocznica' || initialEventTypeName === 'Rocznica/Jubileusz'
  const isCustom = initialEventTypeName === 'Inne'

  // Duration: parse date+time as LOCAL (no Z suffix → browser treats as local)
  const durationHours = useMemo(() => {
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(`${endDate}T${endTime}`)
      const diffMs = end.getTime() - start.getTime()
      return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10
    }
    return 0
  }, [startDate, startTime, endDate, endTime])

  const extraHours = durationHours > STANDARD_HOURS ? Math.ceil(durationHours - STANDARD_HOURS) : 0

  // Auto-fill end time when start is set and end is empty
  useEffect(() => {
    if (startDate && startTime && !endDate && !endTime) {
      const start = new Date(`${startDate}T${startTime}`) // local time
      const end = new Date(start.getTime() + 6 * 60 * 60 * 1000)
      setEndDate(localDate(end))
      setEndTime(localTime(end))
    }
  }, [startDate, startTime, endDate, endTime])

  // Sync form state when props change (e.g. after external update)
  useEffect(() => {
    if (initialStart) {
      setStartDate(localDate(initialStart))
      setStartTime(localTime(initialStart))
    }
    if (initialEnd) {
      setEndDate(localDate(initialEnd))
      setEndTime(localTime(initialEnd))
    }
    setCustomEventType(initialCustom || '')
    setBirthdayAge(initialBirthdayAge || 0)
    setAnniversaryYear(initialAnniversaryYear || 0)
    setAnniversaryOccasion(initialAnniversaryOccasion || '')
  }, [initialStart, initialEnd, initialCustom, initialBirthdayAge, initialAnniversaryYear, initialAnniversaryOccasion])

  const handleSave = async (reason: string) => {
    if (!startDate || !startTime) throw new Error('Wybierz datę i czas rozpoczęcia')
    if (!endDate || !endTime) throw new Error('Wybierz datę i czas zakończenia')

    if (durationHours <= 0) {
      throw new Error('Czas zakończenia musi być po czasie rozpoczęcia')
    }

    // toLocalISO ensures the offset (e.g. +01:00) is included so backend stores correct UTC
    const startDT = toLocalISO(startDate, startTime)
    const endDT = toLocalISO(endDate, endTime)

    // eventTypeId is NOT sent — it’s immutable after creation
    await updateMutation.mutateAsync({
      id: reservationId,
      input: {
        startDateTime: startDT,
        endDateTime: endDT,
        customEventType: isCustom ? customEventType : undefined,
        birthdayAge: isBirthday ? birthdayAge : undefined,
        anniversaryYear: isAnniversary ? anniversaryYear : undefined,
        anniversaryOccasion: isAnniversary ? anniversaryOccasion : undefined,
        reason,
      },
    })

    toast.success('Szczegóły wydarzenia zaktualizowane')
    onUpdated?.()
  }

  const handleCancel = () => {
    if (initialStart) {
      setStartDate(localDate(initialStart))
      setStartTime(localTime(initialStart))
    }
    if (initialEnd) {
      setEndDate(localDate(initialEnd))
      setEndTime(localTime(initialEnd))
    }
    setCustomEventType(initialCustom || '')
    setBirthdayAge(initialBirthdayAge || 0)
    setAnniversaryYear(initialAnniversaryYear || 0)
    setAnniversaryOccasion(initialAnniversaryOccasion || '')
  }

  const eventDateForDisplay = initialStart ? localDateForDisplay(initialStart) : null

  return (
    <EditableCard
      title="Szczegóły wydarzenia"
      icon={<Sparkles className="h-5 w-5 text-white" />}
      iconGradient="from-green-500 to-emerald-500"
      onSave={handleSave}
      onCancel={handleCancel}
      disabled={disabled}
    >
      {(editing) => {
        if (!editing) {
          return (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Typ wydarzenia</p>
                <p className="text-lg font-semibold">{initialEventTypeName}</p>
                {initialCustom && <p className="text-sm text-muted-foreground mt-1">{initialCustom}</p>}
                {initialBirthdayAge && <p className="text-sm text-muted-foreground mt-1">{initialBirthdayAge}. urodziny</p>}
                {initialAnniversaryYear && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {initialAnniversaryYear}. rocznica{initialAnniversaryOccasion ? ` \u2014 ${initialAnniversaryOccasion}` : ''}
                  </p>
                )}
              </div>
              {eventDateForDisplay && (
                <div>
                  <p className="text-sm text-muted-foreground">Data wydarzenia</p>
                  <p className="text-lg font-semibold">
                    {format(eventDateForDisplay, 'EEEE, dd MMMM yyyy', { locale: pl })}
                  </p>
                </div>
              )}
              {initialStart && initialEnd && (
                <div>
                  <p className="text-sm text-muted-foreground">Godziny</p>
                  <p className="text-lg font-semibold">
                    {localTime(initialStart)} – {localTime(initialEnd)}
                  </p>
                </div>
              )}
            </div>
          )
        }

        return (
          <div className="space-y-5">
            {/* Event type — read-only in edit mode */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Typ wydarzenia</label>
              <div className="flex items-center gap-2 h-11 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <Lock className="w-4 h-4 text-neutral-400" />
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{initialEventTypeName}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Typ wydarzenia nie może być zmieniony. Aby zmienić typ, anuluj rezerwację i utwórz nową.
              </p>
            </div>

            {isBirthday && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Input
                  type="number"
                  placeholder="np. 18"
                  value={birthdayAge || ''}
                  onChange={(e) => setBirthdayAge(parseInt(e.target.value) || 0)}
                />
                <label className="text-xs text-muted-foreground">Które urodziny</label>
              </motion.div>
            )}

            {isCustom && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Input
                  placeholder="np. Spotkanie rodzinne"
                  value={customEventType}
                  onChange={(e) => setCustomEventType(e.target.value)}
                />
                <label className="text-xs text-muted-foreground">Typ wydarzenia (własny)</label>
              </motion.div>
            )}

            {isAnniversary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <Input
                    type="number"
                    placeholder="np. 25"
                    value={anniversaryYear || ''}
                    onChange={(e) => setAnniversaryYear(parseInt(e.target.value) || 0)}
                  />
                  <label className="text-xs text-muted-foreground">Która rocznica</label>
                </div>
                <div>
                  <Input
                    placeholder="np. Srebrne wesele"
                    value={anniversaryOccasion}
                    onChange={(e) => setAnniversaryOccasion(e.target.value)}
                  />
                  <label className="text-xs text-muted-foreground">Jaka okazja</label>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Rozpoczęcie
                </p>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  label="Data"
                  placeholder="Wybierz datę..."
                />
                <TimePicker
                  value={startTime}
                  onChange={setStartTime}
                  label="Godzina"
                  placeholder="Wybierz godzinę..."
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Zakończenie
                </p>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  label="Data"
                  placeholder="Wybierz datę..."
                  disabled={!startDate}
                  minDate={startDate ? new Date(startDate) : undefined}
                />
                <TimePicker
                  value={endTime}
                  onChange={setEndTime}
                  label="Godzina"
                  placeholder="Wybierz godzinę..."
                  disabled={!startDate || !startTime}
                />
              </div>
            </div>

            {durationHours > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  durationHours > STANDARD_HOURS
                    ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {durationHours > STANDARD_HOURS && <AlertCircle className="w-5 h-5 text-amber-600" />}
                <span className={`text-sm ${
                  durationHours > STANDARD_HOURS ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'
                }`}>
                  Czas trwania: {durationHours}h
                  {extraHours > 0 && ` (${extraHours}h ponad standard \u2014 dopłata ${extraHours * EXTRA_HOUR_RATE} PLN)`}
                </span>
              </motion.div>
            )}

            {durationHours < 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Czas zakończenia musi być po czasie rozpoczęcia
              </p>
            )}
          </div>
        )
      }}
    </EditableCard>
  )
}

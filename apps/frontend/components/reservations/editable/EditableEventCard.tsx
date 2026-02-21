'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Calendar, Clock, AlertCircle } from 'lucide-react'
import { EditableCard } from './EditableCard'
import { useEventTypes } from '@/hooks/use-event-types'
import { useUpdateReservation } from '@/lib/api/reservations'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

const STANDARD_HOURS = 6
const EXTRA_HOUR_RATE = 500

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
  onUpdated?: () => void
}

export function EditableEventCard({
  reservationId,
  eventTypeId: initialEventTypeId,
  eventTypeName: initialEventTypeName,
  startDateTime: initialStart,
  endDateTime: initialEnd,
  customEventType: initialCustom,
  birthdayAge: initialBirthdayAge,
  anniversaryYear: initialAnniversaryYear,
  anniversaryOccasion: initialAnniversaryOccasion,
  onUpdated,
}: EditableEventCardProps) {
  const parseDate = (dt: string | null) => dt ? new Date(dt) : null
  const initStart = parseDate(initialStart)
  const initEnd = parseDate(initialEnd)

  const [eventTypeId, setEventTypeId] = useState(initialEventTypeId)
  const [startDate, setStartDate] = useState(initStart ? initStart.toISOString().split('T')[0] : '')
  const [startTime, setStartTime] = useState(initStart ? initStart.toTimeString().slice(0, 5) : '')
  const [endDate, setEndDate] = useState(initEnd ? initEnd.toISOString().split('T')[0] : '')
  const [endTime, setEndTime] = useState(initEnd ? initEnd.toTimeString().slice(0, 5) : '')
  const [customEventType, setCustomEventType] = useState(initialCustom || '')
  const [birthdayAge, setBirthdayAge] = useState(initialBirthdayAge || 0)
  const [anniversaryYear, setAnniversaryYear] = useState(initialAnniversaryYear || 0)
  const [anniversaryOccasion, setAnniversaryOccasion] = useState(initialAnniversaryOccasion || '')

  const { data: eventTypesData } = useEventTypes()
  const updateMutation = useUpdateReservation()

  const eventTypesArray = useMemo(() => Array.isArray(eventTypesData) ? eventTypesData : [], [eventTypesData])

  const selectedEventTypeName = useMemo(() => {
    const t = eventTypesArray.find((t) => t.id === eventTypeId)
    return t?.name || ''
  }, [eventTypeId, eventTypesArray])

  const isBirthday = selectedEventTypeName === 'Urodziny'
  const isAnniversary = selectedEventTypeName === 'Rocznica' || selectedEventTypeName === 'Rocznica/Jubileusz'
  const isCustom = selectedEventTypeName === 'Inne'

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

  useEffect(() => {
    if (startDate && startTime && !endDate && !endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(start.getTime() + 6 * 60 * 60 * 1000)
      setEndDate(end.toISOString().split('T')[0])
      setEndTime(end.toTimeString().slice(0, 5))
    }
  }, [startDate, startTime, endDate, endTime])

  useEffect(() => {
    setEventTypeId(initialEventTypeId)
    if (initStart) {
      setStartDate(initStart.toISOString().split('T')[0])
      setStartTime(initStart.toTimeString().slice(0, 5))
    }
    if (initEnd) {
      setEndDate(initEnd.toISOString().split('T')[0])
      setEndTime(initEnd.toTimeString().slice(0, 5))
    }
    setCustomEventType(initialCustom || '')
    setBirthdayAge(initialBirthdayAge || 0)
    setAnniversaryYear(initialAnniversaryYear || 0)
    setAnniversaryOccasion(initialAnniversaryOccasion || '')
  }, [initialEventTypeId, initialStart, initialEnd, initialCustom, initialBirthdayAge, initialAnniversaryYear, initialAnniversaryOccasion])

  const handleSave = async (reason: string) => {
    if (!eventTypeId) throw new Error('Wybierz typ wydarzenia')
    if (!startDate || !startTime) throw new Error('Wybierz datę i czas rozpoczęcia')
    if (!endDate || !endTime) throw new Error('Wybierz datę i czas zakończenia')

    const startDT = `${startDate}T${startTime}:00`
    const endDT = `${endDate}T${endTime}:00`

    if (new Date(endDT) <= new Date(startDT)) {
      throw new Error('Czas zakończenia musi być po czasie rozpoczęcia')
    }

    await updateMutation.mutateAsync({
      id: reservationId,
      input: {
        eventTypeId,
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
    setEventTypeId(initialEventTypeId)
    if (initStart) {
      setStartDate(initStart.toISOString().split('T')[0])
      setStartTime(initStart.toTimeString().slice(0, 5))
    }
    if (initEnd) {
      setEndDate(initEnd.toISOString().split('T')[0])
      setEndTime(initEnd.toTimeString().slice(0, 5))
    }
    setCustomEventType(initialCustom || '')
    setBirthdayAge(initialBirthdayAge || 0)
    setAnniversaryYear(initialAnniversaryYear || 0)
    setAnniversaryOccasion(initialAnniversaryOccasion || '')
  }

  const eventDate = initStart

  return (
    <EditableCard
      title="Szczegóły wydarzenia"
      icon={<Sparkles className="h-5 w-5 text-white" />}
      iconGradient="from-green-500 to-emerald-500"
      onSave={handleSave}
      onCancel={handleCancel}
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
                    {initialAnniversaryYear}. rocznica{initialAnniversaryOccasion ? ` — ${initialAnniversaryOccasion}` : ''}
                  </p>
                )}
              </div>
              {eventDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Data wydarzenia</p>
                  <p className="text-lg font-semibold">
                    {format(eventDate, 'EEEE, dd MMMM yyyy', { locale: pl })}
                  </p>
                </div>
              )}
              {initialStart && initialEnd && (
                <div>
                  <p className="text-sm text-muted-foreground">Godziny</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(initialStart), 'HH:mm')} - {format(new Date(initialEnd), 'HH:mm')}
                  </p>
                </div>
              )}
            </div>
          )
        }

        return (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Typ wydarzenia</label>
              <Select value={eventTypeId} onValueChange={setEventTypeId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Wybierz typ wydarzenia..." />
                </SelectTrigger>
                <SelectContent>
                  {eventTypesArray.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {extraHours > 0 && ` (${extraHours}h ponad standard — dopłata ${extraHours * EXTRA_HOUR_RATE} PLN)`}
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

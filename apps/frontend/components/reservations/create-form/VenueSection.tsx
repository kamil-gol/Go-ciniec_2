'use client'

import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2, CheckCircle, AlertCircle, AlertTriangle, Users,
} from 'lucide-react'
import type { VenueSectionProps } from './types'

export function VenueSection({
  formCtx,
  hallsArray,
  selectedHall,
  selectedHallCapacity,
  isMultiBookingHall,
  defaultHallId,
  watchAll,
  startDate,
  startTime,
  startDateTimeISO,
  endDateTimeISO,
  durationHours,
  extraHours,
  standardHours,
  availability,
  availabilityLoading,
  availableCapacity,
  capacityLoading,
}: VenueSectionProps) {
  const { control, errors } = formCtx
  const hallId = watchAll.hallId

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-3">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Wybierz salę i termin</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Sprawdzimy dostępność automatycznie</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Sala<span className="text-destructive ml-0.5" aria-hidden="true">*</span></label>
        <Controller
          name="hallId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={`h-11 ${errors.hallId ? 'border-red-400 dark:border-red-500' : ''}`} aria-label="Wybierz salę" aria-required="true">
                <SelectValue placeholder="Wybierz salę..." />
              </SelectTrigger>
              <SelectContent>
                {hallsArray.map((hall) => (
                  <SelectItem key={hall.id} value={hall.id}>
                    {hall.name} (max {hall.capacity} osób)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.hallId && <p className="text-xs text-red-500 dark:text-red-400">{errors.hallId.message}</p>}
      </div>

      {selectedHallCapacity > 0 && (
        <p className="-mt-4 text-sm text-neutral-600 dark:text-neutral-400">Maksymalna pojemność: {selectedHallCapacity} osób</p>
      )}

      {selectedHall && (selectedHall as any).isWholeVenue && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Cały obiekt</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Do tej rezerwacji zostanie doliczona dopłata za wynajem całego obiektu (2 000 – 3 000 PLN w zależności od liczby gości).</p>
          </div>
        </motion.div>
      )}

      {defaultHallId && watchAll.hallId === defaultHallId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-200">Sala wybrana automatycznie z widoku szczegółów</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Rozpoczęcie</p>
          <Controller name="startDate" control={control} render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} label="Data" placeholder="Wybierz datę..." error={errors.startDate?.message} minDate={new Date()} aria-required="true" />
          )} />
          <Controller name="startTime" control={control} render={({ field }) => (
            <TimePicker value={field.value} onChange={field.onChange} label="Godzina" placeholder="Wybierz godzinę..." error={errors.startTime?.message} aria-required="true" />
          )} />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Zakończenie</p>
          <Controller name="endDate" control={control} render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} label="Data" placeholder="Wybierz datę..." error={errors.endDate?.message} disabled={!startDate} minDate={startDate ? new Date(startDate) : undefined} aria-required="true" />
          )} />
          <Controller name="endTime" control={control} render={({ field }) => (
            <TimePicker value={field.value} onChange={field.onChange} label="Godzina" placeholder="Wybierz godzinę..." error={errors.endTime?.message} disabled={!startDate || !startTime} aria-required="true" />
          )} />
        </div>
      </div>

      {durationHours > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`p-3 rounded-lg flex items-center gap-2 ${durationHours > standardHours ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}
        >
          {durationHours > standardHours && <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          <span className={`text-sm ${durationHours > standardHours ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}>
            Czas trwania: {durationHours}h
            {durationHours > standardHours && ` (${extraHours}h ponad standard — dopłata zostanie doliczona w wycenie)`}
          </span>
        </motion.div>
      )}

      {hallId && startDateTimeISO && endDateTimeISO && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`p-4 rounded-lg border ${
            availabilityLoading ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
              : availability?.available ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          {availabilityLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Sprawdzanie dostępności...</span>
            </div>
          ) : availability?.available ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Sala jest dostępna w wybranym terminie</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">Kolizja z istniejącą rezerwacją!</span>
              </div>
              {availability?.conflicts?.map((c: any) => (
                <div key={c.id} className="ml-7 text-xs text-red-700 dark:text-red-300">
                  • {c.clientName} — {c.eventType} ({new Date(c.startDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}–{new Date(c.endDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })})
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* #165: Capacity banner for multi-booking halls */}
      {isMultiBookingHall && hallId && startDateTimeISO && endDateTimeISO && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20"
        >
          {capacityLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Sprawdzanie pojemności...</span>
            </div>
          ) : availableCapacity ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Tryb wielu rezerwacji — pojemność sali</span>
              </div>
              <div className="flex justify-between text-xs text-purple-700 dark:text-purple-300">
                <span>Zajęto: {availableCapacity.occupiedCapacity} osób</span>
                <span>Wolne: {availableCapacity.availableCapacity} z {availableCapacity.totalCapacity}</span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    availableCapacity.availableCapacity === 0
                      ? 'bg-red-500'
                      : availableCapacity.occupiedCapacity / availableCapacity.totalCapacity >= 0.9
                      ? 'bg-amber-500'
                      : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((availableCapacity.occupiedCapacity / availableCapacity.totalCapacity) * 100))}%` }}
                />
              </div>
              {availableCapacity.overlappingReservations > 0 && (
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {availableCapacity.overlappingReservations}{' '}
                  {availableCapacity.overlappingReservations === 1 ? 'rezerwacja' : availableCapacity.overlappingReservations < 5 ? 'rezerwacje' : 'rezerwacji'} w tym terminie
                </p>
              )}
              {availableCapacity.availableCapacity === 0 && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  ⚠ Sala jest całkowicie zajęta — brak wolnych miejsc
                </p>
              )}
            </div>
          ) : null}
        </motion.div>
      )}
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  X,
  Users,
  Clock,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { cn, formatDateLong } from '@/lib/utils'
import type { CalendarReservation } from '@/lib/api/calendar-api'
import { STATUS_CONFIG } from './calendar.constants'
import { formatCurrency } from './calendar.helpers'

/* #165: DayDetailPanel — groups reservations by hall with capacity bars */
export default function DayDetailPanel({ date, reservations, onClose, onReservationClick }: {
  date: Date; reservations: CalendarReservation[]; onClose: () => void; onReservationClick: (id: string) => void
}) {
  const dayName = date.toLocaleDateString('pl-PL', { weekday: 'long' })
  const fullDate = formatDateLong(date)

  const hallGroups = useMemo(() => {
    const groups = new Map<string, { hall: CalendarReservation['hall']; reservations: CalendarReservation[] }>()
    for (const r of reservations) {
      const key = r.hall?.id || '__no_hall__'
      if (!groups.has(key)) groups.set(key, { hall: r.hall, reservations: [] })
      groups.get(key)!.reservations.push(r)
    }
    return Array.from(groups.values())
  }, [reservations])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="rounded-2xl bg-white dark:bg-neutral-800/80 p-4 sm:p-5 shadow-soft border border-neutral-100 dark:border-neutral-700/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 capitalize">{dayName}</h3>
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
        <div className="space-y-4">
          {hallGroups.map(({ hall, reservations: hallReservations }) => {
            const isMulti = hall?.allowMultipleBookings && hall?.capacity && hall.capacity > 0
            const activeRes = hallReservations.filter((r) => r.status !== 'CANCELLED')
            const totalGuests = activeRes.reduce((sum, r) => sum + (r.guests || 0), 0)
            const occupancyPct = isMulti ? Math.min(100, Math.round((totalGuests / hall!.capacity!) * 100)) : 0

            return (
              <div key={hall?.id || '__no_hall__'}>
                {/* Hall section header */}
                {(hallGroups.length > 1 || isMulti) && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {hall?.name || 'Bez sali'}
                      </span>
                      {isMulti && (
                        <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                          {totalGuests}/{hall!.capacity} osób — {activeRes.length} rez.
                        </span>
                      )}
                    </div>
                    {isMulti && (
                      <div className="w-full h-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            occupancyPct >= 90 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-amber-500' : 'bg-violet-500'
                          )}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Reservation cards */}
                <div className="space-y-2">
                  {hallReservations.map((r) => {
                    const color = r.eventType?.color || '#6366f1'
                    const status = STATUS_CONFIG[r.status]
                    return (
                      <button key={r.id} onClick={() => onReservationClick(r.id)}
                        className="group w-full text-left rounded-xl p-3 border border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                              {hallGroups.length <= 1 && r.hall && (
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.hall.name}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                {r.guests} os. • {formatCurrency(r.totalPrice)}
                                {isMulti && hall?.capacity && (
                                  <span className="text-violet-500 ml-1">
                                    ({Math.round(((r.guests || 0) / hall.capacity) * 100)}% sali)
                                  </span>
                                )}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

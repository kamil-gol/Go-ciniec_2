'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, User, DollarSign, Plus, ChevronRight, AlertCircle, UsersRound, UserCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { reservationsApi } from '@/lib/api/reservations'
import { Reservation } from '@/types'
import { format, parseISO, isSameDay, startOfDay, endOfDay, addDays, subDays } from 'date-fns'
import { pl } from 'date-fns/locale'
import Link from 'next/link'

interface HallReservationsCalendarProps {
  hallId: string
  hallName: string
  hallCapacity?: number
  allowMultipleBookings?: boolean
  onCreateReservation?: () => void
}

export function HallReservationsCalendar({
  hallId,
  hallName,
  hallCapacity,
  allowMultipleBookings = false,
  onCreateReservation,
}: HallReservationsCalendarProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')

  const loadReservations = useCallback(async () => {
    setLoading(true)
    try {
      let dateFrom: string
      let dateTo: string

      if (viewMode === 'day') {
        dateFrom = startOfDay(selectedDate).toISOString()
        dateTo = endOfDay(selectedDate).toISOString()
      } else if (viewMode === 'week') {
        dateFrom = startOfDay(subDays(selectedDate, 3)).toISOString()
        dateTo = endOfDay(addDays(selectedDate, 3)).toISOString()
      } else {
        dateFrom = startOfDay(subDays(selectedDate, 15)).toISOString()
        dateTo = endOfDay(addDays(selectedDate, 15)).toISOString()
      }

      const response = await reservationsApi.getAll({
        hallId,
        dateFrom,
        dateTo,
        sortBy: 'date',
        sortOrder: 'asc',
      })

      setReservations(response.data || [])
    } catch (error) {
      console.error('Failed to load hall reservations:', error)
    } finally {
      setLoading(false)
    }
  }, [hallId, selectedDate, viewMode])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  // Group reservations by date
  const reservationsByDate = reservations.reduce((acc, res) => {
    const dateKey = res.startDateTime
      ? format(parseISO(res.startDateTime), 'yyyy-MM-dd')
      : res.date || 'unknown'

    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(res)
    return acc
  }, {} as Record<string, Reservation[]>)

  // Sort each date's reservations by time
  Object.keys(reservationsByDate).forEach((date) => {
    reservationsByDate[date].sort((a, b) => {
      const timeA = a.startDateTime ? new Date(a.startDateTime).getTime() : 0
      const timeB = b.startDateTime ? new Date(b.startDateTime).getTime() : 0
      return timeA - timeB
    })
  })

  const dates = Object.keys(reservationsByDate).sort()

  // Get today's reservations
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayReservations = reservationsByDate[todayKey] || []

  /** #165: Calculate occupied guests for a date (excluding cancelled) */
  const getDateOccupancy = (dateReservations: Reservation[]) => {
    const activeReservations = dateReservations.filter(
      (r) => r.status !== 'CANCELLED'
    )
    const totalGuests = activeReservations.reduce(
      (sum, r) => sum + (r.guests || 0),
      0
    )
    return { activeCount: activeReservations.length, totalGuests }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie rezerwacji...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Rezerwacje dla: {hallName}</h3>
            {/* #165: Booking mode badge */}
            {allowMultipleBookings ? (
              <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-0 shadow-none">
                <UsersRound className="h-3 w-3 mr-1" />
                Wiele rezerwacji
              </Badge>
            ) : (
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0 shadow-none">
                <UserCheck className="h-3 w-3 mr-1" />
                Wyłączność
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {reservations.length === 0
              ? 'Brak rezerwacji'
              : `Znaleziono ${reservations.length} rezerwacji`}
            {allowMultipleBookings && hallCapacity && (
              <span> · Pojemność sali: {hallCapacity} osób</span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {/* View mode buttons */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              onClick={() => setViewMode('day')}
              className={viewMode === 'day' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : ''}
            >
              Dzień
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              onClick={() => setViewMode('week')}
              className={viewMode === 'week' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : ''}
            >
              Tydzień
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              onClick={() => setViewMode('month')}
              className={viewMode === 'month' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : ''}
            >
              Miesiąc
            </Button>
          </div>

          {onCreateReservation && (
            <Button
              onClick={onCreateReservation}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nowa Rezerwacja
            </Button>
          )}
        </div>
      </div>

      {/* #165: Multi-reservation info with capacity */}
      {todayReservations.length > 1 && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <strong>Wiele rezerwacji dziś ({todayReservations.length}):</strong>{' '}
            {allowMultipleBookings && hallCapacity ? (
              <>
                Zajęto {getDateOccupancy(todayReservations).totalGuests} z {hallCapacity} miejsc
                ({hallCapacity - getDateOccupancy(todayReservations).totalGuests} wolnych).
              </>
            ) : (
              <>System automatycznie sprawdza, czy czasy się nie nakładają.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Reservations Timeline */}
      {reservations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Brak rezerwacji</h3>
            <p className="text-muted-foreground mb-4">
              Nie ma jeszcze żadnych rezerwacji dla tej sali w wybranym okresie.
            </p>
            {onCreateReservation && (
              <Button onClick={onCreateReservation} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Dodaj pierwszą rezerwację
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {dates.map((dateKey) => {
            const dateReservations = reservationsByDate[dateKey]
            const date = parseISO(dateKey)
            const isToday = isSameDay(date, new Date())
            const { activeCount, totalGuests } = getDateOccupancy(dateReservations)
            const hasCapacityInfo = allowMultipleBookings && hallCapacity && hallCapacity > 0
            const occupancyPercent = hasCapacityInfo
              ? Math.min(100, Math.round((totalGuests / hallCapacity) * 100))
              : 0
            const availableSeats = hasCapacityInfo ? hallCapacity - totalGuests : 0

            return (
              <div key={dateKey} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isToday
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'bg-muted'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <div>
                      <div className="font-semibold">
                        {format(date, 'EEEE', { locale: pl })}
                      </div>
                      <div className="text-sm">
                        {format(date, 'd MMMM yyyy', { locale: pl })}
                      </div>
                    </div>
                  </div>
                  {dateReservations.length > 1 && (
                    <Badge
                      variant="default"
                      className="border border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300"
                    >
                      {dateReservations.length} rezerwacje
                    </Badge>
                  )}

                  {/* #165: Capacity indicator for multi-booking halls */}
                  {hasCapacityInfo && activeCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                        <UsersRound className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                          {totalGuests}/{hallCapacity} osób
                        </span>
                        <span className="text-xs text-violet-500 dark:text-violet-400">
                          ({availableSeats > 0 ? `wolne: ${availableSeats}` : 'pełna'})
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-24 h-2 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            occupancyPercent >= 90
                              ? 'bg-red-500'
                              : occupancyPercent >= 70
                              ? 'bg-amber-500'
                              : 'bg-violet-500'
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Reservations for this date */}
                <div className="grid gap-3">
                  {dateReservations.map((reservation, idx) => {
                    const startTime = reservation.startDateTime
                      ? format(parseISO(reservation.startDateTime), 'HH:mm')
                      : reservation.startTime || '00:00'

                    const endTime = reservation.endDateTime
                      ? format(parseISO(reservation.endDateTime), 'HH:mm')
                      : reservation.endTime || '23:59'

                    return (
                      <Link
                        key={reservation.id}
                        href={`/dashboard/reservations/${reservation.id}`}
                      >
                        <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 p-4">
                            <div className="flex items-start justify-between gap-4">
                              {/* Left: Time & Position */}
                              <div className="flex items-center gap-4">
                                {/* Position badge (for multiple reservations) */}
                                {dateReservations.length > 1 && (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow-lg">
                                    {idx + 1}
                                  </div>
                                )}

                                {/* Time info */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    <span className="font-semibold text-lg">
                                      {startTime} - {endTime}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Czas trwania: {calculateDuration(startTime, endTime)}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Status */}
                              <StatusBadge type="reservation" status={reservation.status} />
                            </div>

                            {/* Divider */}
                            <div className="my-3 border-t border-purple-200/50 dark:border-purple-800/50" />

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Client */}
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-white dark:bg-black/20 rounded-lg">
                                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Klient</div>
                                  <div className="font-medium">
                                    {reservation.client?.firstName}{' '}
                                    {reservation.client?.lastName}
                                  </div>
                                </div>
                              </div>

                              {/* Guests */}
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-white dark:bg-black/20 rounded-lg">
                                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Goście</div>
                                  <div className="font-medium">
                                    {reservation.guests} osób
                                    {/* #165: show percentage of capacity */}
                                    {hasCapacityInfo && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({Math.round(((reservation.guests || 0) / hallCapacity) * 100)}% sali)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-white dark:bg-black/20 rounded-lg">
                                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Wartość</div>
                                  <div className="font-medium">
                                    {reservation.totalPrice} zł
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* View Details */}
                            <div className="mt-3 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                              Zobacz szczegóły
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Helper: Calculate duration
function calculateDuration(startTime: string, endTime: string): string {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  const durationMinutes = endMinutes - startMinutes

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} godz`
  return `${hours} godz ${minutes} min`
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getHallById, getHallAvailability, type Hall, type HallAvailability } from '@/lib/api/halls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Users, DollarSign, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
]

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb', 'Nd']

export default function HallDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const hallId = params.id as string

  const [hall, setHall] = useState<Hall | null>(null)
  const [availability, setAvailability] = useState<HallAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarLoading, setCalendarLoading] = useState(false)

  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)

  useEffect(() => {
    loadHall()
  }, [hallId])

  useEffect(() => {
    if (hall) {
      loadAvailability()
    }
  }, [hall, currentYear, currentMonth])

  const loadHall = async () => {
    try {
      setLoading(true)
      const data = await getHallById(hallId)
      setHall(data)
    } catch (error) {
      console.error('Error loading hall:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować szczegółów sali',
        variant: 'destructive',
      })
      router.push('/dashboard/halls')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailability = async () => {
    try {
      setCalendarLoading(true)
      const data = await getHallAvailability(hallId, currentYear, currentMonth)
      setAvailability(data)
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setCalendarLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500'
      case 'PENDING': return 'bg-yellow-500'
      case 'RESERVED': return 'bg-blue-500'
      case 'CANCELLED': return 'bg-gray-400'
      case 'COMPLETED': return 'bg-purple-500'
      default: return 'bg-gray-200'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Potwierdzona'
      case 'PENDING': return 'Oczekująca'
      case 'RESERVED': return 'Zarezerwowana'
      case 'CANCELLED': return 'Anulowana'
      case 'COMPLETED': return 'Zakończona'
      default: return 'Wolny termin'
    }
  }

  // Generate calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0

  const calendarDays: (HallAvailability | null)[] = []
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayAvailability = availability.find(a => a.date === dateStr)
    calendarDays.push(dayAvailability || { date: dateStr, isAvailable: true })
  }

  if (loading || !hall) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-12 text-center">
          <p>Wczytywanie...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{hall.name}</h1>
          <p className="text-muted-foreground">Szczegóły i dostępność sali</p>
        </div>
        <Link href={`/dashboard/halls/${hallId}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edytuj
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hall Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hall.isActive && (
                <Badge variant="secondary" className="mb-2">Nieaktywna</Badge>
              )}
              <div>
                <div className="flex items-center text-sm mb-1">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Pojemność</span>
                </div>
                <p className="text-2xl font-bold">{hall.capacity} osób</p>
              </div>
              <div>
                <div className="flex items-center text-sm mb-1">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Cena za osobę dorosłą</span>
                </div>
                <p className="text-2xl font-bold">{hall.pricePerPerson} zł</p>
              </div>
              {hall.pricePerChild && (
                <div>
                  <div className="flex items-center text-sm mb-1">
                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Cena za dziecko</span>
                  </div>
                  <p className="text-2xl font-bold">{hall.pricePerChild} zł</p>
                </div>
              )}
            </CardContent>
          </Card>

          {hall.description && (
            <Card>
              <CardHeader>
                <CardTitle>Opis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{hall.description}</p>
              </CardContent>
            </Card>
          )}

          {hall.amenities && hall.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Udogodnienia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {hall.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Kalendarz Dostępności
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-lg font-semibold min-w-[180px] text-center">
                    {MONTHS[currentMonth - 1]} {currentYear}
                  </div>
                  <Button variant="outline" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {calendarLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <p className="text-muted-foreground">Wczytywanie kalendarza...</p>
                </div>
              ) : (
                <div>
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {WEEKDAYS.map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                      if (!day) {
                        return <div key={idx} className="aspect-square" />
                      }

                      const dayNumber = parseInt(day.date.split('-')[2])
                      const isToday = day.date === new Date().toISOString().split('T')[0]

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (day.reservationId) {
                              router.push(`/dashboard/reservations/${day.reservationId}`)
                            }
                          }}
                          className={cn(
                            'aspect-square p-2 rounded-lg border-2 transition-all',
                            'flex flex-col items-center justify-center',
                            'hover:shadow-md',
                            isToday && 'border-blue-500 font-bold',
                            day.isAvailable ? 'bg-white hover:bg-gray-50' : 'hover:bg-opacity-80',
                            !day.isAvailable && getStatusColor(day.reservationStatus)
                          )}
                          title={day.isAvailable ? 'Wolny termin' : `${getStatusText(day.reservationStatus)}\n${day.reservationClient || ''}`}
                        >
                          <span className={cn(
                            'text-sm',
                            !day.isAvailable && 'text-white font-semibold'
                          )}>
                            {dayNumber}
                          </span>
                          {!day.isAvailable && (
                            <span className="text-[10px] text-white mt-1 line-clamp-1">
                              {day.reservationClient?.split(' ')[1]}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-semibold mb-3">Legenda:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white border-2" />
                        <span className="text-xs">Wolny</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-500" />
                        <span className="text-xs">Oczekująca</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500" />
                        <span className="text-xs">Potwierdzona</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500" />
                        <span className="text-xs">Zarezerwowana</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-500" />
                        <span className="text-xs">Zakończona</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

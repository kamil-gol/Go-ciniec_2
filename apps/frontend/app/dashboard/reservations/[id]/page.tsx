'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Edit, Trash2, CheckCircle2, XCircle, Clock, 
  Calendar, Users, DollarSign, Building2, User, Mail, Phone,
  FileText, Download, Sparkles, MapPin, CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getReservationById, downloadReservationPDF, type Reservation } from '@/lib/api/reservations'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

const statusConfig = {
  PENDING: {
    label: 'Oczekująca',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Potwierdzona',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Anulowana',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    icon: XCircle,
  },
  COMPLETED: {
    label: 'Zakończona',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    icon: CheckCircle2,
  },
}

export default function ReservationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    loadReservation()
  }, [params.id])

  const loadReservation = async () => {
    try {
      setLoading(true)
      const data = await getReservationById(params.id as string)
      setReservation(data)
    } catch (error: any) {
      console.error('Error loading reservation:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować rezerwacji',
        variant: 'destructive',
      })
      router.push('/dashboard/reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!reservation) return
    
    try {
      setDownloading(true)
      await downloadReservationPDF(reservation.id)
      toast({
        title: 'Sukces',
        description: 'PDF został pobrany',
      })
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać PDF',
        variant: 'destructive',
      })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie...</p>
        </div>
      </div>
    )
  }

  if (!reservation) {
    return null
  }

  const status = statusConfig[reservation.status as keyof typeof statusConfig]
  const StatusIcon = status.icon
  const eventDate = reservation.startDateTime 
    ? new Date(reservation.startDateTime) 
    : reservation.date 
    ? new Date(reservation.date) 
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-6">
            {/* Back Button */}
            <Link href="/dashboard/reservations">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót do listy
              </Button>
            </Link>

            {/* Title Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">Rezerwacja #{reservation.id.slice(0, 8)}</h1>
                    <p className="text-white/90 text-lg mt-1">Szczegóły rezerwacji</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${status.color} text-white border-0 px-3 py-1`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  {eventDate && (
                    <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(eventDate, 'dd MMMM yyyy', { locale: pl })}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {downloading ? 'Pobieranie...' : 'Pobierz PDF'}
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <Card className="border-0 shadow-xl">
              <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Klient</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Imię i nazwisko</p>
                      <p className="text-lg font-semibold">
                        {reservation.client?.firstName} {reservation.client?.lastName}
                      </p>
                    </div>
                  </div>
                  {reservation.client?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-lg font-semibold">{reservation.client.email}</p>
                      </div>
                    </div>
                  )}
                  {reservation.client?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="text-lg font-semibold">{reservation.client.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Hall Info */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  Sala
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nazwa sali</p>
                    <p className="text-2xl font-bold">{reservation.hall?.name}</p>
                  </div>
                  {reservation.hall?.capacity && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Pojemność: {reservation.hall.capacity} osób</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  Szczegóły wydarzenia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Typ wydarzenia</p>
                    <p className="text-lg font-semibold">{reservation.eventType?.name}</p>
                  </div>
                  {eventDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Data wydarzenia</p>
                      <p className="text-lg font-semibold">
                        {format(eventDate, 'EEEE, dd MMMM yyyy', { locale: pl })}
                      </p>
                    </div>
                  )}
                  {reservation.startDateTime && reservation.endDateTime && (
                    <div>
                      <p className="text-sm text-muted-foreground">Godziny</p>
                      <p className="text-lg font-semibold">
                        {format(new Date(reservation.startDateTime), 'HH:mm')} - {format(new Date(reservation.endDateTime), 'HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {reservation.notes && (
              <Card className="border-0 shadow-xl">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    Notatki
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-muted-foreground leading-relaxed">{reservation.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Stats & Pricing */}
          <div className="space-y-6">
            {/* Guests Breakdown */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-indigo-950/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Goście</h2>
                </div>
                <div className="space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Dorośli</p>
                      <p className="text-2xl font-bold">{reservation.adults || 0}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                  </div>
                  {/* Children */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Dzieci</p>
                      <p className="text-2xl font-bold">{reservation.children || 0}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                  </div>
                  {/* Toddlers */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Maluchy</p>
                      <p className="text-2xl font-bold">{reservation.toddlers || 0}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                  </div>
                  {/* Total */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <div>
                      <p className="text-sm font-semibold">Razem</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {(reservation.adults || 0) + (reservation.children || 0) + (reservation.toddlers || 0)}
                      </p>
                    </div>
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Cennik</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                    <span className="text-sm text-muted-foreground">Cena za dorosłego</span>
                    <span className="font-semibold">{reservation.pricePerAdult} zł</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                    <span className="text-sm text-muted-foreground">Cena za dziecko</span>
                    <span className="font-semibold">{reservation.pricePerChild} zł</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                    <span className="text-sm text-muted-foreground">Cena za malucha</span>
                    <span className="font-semibold">{reservation.pricePerToddler} zł</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                    <span className="font-bold">Suma całkowita</span>
                    <span className="text-2xl font-bold">{reservation.totalPrice} zł</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Szybkie akcje</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Edit className="mr-2 h-4 w-4" />
                  Edytuj rezerwację
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" size="lg">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Anuluj rezerwację
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

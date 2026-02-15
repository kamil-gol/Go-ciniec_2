'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Edit, Trash2, User, Mail, Phone, MapPin,
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  Building2, Sparkles, FileText, TrendingUp, DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getClientById, type Client } from '@/lib/api/clients'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import AttachmentPanel from '@/components/attachments/attachment-panel'

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClient()
  }, [params.id])

  const loadClient = async () => {
    try {
      setLoading(true)
      const data = await getClientById(params.id as string)
      setClient(data)
    } catch (error: any) {
      console.error('Error loading client:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować klienta',
        variant: 'destructive',
      })
      router.push('/dashboard/clients')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  // Calculate stats
  const reservations = client.reservations || []
  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    completed: reservations.filter(r => r.status === 'COMPLETED').length,
    totalSpent: reservations
      .filter(r => r.status === 'CONFIRMED' || r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-6">
            {/* Back Button */}
            <Link href="/dashboard/clients">
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
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">
                      {client.firstName} {client.lastName}
                    </h1>
                    <p className="text-white/90 text-lg mt-1">Profil klienta</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                    <Calendar className="h-3 w-3 mr-1" />
                    Dodano {format(new Date(client.createdAt), 'dd MMMM yyyy', { locale: pl })}
                  </Badge>
                  {stats.total > 0 && (
                    <Badge className="bg-green-500 text-white border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {stats.total} {stats.total === 1 ? 'rezerwacja' : 'rezerwacje'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <Edit className="mr-2 h-5 w-5" />
                  Edytuj
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Reservations */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Rezerwacje</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirmed */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Potwierdzone</p>
                  <p className="text-3xl font-bold">{stats.confirmed}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Zakończone</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Spent */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Wydano</p>
                  <p className="text-3xl font-bold">{stats.totalSpent.toLocaleString('pl-PL')} zł</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Details */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Dane kontaktowe</h2>
                </div>
                <div className="space-y-4">
                  {/* Name */}
                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Imię i nazwisko</p>
                      <p className="text-base font-semibold">
                        {client.firstName} {client.lastName}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  {client.email && (
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-base font-semibold break-all">{client.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {client.phone && (
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefon</p>
                        <p className="text-base font-semibold">{client.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {client.address && (
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-lg">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Adres</p>
                        <p className="text-base font-semibold">{client.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Notes */}
            {client.notes && (
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
                  <p className="text-muted-foreground leading-relaxed">{client.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Szybkie akcje</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Link href={`/dashboard/reservations/new?clientId=${client.id}`}>
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Calendar className="mr-2 h-4 w-4" />
                    Nowa rezerwacja
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Edit className="mr-2 h-4 w-4" />
                  Edytuj dane
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" size="lg">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Usuń klienta
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Reservations History + Attachments */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Historia rezerwacji</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {reservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold text-muted-foreground">Brak rezerwacji</p>
                    <p className="text-sm text-muted-foreground mt-1">Ten klient nie ma jeszcze żadnych rezerwacji</p>
                    <Link href={`/dashboard/reservations/new?clientId=${client.id}`}>
                      <Button className="mt-4" size="lg">
                        <Calendar className="mr-2 h-4 w-4" />
                        Utwórz pierwszą rezerwację
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((reservation: any) => {
                      const eventDate = reservation.startDateTime 
                        ? new Date(reservation.startDateTime) 
                        : reservation.date 
                        ? new Date(reservation.date) 
                        : null

                      const statusConfig: any = {
                        PENDING: { color: 'bg-orange-500', icon: Clock },
                        CONFIRMED: { color: 'bg-green-500', icon: CheckCircle2 },
                        CANCELLED: { color: 'bg-red-500', icon: XCircle },
                        COMPLETED: { color: 'bg-blue-500', icon: CheckCircle2 },
                      }
                      const status = statusConfig[reservation.status] || statusConfig.PENDING
                      const StatusIcon = status.icon

                      return (
                        <Link key={reservation.id} href={`/dashboard/reservations/${reservation.id}`}>
                          <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${status.color} text-white border-0`}>
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {reservation.status}
                                    </Badge>
                                    {eventDate && (
                                      <span className="text-sm text-muted-foreground">
                                        {format(eventDate, 'dd MMM yyyy', { locale: pl })}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{reservation.hall?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{reservation.eventType?.name}</span>
                                    <span>•</span>
                                    <span>{(reservation.adults || 0) + (reservation.children || 0) + (reservation.toddlers || 0)} osób</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold">{reservation.totalPrice} zł</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments Panel */}
            <AttachmentPanel
              entityType="CLIENT"
              entityId={client.id}
              title="Załączniki klienta"
              className="shadow-xl"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

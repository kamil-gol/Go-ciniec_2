'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Edit, Calendar, Users, Sparkles, CheckCircle2, Building2, UsersRound, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getHallById, type Hall } from '@/lib/api/halls'
import { HallReservationsCalendar } from '@/components/halls/hall-reservations-calendar'
import { DetailHero } from '@/components/shared/DetailHero'
import Link from 'next/link'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function HallDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [hall, setHall] = useState<Hall | null>(null)
  const [loading, setLoading] = useState(true)

  const loadHall = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getHallById(params.id as string)
      setHall(data)
    } catch (error: any) {
      console.error('Error loading hall:', error)
      toast.error('Nie udało się załadować sali')
      router.push('/dashboard/halls')
    } finally {
      setLoading(false)
    }
  }, [params.id, toast, router])

  useEffect(() => {
    loadHall()
  }, [loadHall])

  const handleCreateReservation = () => {
    router.push(`/dashboard/reservations/new?hallId=${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie...</p>
        </div>
      </div>
    )
  }

  if (!hall) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Breadcrumb />
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Premium Hero Section */}
        <DetailHero
          gradient="from-[#1e3a5f] via-[#2a4a70] to-[#1e3a5f]"
          backHref="/dashboard/halls"
          backLabel="Powrót do listy"
          icon={Building2}
          title={hall.name}
          subtitle="Szczegóły sali weselnej"
          badges={
            <>
              {hall.isActive ? (
                <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aktywna
                </Badge>
              ) : (
                <Badge className="bg-red-500/80 backdrop-blur-sm border-red-400/30 text-white">
                  Nieaktywna
                </Badge>
              )}
              <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                <Users className="h-3 w-3 mr-1" />
                Pojemność: {hall.capacity} osób
              </Badge>
              {hall.allowMultipleBookings ? (
                <Badge className="bg-violet-400/30 backdrop-blur-sm border-violet-300/30 text-white">
                  <UsersRound className="h-3 w-3 mr-1" />
                  Wiele rezerwacji
                </Badge>
              ) : (
                <Badge className="bg-blue-400/30 backdrop-blur-sm border-blue-300/30 text-white">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Wyłączność
                </Badge>
              )}
            </>
          }
          actions={
            <Link href={`/dashboard/halls/${hall.id}/edit`}>
              <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90 shadow-xl">
                <Edit className="mr-2 h-5 w-5" />
                Edytuj Salę
              </Button>
            </Link>
          }
        />

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Description */}
          {hall.description && (
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-neutral-800/5 via-slate-700/5 to-neutral-800/5 dark:from-neutral-800/10 dark:via-slate-700/10 dark:to-neutral-800/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Opis</h2>
                </div>
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed">{hall.description}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Amenities */}
          {hall.amenities && hall.amenities.length > 0 && (
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-neutral-800/5 via-slate-700/5 to-neutral-800/5 dark:from-neutral-800/10 dark:via-slate-700/10 dark:to-neutral-800/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Udogodnienia</h2>
                </div>
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {hall.amenities.map((amenity, idx) => (
                      <Badge
                        key={idx}
                        className="text-sm py-2 px-3 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Calendar Section */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#1e3a5f] via-[#2a4a70] to-[#1e3a5f] p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Kalendarz Rezerwacji</h2>
                <p className="text-white/90">
                  {hall.allowMultipleBookings
                    ? `Tryb wielu rezerwacji — pojemność ${hall.capacity} osób`
                    : 'Zobacz dostępne terminy i rezerwacje'}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-8">
            <HallReservationsCalendar
              hallId={hall.id}
              hallName={hall.name}
              hallCapacity={hall.capacity}
              allowMultipleBookings={hall.allowMultipleBookings}
              onCreateReservation={handleCreateReservation}
            />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Pojemność</div>
                  <div className="text-2xl font-bold">{hall.capacity} osób</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Status</div>
                  <div className="text-2xl font-bold">{hall.isActive ? 'Aktywna' : 'Nieaktywna'}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* #165: Booking mode stat card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg">
                  {hall.allowMultipleBookings
                    ? <UsersRound className="h-6 w-6 text-white" />
                    : <UserCheck className="h-6 w-6 text-white" />}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Tryb rezerwacji</div>
                  <div className="text-2xl font-bold">
                    {hall.allowMultipleBookings ? 'Wiele' : 'Wyłączność'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

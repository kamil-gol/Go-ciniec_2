'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Calendar, Users, Sparkles, CheckCircle2, Building2, Clock, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getHallById, type Hall } from '@/lib/api/halls'
import { HallReservationsCalendar } from '@/components/halls/hall-reservations-calendar'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function HallDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [hall, setHall] = useState<Hall | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHall()
  }, [params.id])

  const loadHall = async () => {
    try {
      setLoading(true)
      const data = await getHallById(params.id as string)
      setHall(data)
    } catch (error: any) {
      console.error('Error loading hall:', error)
      toast({
        title: 'B\u0142\u0105d',
        description: 'Nie uda\u0142o si\u0119 za\u0142adowa\u0107 sali',
        variant: 'destructive',
      })
      router.push('/dashboard/halls')
    } finally {
      setLoading(false)
    }
  }

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
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-6">
            {/* Back Button */}
            <Link href="/dashboard/halls">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powr&#243;t do listy
              </Button>
            </Link>

            {/* Title Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">{hall.name}</h1>
                    <p className="text-white/90 text-lg mt-1">Szczeg&#243;&#322;y sali weselnej</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                    Pojemno&#347;&#263;: {hall.capacity} os&#243;b
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link href={`/dashboard/halls/${hall.id}/edit`}>
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90 shadow-xl">
                    <Edit className="mr-2 h-5 w-5" />
                    Edytuj Sal&#281;
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Description */}
          {hall.description && (
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  Opis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{hall.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          {hall.amenities && hall.amenities.length > 0 && (
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  Udogodnienia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {hall.amenities.map((amenity, idx) => (
                    <Badge 
                      key={idx}
                      variant="outline"
                      className="text-sm py-2 px-3 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50"
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Calendar Section */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Kalendarz Rezerwacji</h2>
                <p className="text-white/90">Zobacz dost&#281;pne terminy i wielokrotne rezerwacje dziennie</p>
              </div>
            </div>
          </div>
          <CardContent className="p-8">
            <HallReservationsCalendar 
              hallId={hall.id} 
              hallName={hall.name}
              onCreateReservation={handleCreateReservation}
            />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Pojemno&#347;&#263;</div>
                  <div className="text-2xl font-bold">{hall.capacity} os&#243;b</div>
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
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, FileText, Theater, CheckCircle2, Clock, Power, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  getEventTypeById,
  updateEventType,
  type EventTypeWithCounts,
} from '@/lib/api/event-types-api'
import { EventTypeFormDialog } from '@/components/event-types/event-type-form-dialog'
import { EventTypeDeleteDialog } from '@/components/event-types/event-type-delete-dialog'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function EventTypeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [eventType, setEventType] = useState<EventTypeWithCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    loadEventType()
  }, [params.id])

  const loadEventType = async () => {
    try {
      setLoading(true)
      const data = await getEventTypeById(params.id as string)
      setEventType(data)
    } catch (error: any) {
      console.error('Error loading event type:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować typu wydarzenia',
        variant: 'destructive',
      })
      router.push('/dashboard/event-types')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (checked: boolean) => {
    if (!eventType) return
    try {
      setToggling(true)
      await updateEventType(eventType.id, { isActive: checked })
      toast({
        title: checked ? 'Aktywowany' : 'Dezaktywowany',
        description: `Typ "${eventType.name}" ${checked ? 'jest teraz aktywny' : 'został dezaktywowany'}`,
      })
      loadEventType()
    } catch (error: any) {
      toast({ title: 'Błąd', description: 'Nie udało się zmienić statusu', variant: 'destructive' })
    } finally {
      setToggling(false)
    }
  }

  const handleDeleteSuccess = () => {
    router.push('/dashboard/event-types')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie...</p>
        </div>
      </div>
    )
  }

  if (!eventType) return null

  const color = eventType.color || '#9CA3AF'
  const reservationCount = eventType._count.reservations
  const templateCount = eventType._count.menuTemplates
  const createdDate = new Date(eventType.createdAt).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const updatedDate = new Date(eventType.updatedAt).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-fuchsia-500 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />

          <div className="relative z-10 space-y-6">
            {/* Back */}
            <Link href="/dashboard/event-types">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót do listy
              </Button>
            </Link>

            {/* Title + Actions */}
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Theater className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-4xl font-bold">{eventType.name}</h1>
                      <div
                        className="h-6 w-6 rounded-full border-2 border-white/50 shadow-lg"
                        style={{ backgroundColor: color }}
                        title={`Kolor: ${color}`}
                      />
                    </div>
                    {eventType.description && (
                      <p className="text-white/80 text-lg mt-1">{eventType.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {eventType.isActive ? (
                    <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aktywny
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/80 backdrop-blur-sm border-red-400/30 text-white">
                      Nieaktywny
                    </Badge>
                  )}
                  <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                    <Calendar className="h-3 w-3 mr-1" />
                    {reservationCount} {reservationCount === 1 ? 'rezerwacja' : 'rezerwacji'}
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                    <FileText className="h-3 w-3 mr-1" />
                    {templateCount} {templateCount === 1 ? 'szablon' : 'szablonów'} menu
                  </Badge>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:bg-white/20 border border-white/30"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Usuń
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-fuchsia-600 hover:bg-white/90 shadow-xl"
                  onClick={() => setFormOpen(true)}
                >
                  <Edit className="mr-2 h-5 w-5" />
                  Edytuj
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-lg">
                  <Theater className="h-5 w-5 text-white" />
                </div>
                Informacje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground">Nazwa</span>
                  <span className="font-semibold">{eventType.name}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground">Opis</span>
                  <span className="font-medium text-right max-w-[60%] text-sm">{eventType.description || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground">Kolor</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-sm text-muted-foreground">{eventType.color || 'Brak'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-3">
                    <Badge variant={eventType.isActive ? 'default' : 'warning'}>
                      {eventType.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </Badge>
                    <Switch
                      checked={eventType.isActive}
                      onCheckedChange={handleToggleActive}
                      disabled={toggling}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground">Utworzony</span>
                  <span className="font-medium text-sm">{createdDate}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground">Aktualizacja</span>
                  <span className="font-medium text-sm">{updatedDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relations Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Powiązania
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reservations */}
              <div className="rounded-xl bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-100 dark:border-violet-900/30 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold">Rezerwacje</span>
                  </div>
                  <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">{reservationCount}</span>
                </div>
                {reservationCount > 0 ? (
                  <Link href={`/dashboard/reservations?eventType=${eventType.id}`}>
                    <Button variant="outline" size="sm" className="w-full border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950/50">
                      Zobacz rezerwacje
                    </Button>
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Brak powiązanych rezerwacji</p>
                )}
              </div>

              {/* Menu Templates */}
              <div className="rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-100 dark:border-amber-900/30 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold">Szablony menu</span>
                  </div>
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{templateCount}</span>
                </div>
                {templateCount > 0 ? (
                  <Link href={`/dashboard/menu?eventType=${eventType.id}`}>
                    <Button variant="outline" size="sm" className="w-full border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50">
                      Zobacz szablony
                    </Button>
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Brak powiązanych szablonów</p>
                )}
              </div>

              {reservationCount === 0 && templateCount === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Ten typ nie ma jeszcze żadnych powiązań.
                    <br />
                    Zostanie użyty przy tworzeniu rezerwacji lub szablonów menu.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <EventTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        eventType={eventType}
        onSuccess={loadEventType}
      />

      <EventTypeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        eventType={eventType}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}

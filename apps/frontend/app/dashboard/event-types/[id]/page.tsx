'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, FileText, Theater, CheckCircle2, Clock, Power } from 'lucide-react'
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

  // Dialog states
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
        <div
          className="relative overflow-hidden rounded-2xl p-8 text-white shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}CC, ${color}99)`,
          }}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />

          <div className="relative z-10 space-y-6">
            {/* Back */}
            <Link href="/dashboard/event-types">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót do listy
              </Button>
            </Link>

            {/* Title */}
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Theater className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">{eventType.name}</h1>
                    {eventType.description && (
                      <p className="text-white/90 text-lg mt-1">{eventType.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
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

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Usuń
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-neutral-800 hover:bg-white/90 shadow-xl"
                  onClick={() => setFormOpen(true)}
                >
                  <Edit className="mr-2 h-5 w-5" />
                  Edytuj
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Rezerwacje</div>
                  <div className="text-2xl font-bold">{reservationCount}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Szablony menu</div>
                  <div className="text-2xl font-bold">{templateCount}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                  <Power className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Status</div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{eventType.isActive ? 'Aktywny' : 'Nieaktywny'}</span>
                    <Switch
                      checked={eventType.isActive}
                      onCheckedChange={handleToggleActive}
                      disabled={toggling}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Utworzony</div>
                  <div className="text-lg font-bold">{createdDate}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: color }}>
                  <Theater className="h-5 w-5 text-white" />
                </div>
                Informacje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm text-muted-foreground">Nazwa</span>
                <span className="font-medium">{eventType.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm text-muted-foreground">Opis</span>
                <span className="font-medium text-right max-w-[60%]">{eventType.description || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm text-muted-foreground">Kolor</span>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: color }} />
                  <span className="font-mono text-sm">{eventType.color || 'Brak'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={eventType.isActive ? 'default' : 'secondary'}>
                  {eventType.isActive ? 'Aktywny' : 'Nieaktywny'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Ostatnia aktualizacja</span>
                <span className="font-medium">{updatedDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Relations */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Powiązania
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-neutral-100 dark:border-neutral-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-500" />
                    <span className="font-medium">Rezerwacje</span>
                  </div>
                  <span className="text-2xl font-bold">{reservationCount}</span>
                </div>
                {reservationCount > 0 && (
                  <Link href={`/dashboard/reservations?eventType=${eventType.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Zobacz rezerwacje
                    </Button>
                  </Link>
                )}
              </div>

              <div className="rounded-lg border border-neutral-100 dark:border-neutral-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Szablony menu</span>
                  </div>
                  <span className="text-2xl font-bold">{templateCount}</span>
                </div>
                {templateCount > 0 && (
                  <Link href={`/dashboard/menu?eventType=${eventType.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Zobacz szablony
                    </Button>
                  </Link>
                )}
              </div>

              {reservationCount === 0 && templateCount === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Ten typ nie ma jeszcze żadnych powiązań
                </p>
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

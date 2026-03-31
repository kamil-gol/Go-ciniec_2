'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Edit, Trash2, Calendar, FileText, Theater, CheckCircle2, Clock, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { DetailHero } from '@/components/shared/DetailHero'
import { moduleAccents } from '@/lib/design-tokens'
import { Switch } from '@/components/ui/switch'
import {
  getEventTypeById,
  updateEventType,
  type EventTypeWithCounts,
} from '@/lib/api/event-types-api'
import { EventTypeFormDialog } from '@/components/event-types/event-type-form-dialog'
import { EventTypeDeleteDialog } from '@/components/event-types/event-type-delete-dialog'
import Link from 'next/link'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function EventTypeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [eventType, setEventType] = useState<EventTypeWithCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const loadEventType = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getEventTypeById(params.id as string)
      setEventType(data)
    } catch {
      toast.error('Nie udało się załadować typu wydarzenia')
      router.push('/dashboard/event-types')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    loadEventType()
  }, [loadEventType])

  const handleToggleActive = async (checked: boolean) => {
    if (!eventType) return
    try {
      setToggling(true)
      await updateEventType(eventType.id, { isActive: checked })
      toast.success(`Typ "${eventType.name}" ${checked ? 'jest teraz aktywny' : 'został dezaktywowany'}`)
      loadEventType()
    } catch {
      toast.error('Nie udało się zmienić statusu')
    } finally {
      setToggling(false)
    }
  }

  const handleDeleteSuccess = () => {
    router.push('/dashboard/event-types')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <LoadingState message="Wczytywanie typu wydarzenia..." />
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

  const effectiveStandardHours = eventType.standardHours ?? 6
  const effectiveExtraHourRate = eventType.extraHourRate ?? 500

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Breadcrumb />
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Hero */}
        <DetailHero
          gradient={moduleAccents.eventTypes.gradient}
          backHref="/dashboard/event-types"
          backLabel="Powrót do listy"
          icon={Theater}
          title={eventType.name}
          subtitle={eventType.description || undefined}
          badges={
            <>
              <div
                className="h-6 w-6 rounded-full border-2 border-white/50 shadow-lg"
                style={{ backgroundColor: color }}
                role="img"
                aria-label={`Kolor typu wydarzenia: ${color}`}
                title={`Kolor: ${color}`}
              />
              <span className="text-sm font-mono text-white/70">{color}</span>
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
            </>
          }
          actions={
            <>
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
            </>
          }
        />

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info Card */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-neutral-800/5 via-slate-700/5 to-neutral-800/5 dark:from-neutral-800/10 dark:via-slate-700/10 dark:to-neutral-800/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-lg shadow-lg">
                  <Theater className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold">Informacje</h2>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nazwa</span>
                  <span className="font-semibold">{eventType.name}</span>
                </div>
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Opis</span>
                  <span className="font-medium text-right max-w-[60%] text-sm">{eventType.description || '\u2014'}</span>
                </div>
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Kolor</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700"
                      style={{ backgroundColor: color }}
                      role="img"
                      aria-label={`Kolor typu wydarzenia: ${color}`}
                    />
                    <span className="font-mono text-sm text-muted-foreground">{eventType.color || 'Brak'}</span>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-3">
                    <Badge variant={eventType.isActive ? 'default' : 'secondary'}>
                      {eventType.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </Badge>
                    <Switch
                      checked={eventType.isActive}
                      onCheckedChange={handleToggleActive}
                      disabled={toggling}
                    />
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Utworzony</span>
                  <span className="font-medium text-sm">{createdDate}</span>
                </div>
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aktualizacja</span>
                  <span className="font-medium text-sm">{updatedDate}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing / Extra Hours Card */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-neutral-800/5 via-slate-700/5 to-neutral-800/5 dark:from-neutral-800/10 dark:via-slate-700/10 dark:to-neutral-800/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                  <Timer className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold">Czas &amp; dodatkowe godziny</h2>
              </div>
              <div className="space-y-4">
                {/* Standard hours */}
                <div className="rounded-xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-100 dark:border-blue-900/30 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold">Godziny w cenie</span>
                    </div>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{effectiveStandardHours}h</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ilość godzin wliczonych w cenę podstawową rezerwacji
                  </p>
                </div>

                {/* Extra hour rate */}
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-100 dark:border-emerald-900/30 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                        <Timer className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold">Stawka za dodatkową godzinę</span>
                    </div>
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{effectiveExtraHourRate} zł</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Koszt każdej godziny powyżej {effectiveStandardHours}h wliczonych w cenę
                  </p>
                </div>

                {/* Example calculation */}
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Przykład kalkulacji</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wydarzenie {effectiveStandardHours + 2}h</span>
                      <span className="font-medium">2 dodatkowe godziny</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dopłata</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">+{effectiveExtraHourRate * 2} zł</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Relations Card */}
          <Card className="border-0 shadow-xl overflow-hidden md:col-span-2">
            <div className="bg-gradient-to-br from-neutral-800/5 via-slate-700/5 to-neutral-800/5 dark:from-neutral-800/10 dark:via-slate-700/10 dark:to-neutral-800/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold">Powiązania</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {reservationCount === 0 && templateCount === 0 && (
                <div className="text-center py-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Ten typ nie ma jeszcze żadnych powiązań.
                    <br />
                    Zostanie użyty przy tworzeniu rezerwacji lub szablonów menu.
                  </p>
                </div>
              )}
            </div>
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

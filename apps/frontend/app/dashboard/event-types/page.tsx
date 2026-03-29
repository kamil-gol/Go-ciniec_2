'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Theater, Calendar, FileText, Eye, EyeOff, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState } from '@/components/shared'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'
import { getEventTypes, getEventTypeStats, type EventType, type EventTypeStats } from '@/lib/api/event-types-api'
import { EventTypeCard } from '@/components/event-types/event-type-card'
import { EventTypeFormDialog } from '@/components/event-types/event-type-form-dialog'
import { EventTypeDeleteDialog } from '@/components/event-types/event-type-delete-dialog'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [stats, setStats] = useState<EventTypeStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const accent = moduleAccents.eventTypes

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [editingType, setEditingType] = useState<EventType | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingType, setDeletingType] = useState<EventType | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [typesData, statsData] = await Promise.all([
        getEventTypes(!showInactive),
        getEventTypeStats().catch(() => [] as EventTypeStats[]),
      ])
      setEventTypes(typesData)
      setStats(statsData)
    } catch (error: any) {
      console.error('Error loading event types:', error)
      toast.error('Nie udało się załadować typów wydarzeń')
    } finally {
      setLoading(false)
    }
  }, [showInactive, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredTypes = eventTypes.filter(et =>
    et.name.toLowerCase().includes(search.toLowerCase()) ||
    (et.description && et.description.toLowerCase().includes(search.toLowerCase()))
  )

  const getStatsForType = (id: string): EventTypeStats | undefined => {
    return stats.find(s => s.id === id)
  }

  const totalReservations = stats.reduce((sum, s) => sum + s.reservationCount, 0)
  const totalTemplates = stats.reduce((sum, s) => sum + s.menuTemplateCount, 0)
  const activeTypes = eventTypes.filter(et => et.isActive).length

  const handleCreate = () => {
    setEditingType(null)
    setFormOpen(true)
  }

  const handleEdit = (eventType: EventType) => {
    setEditingType(eventType)
    setFormOpen(true)
  }

  const handleDelete = (eventType: EventType) => {
    setDeletingType(eventType)
    setDeleteOpen(true)
  }

  return (
    <PageLayout>
      <Breadcrumb />
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Typy Wydarzeń"
        subtitle="Konfiguruj rodzaje imprez i ich parametry"
        icon={Theater}
        action={
          <Button
            size="lg"
            className="bg-white text-fuchsia-600 hover:bg-white/90 shadow-xl"
            onClick={handleCreate}
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowy Typ
          </Button>
        }
      />

      {/* Stats */}
      <div className={layout.statGrid}>
        <StatCard
          label="Typy wydarzeń"
          value={eventTypes.length}
          subtitle="W systemie"
          icon={Theater}
          iconGradient={statGradients.count}
          delay={0.1}
        />
        <StatCard
          label="Aktywne typy"
          value={activeTypes}
          subtitle="Dostępne do wyboru"
          icon={TrendingUp}
          iconGradient={statGradients.success}
          delay={0.2}
        />
        <StatCard
          label="Rezerwacje"
          value={totalReservations}
          subtitle="Powiązane łącznie"
          icon={Calendar}
          iconGradient={statGradients.count}
          delay={0.3}
        />
        <StatCard
          label="Szablony menu"
          value={totalTemplates}
          subtitle="Przypisane łącznie"
          icon={FileText}
          iconGradient={statGradients.info}
          delay={0.4}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
              <Input
                placeholder="Szukaj typu wydarzenia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowInactive(!showInactive)}
              className={showInactive
                ? `bg-gradient-to-r ${accent.gradient} text-white border-transparent shadow-lg`
                : ''
              }
            >
              {showInactive ? (
                <><EyeOff className="mr-2 h-5 w-5" />Wszystkie Typy</>
              ) : (
                <><Eye className="mr-2 h-5 w-5" />Tylko Aktywne</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Event Types Grid */}
      {loading ? (
        <LoadingState variant="skeleton" rows={6} />
      ) : filteredTypes.length === 0 ? (
        <EmptyState
          icon={Theater}
          title={search ? 'Nie znaleziono typów' : 'Brak typów wydarzeń'}
          description={search
            ? 'Żaden typ wydarzenia nie pasuje do wyszukiwania. Spróbuj użyć innej frazy.'
            : 'Nie masz jeszcze żadnych typów wydarzeń. Dodaj pierwszy typ, aby móc kategoryzować rezerwacje (np. wesele, komunia, chrzciny).'}
          actionLabel={search ? undefined : 'Dodaj Pierwszy Typ'}
          onAction={search ? undefined : handleCreate}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              Znaleziono <span className="font-bold text-neutral-900 dark:text-neutral-100">{filteredTypes.length}</span>{' '}
              {filteredTypes.length === 1 ? 'typ' : filteredTypes.length < 5 ? 'typy' : 'typów'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTypes.map((eventType) => (
              <EventTypeCard
                key={eventType.id}
                eventType={eventType}
                stats={getStatsForType(eventType.id)}
                onUpdate={loadData}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      <EventTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        eventType={editingType}
        onSuccess={loadData}
      />

      <EventTypeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        eventType={deletingType}
        onSuccess={loadData}
      />
    </PageLayout>
  )
}

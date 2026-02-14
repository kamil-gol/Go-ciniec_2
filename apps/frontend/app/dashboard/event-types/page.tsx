'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Theater, Calendar, FileText, Eye, EyeOff, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'
import { getEventTypes, getEventTypeStats, type EventType, type EventTypeStats } from '@/lib/api/event-types-api'
import { EventTypeCard } from '@/components/event-types/event-type-card'

export default function EventTypesPage() {
  const { toast } = useToast()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [stats, setStats] = useState<EventTypeStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const accent = moduleAccents.eventTypes

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
      toast({
        title: 'B\u0142\u0105d',
        description: 'Nie uda\u0142o si\u0119 za\u0142adowa\u0107 typ\u00f3w wydarze\u0144',
        variant: 'destructive',
      })
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

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Typy Wydarze\u0144"
        subtitle="Konfiguruj rodzaje imprez i ich parametry"
        icon={Theater}
        action={
          <Button
            size="lg"
            className="bg-white text-fuchsia-600 hover:bg-white/90 shadow-xl"
            onClick={() => {
              // Phase 4: open create dialog
              toast({ title: 'Wkr\u00f3tce', description: 'Formularz tworzenia typu — Faza 4' })
            }}
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowy Typ
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Typy wydarze\u0144"
          value={eventTypes.length}
          subtitle="W systemie"
          icon={Theater}
          iconGradient="from-fuchsia-500 to-pink-500"
          delay={0.1}
        />
        <StatCard
          label="Aktywne typy"
          value={activeTypes}
          subtitle="Dost\u0119pne do wyboru"
          icon={TrendingUp}
          iconGradient="from-emerald-500 to-teal-500"
          delay={0.2}
        />
        <StatCard
          label="Rezerwacje"
          value={totalReservations}
          subtitle="Powi\u0105zane \u0142\u0105cznie"
          icon={Calendar}
          iconGradient="from-violet-500 to-purple-500"
          delay={0.3}
        />
        <StatCard
          label="Szablony menu"
          value={totalTemplates}
          subtitle="Przypisane \u0142\u0105cznie"
          icon={FileText}
          iconGradient="from-amber-500 to-orange-500"
          delay={0.4}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
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
          title={search ? 'Nie znaleziono typ\u00f3w' : 'Brak typ\u00f3w wydarze\u0144'}
          description={search ? 'Spr\u00f3buj u\u017cy\u0107 innego wyszukiwania' : 'Dodaj pierwszy typ wydarzenia, aby zacz\u0105\u0107'}
          actionLabel={search ? undefined : 'Dodaj Pierwszy Typ'}
          onAction={search ? undefined : () => {
            toast({ title: 'Wkr\u00f3tce', description: 'Formularz tworzenia typu — Faza 4' })
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Znaleziono <span className="font-bold text-neutral-900 dark:text-neutral-100">{filteredTypes.length}</span>{' '}
              {filteredTypes.length === 1 ? 'typ' : filteredTypes.length < 5 ? 'typy' : 'typ\u00f3w'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTypes.map((eventType) => (
              <EventTypeCard
                key={eventType.id}
                eventType={eventType}
                stats={getStatsForType(eventType.id)}
                onUpdate={loadData}
              />
            ))}
          </div>
        </>
      )}
    </PageLayout>
  )
}

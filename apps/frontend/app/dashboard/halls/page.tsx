'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, TrendingUp, Users, Building2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { getHalls, type Hall } from '@/lib/api/halls'
import Link from 'next/link'
import { HallCard } from '@/components/halls/hall-card'
import { useToast } from '@/hooks/use-toast'
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

export default function HallsPage() {
  const { toast } = useToast()
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const accent = moduleAccents.halls

  useEffect(() => {
    loadHalls()
  }, [showInactive])

  const loadHalls = async () => {
    try {
      setLoading(true)
      const data = await getHalls({
        isActive: !showInactive ? true : undefined
      })
      setHalls(data.halls || [])
    } catch (error: any) {
      console.error('Error loading halls:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować sal',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredHalls = halls.filter(hall =>
    hall.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalCapacity = halls.reduce((sum, h) => sum + h.capacity, 0)
  const activeHalls = halls.filter(h => h.isActive).length
  const avgCapacity = halls.length > 0
    ? Math.round(totalCapacity / halls.length)
    : 0

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Zarządzanie Salami"
        subtitle="System rezerwacji sal weselnych Gościniec Rodzinny"
        icon={Building2}
        action={
          <Link href="/dashboard/halls/new">
            <Button size="lg" className="bg-white text-sky-600 hover:bg-white/90 shadow-xl">
              <Plus className="mr-2 h-5 w-5" />
              Dodaj Salę
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Wszystkie sale" value={halls.length} subtitle="W systemie" icon={Building2} iconGradient="from-sky-500 to-blue-500" delay={0.1} />
        <StatCard label="Aktywne sale" value={activeHalls} subtitle="Dostępne do rezerwacji" icon={TrendingUp} iconGradient="from-emerald-500 to-teal-500" delay={0.2} />
        <StatCard label="Całk. pojemność" value={totalCapacity} subtitle="Miejsc łącznie" icon={Users} iconGradient="from-violet-500 to-purple-500" delay={0.3} />
        <StatCard label="Śr. pojemność" value={`${avgCapacity} osób`} subtitle="Średnio na salę" icon={Users} iconGradient="from-amber-500 to-orange-500" delay={0.4} />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
              <Input
                placeholder="Szukaj sali po nazwie..."
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
                <><EyeOff className="mr-2 h-5 w-5" />Wszystkie Sale</>
              ) : (
                <><Eye className="mr-2 h-5 w-5" />Tylko Aktywne</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Halls Grid */}
      {loading ? (
        <LoadingState variant="skeleton" rows={6} />
      ) : filteredHalls.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? 'Nie znaleziono sal' : 'Brak sal'}
          description={search ? 'Spróbuj użyć innego wyszukiwania' : 'Dodaj pierwszą salę, aby zacząć'}
          actionLabel={search ? undefined : 'Dodaj Pierwszą Salę'}
          onAction={search ? undefined : () => window.location.href = '/dashboard/halls/new'}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Znaleziono <span className="font-bold text-neutral-900 dark:text-neutral-100">{filteredHalls.length}</span> {filteredHalls.length === 1 ? 'salę' : 'sal'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHalls.map((hall) => (
              <HallCard key={hall.id} hall={hall} onUpdate={loadHalls} />
            ))}
          </div>
        </>
      )}
    </PageLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, TrendingUp, Users, Building2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { getHalls, type Hall } from '@/lib/api/halls'
import Link from 'next/link'
import { HallCard } from '@/components/halls/hall-card'
import { useToast } from '@/hooks/use-toast'

export default function HallsPage() {
  const { toast } = useToast()
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

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
  const avgPrice = halls.length > 0 
    ? Math.round(halls.reduce((sum, h) => sum + Number(h.pricePerPerson), 0) / halls.length) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Premium Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">Zarządzanie Salami</h1>
                </div>
                <p className="text-white/90 text-lg">
                  System rezerwacji sal weselnych Gościniec Rodzinny
                </p>
              </div>
              <Link href="/dashboard/halls/new">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90 shadow-xl">
                  <Plus className="mr-2 h-5 w-5" />
                  Dodaj Salę
                </Button>
              </Link>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Premium Stats Cards with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Halls */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {halls.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Wszystkie sale</div>
            </div>
          </Card>

          {/* Active Halls */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {activeHalls}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Aktywne sale</div>
            </div>
          </Card>

          {/* Total Capacity */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {totalCapacity}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Całkowita pojemność</div>
            </div>
          </Card>

          {/* Average Price */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {avgPrice} zł
              </div>
              <div className="text-sm text-muted-foreground font-medium">Średnia cena/os.</div>
            </div>
          </Card>
        </div>

        {/* Enhanced Filters Card */}
        <Card className="border-0 shadow-lg">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Szukaj sali po nazwie..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
                  />
                </div>
              </div>
              <Button
                size="lg"
                variant={showInactive ? 'default' : 'outline'}
                onClick={() => setShowInactive(!showInactive)}
                className={showInactive ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : ''}
              >
                {showInactive ? '🔍 Wszystkie' : '✨ Tylko aktywne'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Halls Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-96 animate-pulse border-0 shadow-lg">
                <div className="h-full bg-gradient-to-br from-muted/50 to-muted rounded-lg" />
              </Card>
            ))}
          </div>
        ) : filteredHalls.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <div className="p-16 text-center">
              <div className="mb-6 inline-flex p-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full">
                <Building2 className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-muted-foreground mb-6">
                {search ? (
                  <>
                    <p className="text-2xl font-bold mb-3">Nie znaleziono sal</p>
                    <p className="text-lg">Spróbuj użyć innego wyszukiwania</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold mb-3">Brak sal</p>
                    <p className="text-lg">Dodaj pierwszą salę, aby zacząć</p>
                  </>
                )}
              </div>
              {!search && (
                <Link href="/dashboard/halls/new">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xl">
                    <Plus className="mr-2 h-5 w-5" />
                    Dodaj Pierwszą Salę
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground font-medium">
                Znaleziono <span className="font-bold text-foreground">{filteredHalls.length}</span> {filteredHalls.length === 1 ? 'salę' : 'sal'}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHalls.map((hall) => (
                <HallCard key={hall.id} hall={hall} onUpdate={loadHalls} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

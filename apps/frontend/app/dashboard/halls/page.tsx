'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
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

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Sale</h1>
          <p className="text-muted-foreground">
            Zarządzaj salami weselny mi Gosińca
          </p>
        </div>
        <Link href="/dashboard/halls/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj Salę
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{halls.length}</div>
          <div className="text-sm text-muted-foreground">Wszystkie sale</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {halls.filter(h => h.isActive).length}
          </div>
          <div className="text-sm text-muted-foreground">Aktywne</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {halls.reduce((sum, h) => sum + h.capacity, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Całkowita pojemność</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Szukaj sali po nazwie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant={showInactive ? 'default' : 'outline'}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? 'Wszystkie' : 'Tylko aktywne'}
          </Button>
        </div>
      </Card>

      {/* Halls Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-80 animate-pulse">
              <div className="h-full bg-muted rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filteredHalls.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground mb-4">
            {search ? (
              <>
                <p className="text-lg font-semibold mb-2">Nie znaleziono sal</p>
                <p>Spróbuj użyć innego wyszukiwania</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold mb-2">Brak sal</p>
                <p>Dodaj pierwszą salę, aby zacząć</p>
              </>
            )}
          </div>
          {!search && (
            <Link href="/dashboard/halls/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Dodaj Pierwszą Salę
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Znaleziono {filteredHalls.length} {filteredHalls.length === 1 ? 'salę' : 'sal'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHalls.map((hall) => (
              <HallCard key={hall.id} hall={hall} onUpdate={loadHalls} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

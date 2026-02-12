'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, CalendarDays, TrendingUp, Info, RefreshCw, AlertTriangle } from 'lucide-react'
import { queueApi } from '@/lib/api/queue'
import { clientsApi } from '@/lib/api/clients'
import { QueueItem, Client, QueueStats } from '@/types'
import { DraggableQueueList } from '@/components/queue/draggable-queue-list'
import { AddToQueueForm } from '@/components/queue/add-to-queue-form'
import { EditQueueForm } from '@/components/queue/edit-queue-form'
import { PromoteModal } from '@/components/queue/promote-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

export default function QueuePage() {
  const [queues, setQueues] = useState<QueueItem[]>([])
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null)
  const [editingQueueItem, setEditingQueueItem] = useState<QueueItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [showRebuildDialog, setShowRebuildDialog] = useState(false)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [rebuildConfirmed, setRebuildConfirmed] = useState(false)

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [queuesData, statsData, clientsData] = await Promise.all([
        queueApi.getAll(),
        queueApi.getStats(),
        clientsApi.getAll(),
      ])
      setQueues(queuesData)
      setStats(statsData)
      setClients(clientsData)
    } catch (error) {
      console.error('Failed to load queue data:', error)
      toast.error('Nie udało się załadować danych kolejki')
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const clientsData = await clientsApi.getAll()
      setClients(clientsData)
      toast.success('Lista klientów zaktualizowana')
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  // Group queues by date
  const queuesByDate = queues.reduce((acc, item) => {
    const date = format(parseISO(item.queueDate), 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {} as Record<string, QueueItem[]>)

  // Sort each date group by position
  Object.keys(queuesByDate).forEach((date) => {
    queuesByDate[date].sort((a, b) => a.position - b.position)
  })

  const dates = Object.keys(queuesByDate).sort()

  // Add to queue
  const handleAddToQueue = async (data: any) => {
    try {
      await queueApi.addToQueue(data)
      toast.success('Dodano do kolejki')
      setShowAddForm(false)
      await loadData()
    } catch (error) {
      console.error('Failed to add to queue:', error)
      toast.error('Nie udało się dodać do kolejki')
    }
  }

  // Edit queue item
  const handleEditQueue = async (id: string, data: any) => {
    try {
      await queueApi.updateQueueReservation(id, data)
      toast.success('Zaktualizowano wpis w kolejce')
      setEditingQueueItem(null)
      await loadData()
    } catch (error) {
      console.error('Failed to update queue:', error)
      toast.error('Nie udało się zaktualizować wpisu')
    }
  }

  // Handle drag and drop reorder
  const handleReorder = async (reorderedItems: QueueItem[]) => {
    // Optimistically update UI
    if (selectedDate === 'all') {
      setQueues(reorderedItems)
    } else {
      // Update specific date group
      const updatedQueues = queues.map((item) => {
        const updated = reorderedItems.find((ri) => ri.id === item.id)
        return updated || item
      })
      setQueues(updatedQueues)
    }

    try {
      // Call backend to update positions
      // We need to call moveToPosition for each item that changed
      for (let i = 0; i < reorderedItems.length; i++) {
        const item = reorderedItems[i]
        const originalItem = queues.find((q) => q.id === item.id)
        
        if (originalItem && originalItem.position !== item.position) {
          await queueApi.moveToPosition(item.id, item.position)
        }
      }
      
      toast.success('Kolejność zaktualizowana')
      await loadData() // Refresh to ensure consistency
    } catch (error) {
      console.error('Failed to reorder:', error)
      toast.error('Nie udało się zmienić kolejności')
      // Revert will happen in DraggableQueueList component
      throw error
    }
  }

  // Rebuild positions (backend will check admin role)
  const handleRebuildPositions = async () => {
    if (!rebuildConfirmed) {
      toast.error('Musisz potwierdzić zrozumienie konsekwencji')
      return
    }

    setIsRebuilding(true)
    try {
      const result = await queueApi.rebuildPositions()
      toast.success(
        `Ponumerowano ${result.updatedCount} rezerwacji w ${result.dateCount} datach`
      )
      setShowRebuildDialog(false)
      setRebuildConfirmed(false)
      await loadData()
    } catch (error: any) {
      console.error('Failed to rebuild positions:', error)
      // If 403, user is not admin
      if (error.response?.status === 403) {
        toast.error('Brak uprawnień. Tylko administratorzy mogą przebudować numerację.')
      } else {
        toast.error('Nie udało się przebudować numeracji')
      }
    } finally {
      setIsRebuilding(false)
    }
  }

  // Promote to reservation
  const handlePromote = async (reservationId: string, data: any) => {
    try {
      await queueApi.promoteReservation(reservationId, data)
      toast.success('Awansowano do rezerwacji')
      await loadData()
    } catch (error) {
      console.error('Failed to promote:', error)
      toast.error('Nie udało się awansować do rezerwacji')
    }
  }

  const filteredQueues = selectedDate === 'all' ? queues : queuesByDate[selectedDate] || []
  const showPromoteButton = selectedDate !== 'all'
  const isDragDropDisabled = selectedDate === 'all'

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Wczytywanie...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kolejka rezerwacji</h1>
          <p className="text-muted-foreground">
            Zarządzaj kolejką oczekujących klientów
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowRebuildDialog(true)}
            disabled={queues.length === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Przebuduj numerację
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj do kolejki
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">W kolejce</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQueued}</div>
              <p className="text-xs text-muted-foreground">
                {stats.queuesByDate.length} różnych dat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Najbliższa data</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.oldestQueueDate
                  ? format(parseISO(stats.oldestQueueDate), 'd MMM yyyy', { locale: pl })
                  : 'Brak'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ręczne kolejności</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.manualOrderCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Dodaj do kolejki</CardTitle>
            <CardDescription>
              Dodaj klienta do kolejki oczekujących na dostępny termin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddToQueueForm
              clients={clients}
              onSubmit={handleAddToQueue}
              onCancel={() => setShowAddForm(false)}
              onClientAdded={loadClients}
            />
          </CardContent>
        </Card>
      )}

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Kolejka</CardTitle>
          <CardDescription>
            {selectedDate === 'all' 
              ? 'Wybierz konkretną datę aby zarządzać kolejnością i awansować klientów do rezerwacji'
              : 'Przeciągnij karty aby zmienić kolejność lub kliknij "Awansuj" aby utworzyć rezerwację'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDate} onValueChange={setSelectedDate}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Wszystkie ({queues.length})</TabsTrigger>
              {dates.map((date) => (
                <TabsTrigger key={date} value={date}>
                  {format(parseISO(date), 'd MMM', { locale: pl })} ({
                    queuesByDate[date].length
                  })
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Info when drag & drop is disabled */}
            {isDragDropDisabled && queues.length > 0 && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Zmiana kolejności dostępna tylko w widoku pojedynczej daty. Wybierz konkretną datę aby przeciągać karty.
                </AlertDescription>
              </Alert>
            )}

            <DraggableQueueList
              items={filteredQueues}
              onReorder={handleReorder}
              onPromote={showPromoteButton ? (id) => {
                const item = filteredQueues.find(q => q.id === id)
                if (item) setSelectedQueueItem(item)
              } : undefined}
              onEdit={(id) => {
                const item = filteredQueues.find(q => q.id === id)
                if (item) setEditingQueueItem(item)
              }}
              showPromoteButton={showPromoteButton}
              disabled={isDragDropDisabled}
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Rebuild Dialog with Admin Warning */}
      <Dialog open={showRebuildDialog} onOpenChange={(open) => {
        setShowRebuildDialog(open)
        if (!open) setRebuildConfirmed(false)
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-6 w-6" />
              Przebuduj numerację kolejki
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 font-medium">
                UWAGA: Ta operacja jest nieodwracalna i spowoduje utratę wszystkich ręcznych modyfikacji kolejności!
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm font-medium">Co zostanie zrobione:</p>
              <ul className="text-sm list-disc list-inside space-y-1.5 ml-2 text-muted-foreground">
                <li>Wszystkie rezerwacje w kolejce zostaną ponumerowane od nowa</li>
                <li>Każda data będzie miała numerację od 1</li>
                <li>Sortowanie według daty dodania (starsze rezerwacje pierwsze)</li>
                <li><strong className="text-orange-600">Wszystkie ręczne ustawienia kolejności zostaną usunięte</strong></li>
              </ul>
            </div>

            {stats && stats.manualOrderCount > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  <strong>Uwaga!</strong> Obecnie masz {stats.manualOrderCount} {stats.manualOrderCount === 1 ? 'rezerwację' : 'rezerwacji'} z ręcznie ustawioną kolejnością. Wszystkie te zmiany zostaną utracone!
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Uwaga:</strong> Ta funkcja jest dostępna tylko dla administratorów. Jeśli nie masz uprawnień, operacja zostanie odrzucona.
              </AlertDescription>
            </Alert>

            <div className="border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="rebuild-confirm"
                  checked={rebuildConfirmed}
                  onCheckedChange={(checked) => setRebuildConfirmed(checked === true)}
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor="rebuild-confirm"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Rozumiem konsekwencje i akceptuję ryzyko utraty ręcznych modyfikacji kolejności
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Potwierdzam, że jestem świadomy nieodwracalności tej operacji
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRebuildDialog(false)
                setRebuildConfirmed(false)
              }}
              disabled={isRebuilding}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleRebuildPositions}
              disabled={isRebuilding || !rebuildConfirmed}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isRebuilding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Przebudowywanie...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Przebuduj numerację
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingQueueItem} onOpenChange={(open) => !open && setEditingQueueItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edytuj wpis w kolejce</DialogTitle>
          </DialogHeader>
          {editingQueueItem && (
            <EditQueueForm
              queueItem={editingQueueItem}
              clients={clients}
              onSubmit={handleEditQueue}
              onCancel={() => setEditingQueueItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Promote Modal */}
      <PromoteModal
        open={!!selectedQueueItem}
        onClose={() => setSelectedQueueItem(null)}
        queueItem={selectedQueueItem}
        onPromote={handlePromote}
      />
    </div>
  )
}

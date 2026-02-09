'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, CalendarDays, TrendingUp, RefreshCw, AlertTriangle, Clock, ListOrdered, Info, ArrowRight } from 'lucide-react'
import { queueApi } from '@/lib/api/queue'
import { clientsApi } from '@/lib/api/clients'
import { QueueItem, Client, QueueStats } from '@/types'
import { DraggableQueueList } from '@/components/queue/draggable-queue-list'
import { AddToQueueForm } from '@/components/queue/add-to-queue-form'
import { EditQueueForm } from '@/components/queue/edit-queue-form'
import { PromoteModal } from '@/components/queue/promote-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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
      setClients(clientsData.data)
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
      setClients(clientsData.data)
      toast.success('Lista klientów zaktualizowana')
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const queuesByDate = queues.reduce((acc, item) => {
    const date = format(parseISO(item.queueDate), 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {} as Record<string, QueueItem[]>)

  Object.keys(queuesByDate).forEach((date) => {
    queuesByDate[date].sort((a, b) => a.position - b.position)
  })

  const dates = Object.keys(queuesByDate).sort()

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

  const handleReorder = async (reorderedItems: QueueItem[]) => {
    if (selectedDate === 'all') {
      toast.error('Zmiana kolejności dostępna tylko w widoku pojedynczej daty')
      throw new Error('Cannot reorder in all dates view')
    }

    const invalidItem = reorderedItems.find(item => !item.position || item.position < 1)
    if (invalidItem) {
      toast.error('Wykryto nieprawiłdową pozycję. Odśwież stronę i spróbuj ponownie.')
      throw new Error('Invalid position in reordered items')
    }

    const updatedQueues = queues.map((item) => {
      const updated = reorderedItems.find((ri) => ri.id === item.id)
      return updated || item
    })
    setQueues(updatedQueues)

    try {
      const updates = reorderedItems.map(item => ({
        id: item.id,
        position: item.position,
      }))
      
      await queueApi.batchUpdatePositions({ updates })
      toast.success('Kolejność zaktualizowana')
      await loadData()
    } catch (error) {
      toast.error('Nie udało się zmienić kolejności')
      throw error
    }
  }

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
      if (error.response?.status === 403) {
        toast.error('Brak uprawnień. Tylko administratorzy mogą przebudować numerację.')
      } else {
        toast.error('Nie udało się przebudować numeracji')
      }
    } finally {
      setIsRebuilding(false)
    }
  }

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie kolejki...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Premium Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Kolejka rezerwacji</h1>
                  <p className="text-white/90 text-lg mt-1">
                    Zarządzaj kolejką oczekujących klientów
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowRebuildDialog(true)}
                  disabled={queues.length === 0}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Przebuduj numerację
                </Button>
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-white text-yellow-600 hover:bg-white/90 shadow-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj do kolejki
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-4">
            {/* Total in Queue */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">W kolejce</p>
                    <p className="text-3xl font-bold">{stats.totalQueued}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.queuesByDate.length} {stats.queuesByDate.length === 1 ? 'data' : 'różnych dat'}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg">
                    <CalendarDays className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Oldest Date */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Najstarsza data</p>
                    <p className="text-2xl font-bold">
                      {stats.oldestQueueDate
                        ? format(parseISO(stats.oldestQueueDate), 'd MMM yyyy', { locale: pl })
                        : 'Brak'}
                    </p>
                    <p className="text-xs text-muted-foreground">Najwcześniejszy termin</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Orders */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Ręczne kolejności</p>
                    <p className="text-3xl font-bold">{stats.manualOrderCount}</p>
                    <p className="text-xs text-muted-foreground">Zmodyfikowanych pozycji</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                    <RefreshCw className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates Count */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Liczba dat</p>
                    <p className="text-3xl font-bold">{stats.queuesByDate.length}</p>
                    <p className="text-xs text-muted-foreground">Różnych terminów</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <ListOrdered className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/30 dark:via-amber-950/30 dark:to-orange-950/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shadow-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Dodaj do kolejki</h2>
                  <p className="text-muted-foreground">Dodaj klienta do kolejki oczekujących na dostępny termin</p>
                </div>
              </div>
              <AddToQueueForm
                clients={clients}
                onSubmit={handleAddToQueue}
                onCancel={() => setShowAddForm(false)}
                onClientAdded={loadClients}
              />
            </div>
          </Card>
        )}

        {/* Queue List */}
        <Card className="border-0 shadow-xl">
          <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/30 dark:via-amber-950/30 dark:to-orange-950/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Kolejka</h2>
                <p className="text-muted-foreground">
                  {selectedDate === 'all' 
                    ? 'Wybierz konkretną datę aby zarządzać kolejnością i awansować klientów'
                    : 'Przeciągnij karty aby zmienić kolejność lub kliknij "Awansuj" aby utworzyć rezerwację'
                  }
                </p>
              </div>
            </div>

            {/* Date Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedDate === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedDate('all')}
                className={selectedDate === 'all' ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg' : ''}
              >
                Wszystkie ({queues.length})
              </Button>
              {dates.map((date) => (
                <Button
                  key={date}
                  variant={selectedDate === date ? 'default' : 'outline'}
                  onClick={() => setSelectedDate(date)}
                  className={selectedDate === date ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg' : ''}
                >
                  {format(parseISO(date), 'd MMM', { locale: pl })} ({queuesByDate[date].length})
                </Button>
              ))}
            </div>

            {/* Info Alert */}
            {isDragDropDisabled && queues.length > 0 && (
              <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-300">
                  Zmiana kolejności dostępna tylko w widoku pojedynczej daty. Wybierz konkretną datę aby przeciągać karty.
                </AlertDescription>
              </Alert>
            )}

            {/* Queue Items */}
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
          </div>
        </Card>
      </div>

      {/* Rebuild Dialog */}
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
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-300 font-medium">
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
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-300 text-sm">
                  <strong>Uwaga!</strong> Obecnie masz {stats.manualOrderCount} {stats.manualOrderCount === 1 ? 'rezerwację' : 'rezerwacji'} z ręcznie ustawioną kolejnością. Wszystkie te zmiany zostaną utracone!
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
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
                  <label htmlFor="rebuild-confirm" className="text-sm font-medium cursor-pointer">
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
              className="bg-orange-600 hover:bg-orange-700 text-white"
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

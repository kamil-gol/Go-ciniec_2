'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, CalendarDays, TrendingUp, Info, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
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
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'

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
    console.log('=== HANDLE REORDER START ===')
    console.log('Selected date:', selectedDate)
    console.log('Reordered items received:', reorderedItems.map(i => ({ id: i.id, position: i.position })))

    // ✨ FIX: Prevent reorder in 'all' view (should be disabled anyway but add safety)
    if (selectedDate === 'all') {
      console.error('BLOCKED: Attempting to reorder in "all" view!')
      toast.error('Zmiana kolejności dostępna tylko w widoku pojedynczej daty')
      throw new Error('Cannot reorder in all dates view')
    }

    // ✨ FIX: Validate that all items have valid positions (> 0)
    const invalidItem = reorderedItems.find(item => !item.position || item.position < 1)
    if (invalidItem) {
      console.error('BLOCKED: Invalid position detected!', invalidItem)
      toast.error('Wykryto nieprawidłową pozycję. Odśwież stronę i spróbuj ponownie.')
      throw new Error('Invalid position in reordered items')
    }

    // Update specific date group
    const updatedQueues = queues.map((item) => {
      const updated = reorderedItems.find((ri) => ri.id === item.id)
      return updated || item
    })
    setQueues(updatedQueues)

    try {
      // Call backend to update positions
      console.log('Calling API for', reorderedItems.length, 'items')
      for (let i = 0; i < reorderedItems.length; i++) {
        const item = reorderedItems[i]
        const originalItem = queues.find((q) => q.id === item.id)
        
        console.log(`Processing item ${i}:`, {
          id: item.id,
          newPosition: item.position,
          originalPosition: originalItem?.position
        })
        
        // ✨ FIX: Additional validation before API call
        if (!item.position || item.position < 1) {
          console.error('SKIPPING: Invalid position for item:', item.id, 'position:', item.position)
          continue
        }
        
        if (originalItem && originalItem.position !== item.position) {
          console.log(`API CALL: moveToPosition(${item.id}, ${item.position})`)
          await queueApi.moveToPosition(item.id, item.position)
        } else {
          console.log(`SKIPPED: No change for item ${item.id}`)
        }
      }
      
      console.log('=== HANDLE REORDER SUCCESS ===')
      toast.success('Kolejność zaktualizowana')
      await loadData()
    } catch (error) {
      console.error('=== HANDLE REORDER ERROR ===')
      console.error(error)
      toast.error('Nie udało się zmienić kolejności')
      throw error
    }
  }

  // Rebuild positions
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent mx-auto mb-4"
            />
            <p className="text-neutral-600 dark:text-neutral-400">Wczytywanie...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 shadow-glow">
                <Clock className="h-6 w-6 text-white" />
              </div>
              Kolejka rezerwacji
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Zarządzaj kolejką oczekujących klientów
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowRebuildDialog(true)}
              disabled={queues.length === 0}
              className="hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Przebuduj numerację
            </Button>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-medium hover:shadow-hard transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Dodaj do kolejki
            </Button>
          </div>
        </motion.div>

        {/* Stats - Premium Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-6 md:grid-cols-3"
          >
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-700 shadow-soft hover:shadow-medium transition-all hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">W kolejce</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
                  <CalendarDays className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.totalQueued}</div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {stats.queuesByDate.length} różnych dat
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-700 shadow-soft hover:shadow-medium transition-all hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Najbliższa data</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900/30 dark:to-success-800/30">
                  <TrendingUp className="h-5 w-5 text-success-600 dark:text-success-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {stats.oldestQueueDate
                    ? format(parseISO(stats.oldestQueueDate), 'd MMM yyyy', { locale: pl })
                    : 'Brak'}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-700 shadow-soft hover:shadow-medium transition-all hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Ręczne kolejności</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning-100 to-warning-200 dark:from-warning-900/30 dark:to-warning-800/30">
                  <RefreshCw className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.manualOrderCount}</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-700 shadow-medium">
              <CardHeader className="border-b border-neutral-200 dark:border-neutral-700">
                <CardTitle className="text-xl font-bold">Dodaj do kolejki</CardTitle>
                <CardDescription>
                  Dodaj klienta do kolejki oczekujących na dostępny termin
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <AddToQueueForm
                  clients={clients}
                  onSubmit={handleAddToQueue}
                  onCancel={() => setShowAddForm(false)}
                  onClientAdded={loadClients}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Queue List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-700 shadow-soft">
            <CardHeader className="border-b border-neutral-200 dark:border-neutral-700">
              <CardTitle className="text-xl font-bold">Kolejka</CardTitle>
              <CardDescription>
                {selectedDate === 'all' 
                  ? 'Wybierz konkretną datę aby zarządzać kolejnością i awansować klientów do rezerwacji'
                  : 'Przeciągnij karty aby zmienić kolejność lub kliknij "Awansuj" aby utworzyć rezerwację'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
        </motion.div>
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
    </DashboardLayout>
  )
}

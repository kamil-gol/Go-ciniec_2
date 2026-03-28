'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, CalendarDays, TrendingUp, RefreshCw, AlertTriangle, Clock, ListOrdered, Info } from 'lucide-react'
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
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState } from '@/components/shared'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'

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
  const accent = moduleAccents.queue

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

  const queuesByDate = queues.reduce((acc, item) => {
    if (!item.queueDate) return acc
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
      toast.error('Wykryto nieprawidłową pozycję. Odśwież stronę i spróbuj ponownie.')
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
      toast.success(`Ponumerowano ${result.updatedCount} rezerwacji w ${result.dateCount} datach`)
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

  const filteredQueues = selectedDate === 'all' ? queues.filter(q => q.queueDate) : queuesByDate[selectedDate] || []
  const showPromoteButton = selectedDate !== 'all'
  const isDragDropDisabled = selectedDate === 'all'

  if (loading) {
    return (
      <PageLayout>
        <LoadingState variant="spinner" message="Wczytywanie kolejki..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Hero */}
      <PageHero
        accent={accent}
        title="Kolejka rezerwacji"
        subtitle="Zarządzaj kolejką oczekujących klientów"
        icon={Clock}
        action={
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowRebuildDialog(true)}
              disabled={queues.length === 0}
              className="bg-white/15 hover:bg-white/25 text-white border-0 text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Przebuduj numerację</span>
              <span className="sm:hidden">Przebuduj</span>
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-white text-amber-600 hover:bg-white/90 shadow-xl text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Dodaj do kolejki</span>
              <span className="sm:hidden">Dodaj</span>
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {stats && (
        <div className={layout.statGrid}>
          <StatCard label="W kolejce" value={stats.totalQueued} subtitle={`${stats.queuesByDate.length} ${stats.queuesByDate.length === 1 ? 'data' : 'różnych dat'}`} icon={CalendarDays} iconGradient={statGradients.alert} delay={0.1} />
          <StatCard label="Najstarsza data" value={stats.oldestQueueDate ? format(parseISO(stats.oldestQueueDate), 'd MMM yyyy', { locale: pl }) : 'Brak'} subtitle="Najwcześniejszy termin" icon={TrendingUp} iconGradient={statGradients.info} delay={0.2} />
          <StatCard label="Ręczne kolejności" value={stats.manualOrderCount} subtitle="Zmodyfikowanych pozycji" icon={RefreshCw} iconGradient={statGradients.count} delay={0.3} />
          <StatCard label="Liczba dat" value={stats.queuesByDate.length} subtitle="Różnych terminów" icon={ListOrdered} iconGradient={statGradients.info} delay={0.4} />
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card className="overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className={`bg-gradient-to-br ${accent.gradientSubtle} p-4 sm:p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg shadow-lg`}>
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dodaj do kolejki</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-300 hidden sm:block">Dodaj klienta do kolejki oczekujących na dostępny termin</p>
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
      <Card>
        <div className={`bg-gradient-to-br ${accent.gradientSubtle} p-4 sm:p-8`}>
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className={`p-2 bg-gradient-to-br ${accent.iconBg} rounded-lg shadow-lg`}>
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Kolejka</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-300 hidden sm:block">
                {selectedDate === 'all'
                  ? 'Wybierz konkretną datę aby zarządzać kolejnością i awansować klientów'
                  : 'Przeciągnij karty aby zmienić kolejność lub kliknij "Awansuj" aby utworzyć rezerwację'
                }
              </p>
            </div>
          </div>


          {/* Date Tabs — horizontal scroll on mobile */}
          <div className="flex flex-nowrap sm:flex-wrap gap-2 mb-6 overflow-x-auto pb-2 sm:pb-0 -mx-1 px-1 scrollbar-thin">
            <Button
              variant={selectedDate === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedDate('all')}
              className={`flex-shrink-0 ${selectedDate === 'all' ? `bg-gradient-to-r ${accent.gradient} text-white shadow-lg` : ''}`}
            >
              Wszystkie ({queues.filter(q => q.queueDate).length})
            </Button>
            {dates.map((date) => (
              <Button
                key={date}
                variant={selectedDate === date ? 'default' : 'outline'}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 ${selectedDate === date ? `bg-gradient-to-r ${accent.gradient} text-white shadow-lg` : ''}`}
              >
                {format(parseISO(date), 'd MMM', { locale: pl })} ({queuesByDate[date].length})
              </Button>
            ))}
          </div>

          {/* Info Alert */}
          {isDragDropDisabled && queues.length > 0 && (
            <Alert className="mb-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
                Zmiana kolejności dostępna tylko w widoku pojedynczej daty. Wybierz konkretną datę aby przeciągać karty.
              </AlertDescription>
            </Alert>
          )}

          {filteredQueues.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Kolejka jest pusta"
              description="Nie ma jeszcze żadnych klientów w kolejce oczekujących. Dodaj klienta, który czeka na wolny termin rezerwacji."
              actionLabel="Dodaj do kolejki"
              onAction={() => setShowAddForm(true)}
            />
          ) : (
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
          )}
        </div>
      </Card>

      {/* Rebuild Dialog */}
      <Dialog open={showRebuildDialog} onOpenChange={(open) => {
        setShowRebuildDialog(open)
        if (!open) setRebuildConfirmed(false)
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
              Przebuduj numerację kolejki
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-300 font-medium">
                UWAGA: Ta operacja jest nieodwracalna i spowoduje utratę wszystkich ręcznych modyfikacji kolejności!
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Co zostanie zrobione:</p>
              <ul className="text-sm list-disc list-inside space-y-1.5 ml-2 text-neutral-500 dark:text-neutral-300">
                <li>Wszystkie rezerwacje w kolejce zostaną ponumerowane od nowa</li>
                <li>Każda data będzie miała numerację od 1</li>
                <li>Sortowanie według daty dodania (starsze rezerwacje pierwsze)</li>
                <li><strong className="text-amber-600 dark:text-amber-400">Wszystkie ręczne ustawienia kolejności zostaną usunięte</strong></li>
              </ul>
            </div>
            {stats && stats.manualOrderCount > 0 && (
              <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-300 text-sm">
                  <strong>Uwaga!</strong> Obecnie masz {stats.manualOrderCount} {stats.manualOrderCount === 1 ? 'rezerwację' : 'rezerwacji'} z ręcznie ustawioną kolejnością. Wszystkie te zmiany zostaną utracone!
                </AlertDescription>
              </Alert>
            )}
            <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
                <strong>Uwaga:</strong> Ta funkcja jest dostępna tylko dla administratorów.
              </AlertDescription>
            </Alert>
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="rebuild-confirm"
                  checked={rebuildConfirmed}
                  onCheckedChange={(checked) => setRebuildConfirmed(checked === true)}
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="rebuild-confirm" className="text-sm font-medium cursor-pointer text-neutral-900 dark:text-neutral-100">
                    Rozumiem konsekwencje i akceptuję ryzyko utraty ręcznych modyfikacji kolejności
                  </label>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">
                    Potwierdzam, że jestem świadomy nieodwracalności tej operacji
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRebuildDialog(false); setRebuildConfirmed(false) }} disabled={isRebuilding}>
              Anuluj
            </Button>
            <Button onClick={handleRebuildPositions} disabled={isRebuilding || !rebuildConfirmed} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isRebuilding ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Przebudowywanie...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" />Przebuduj numerację</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingQueueItem} onOpenChange={(open) => !open && setEditingQueueItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Edytuj wpis w kolejce</DialogTitle>
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
    </PageLayout>
  )
}

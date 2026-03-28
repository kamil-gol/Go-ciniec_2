'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QueueItem } from '@/types'
import { CreateReservationForm } from '@/components/reservations/create-reservation-form'
import { AlertCircle } from 'lucide-react'

interface PromoteModalProps {
  open: boolean
  onClose: () => void
  queueItem: QueueItem | null
  onPromote: (reservationId: string, data: any) => Promise<void>
}

export function PromoteModal({ open, onClose, queueItem, onPromote }: PromoteModalProps) {
  if (!queueItem) return null

  const handleSubmit = async (data: any) => {
    // Add status field (default to PENDING if not specified)
    const promoteData = {
      ...data,
      status: data.status || 'PENDING',
    }
    
    console.log('=== Promoting reservation from queue ===')
    console.log('Queue item:', queueItem)
    console.log('Promote data:', promoteData)
    
    await onPromote(queueItem.id, promoteData)
    onClose()
  }

  // Pre-fill form with queue data
  const initialData = {
    clientId: queueItem.client.id,
    adults: queueItem.guests, // Will be split in form
    children: 0,
    toddlers: 0,
    // Use queueDate as initial date suggestion for startDate
    startDate: new Date(queueItem.queueDate).toISOString().split('T')[0],
    notes: queueItem.notes || '',
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Awansuj do rezerwacji - {queueItem.client.firstName} {queueItem.client.lastName}
          </DialogTitle>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Kolejka na: {new Date(queueItem.queueDate).toLocaleDateString('pl-PL')}
              {' | '}
              Pozycja #{queueItem.position}
              {' | '}
              Liczba gości: {queueItem.guests}
            </p>
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800">
              <AlertCircle className="w-4 h-4" />
              <span>Wybierz salę, typ wydarzenia i uzupełnij szczegóły rezerwacji</span>
            </div>
          </div>
        </DialogHeader>

        <CreateReservationForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          initialData={initialData}
          isPromotingFromQueue
        />
      </DialogContent>
    </Dialog>
  )
}

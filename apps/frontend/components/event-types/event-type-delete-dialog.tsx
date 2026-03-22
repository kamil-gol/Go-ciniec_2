'use client'

import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
  deleteEventType,
  getEventTypeById,
  type EventType,
} from '@/lib/api/event-types-api'
import { toast } from 'sonner'

interface EventTypeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventType: EventType | null
  onSuccess: () => void
}

export function EventTypeDeleteDialog({ open, onOpenChange, eventType, onSuccess }: EventTypeDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [reservationCount, setReservationCount] = useState(0)
  const [templateCount, setTemplateCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && eventType) {
      setLoading(true)
      getEventTypeById(eventType.id)
        .then((data) => {
          setReservationCount(data._count.reservations)
          setTemplateCount(data._count.menuTemplates)
        })
        .catch(() => {
          setReservationCount(0)
          setTemplateCount(0)
        })
        .finally(() => setLoading(false))
    }
  }, [open, eventType])

  const hasRelations = reservationCount > 0 || templateCount > 0

  const handleDelete = async () => {
    if (!eventType) return

    try {
      setDeleting(true)
      await deleteEventType(eventType.id)
      toast.success(`Typ "${eventType.name}" został usunięty`)
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Nie można usunąć typu'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  if (!eventType) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-neutral-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Usunąć typ &quot;{eventType.name}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Ta operacja jest nieodwracalna.</p>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sprawdzanie powiązań...
                </div>
              ) : hasRelations ? (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 space-y-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Nie można usunąć tego typu!
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Powiązania: {reservationCount} rezerwacji, {templateCount} szablonów menu.
                    Najpierw usuń lub zmień te powiązania.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Ten typ nie ma żadnych powiązań — można go bezpiecznie usunąć.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting || loading || hasRelations}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Usuń typ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

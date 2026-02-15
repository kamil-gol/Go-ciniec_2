'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { EditableCard } from './EditableCard'
import { useUpdateReservation } from '@/lib/api/reservations'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

interface EditableNotesCardProps {
  reservationId: string
  notes: string | null
  confirmationDeadline: string | null
  startDateTime: string | null
  onUpdated?: () => void
}

export function EditableNotesCard({
  reservationId,
  notes: initialNotes,
  confirmationDeadline: initialDeadline,
  startDateTime,
  onUpdated,
}: EditableNotesCardProps) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [deadline, setDeadline] = useState(
    initialDeadline ? new Date(initialDeadline).toISOString().split('T')[0] : ''
  )

  const updateMutation = useUpdateReservation()

  useEffect(() => {
    setNotes(initialNotes || '')
    setDeadline(initialDeadline ? new Date(initialDeadline).toISOString().split('T')[0] : '')
  }, [initialNotes, initialDeadline])

  const handleSave = async (reason: string) => {
    await updateMutation.mutateAsync({
      id: reservationId,
      input: {
        notes: notes || undefined,
        confirmationDeadline: deadline || undefined,
        reason,
      },
    })

    toast.success('Notatki zaktualizowane')
    onUpdated?.()
  }

  const handleCancel = () => {
    setNotes(initialNotes || '')
    setDeadline(initialDeadline ? new Date(initialDeadline).toISOString().split('T')[0] : '')
  }

  const displayNotes = (initialNotes || '').trim()

  return (
    <EditableCard
      title="Notatki"
      icon={<FileText className="h-5 w-5 text-white" />}
      iconGradient="from-orange-500 to-amber-500"
      onSave={handleSave}
      onCancel={handleCancel}
    >
      {(editing) => {
        if (!editing) {
          return (
            <div className="space-y-4">
              {displayNotes ? (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{displayNotes}</p>
              ) : (
                <p className="text-muted-foreground italic">Brak notatek</p>
              )}

              {initialDeadline && (
                <div className="flex items-center gap-2 pt-3 border-t">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Termin potwierdzenia</p>
                    <p className="text-sm font-medium">
                      {format(new Date(initialDeadline), 'dd MMMM yyyy', { locale: pl })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Notatki</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-400 transition-colors resize-none"
                rows={4}
                placeholder="Dodatkowe informacje..."
              />
            </div>

            <div>
              <DatePicker
                value={deadline}
                onChange={setDeadline}
                label="Termin potwierdzenia (opcjonalnie)"
                placeholder="Wybierz datę..."
                minDate={new Date()}
              />
              <p className="mt-1 text-xs text-secondary-500">
                Musi być co najmniej 1 dzień przed rozpoczęciem wydarzenia
              </p>
            </div>
          </div>
        )
      }}
    </EditableCard>
  )
}

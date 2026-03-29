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
  disabled?: boolean
  onUpdated?: () => void
}

export function EditableNotesCard({
  reservationId,
  notes: initialNotes,
  confirmationDeadline: initialDeadline,
  disabled,
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
      gradientHeader
      headerGradient="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30"
      onSave={handleSave}
      onCancel={handleCancel}
      disabled={disabled}
    >
      {(editing) => {
        if (!editing) {
          return (
            <div className="space-y-3">
              <div className="p-3 bg-white dark:bg-black/20 rounded-lg">
                {displayNotes ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{displayNotes}</p>
                ) : (
                  <p className="text-muted-foreground italic">Brak notatek</p>
                )}
              </div>

              {initialDeadline && (
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-black/20 rounded-lg">
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
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Notatki</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-400 transition-colors resize-none"
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
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-300">
                Musi być co najmniej 1 dzień przed rozpoczęciem wydarzenia
              </p>
            </div>
          </div>
        )
      }}
    </EditableCard>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Lock, Save } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUpdateReservation } from '@/lib/api/reservations'
import { toast } from 'sonner'

interface EditableInternalNotesCardProps {
  reservationId: string
  internalNotes: string | null
  disabled?: boolean
  onUpdated?: () => void
}

export function EditableInternalNotesCard({
  reservationId,
  internalNotes: initialNotes,
  disabled = false,
  onUpdated,
}: EditableInternalNotesCardProps) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [isDirty, setIsDirty] = useState(false)

  const updateMutation = useUpdateReservation()

  useEffect(() => {
    setNotes(initialNotes || '')
    setIsDirty(false)
  }, [initialNotes])

  const handleChange = (value: string) => {
    setNotes(value)
    setIsDirty(value !== (initialNotes || ''))
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: reservationId,
        input: {
          internalNotes: notes || undefined,
          reason: 'Aktualizacja notatki wewn\u0119trznej',
        } as any,
      })
      setIsDirty(false)
      toast.success('Notatka wewn\u0119trzna zapisana')
      onUpdated?.()
    } catch {
      toast.error('Nie uda\u0142o si\u0119 zapisa\u0107 notatki wewn\u0119trznej')
    }
  }

  return (
    <Card className="border-0 shadow-xl">
      <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-fuchsia-950/30 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Notatka wewn\u0119trzna</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                \uD83D\uDD12 Tylko dla pracownik\u00f3w \u2014 nie pojawia si\u0119 w PDF
              </p>
            </div>
          </div>
          {isDirty && !disabled && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {updateMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          )}
        </div>

        <textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          readOnly={disabled}
          className={`w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-violet-400 transition-colors resize-none${disabled ? ' opacity-60 cursor-not-allowed' : ''}`}
          rows={3}
          placeholder="Wewn\u0119trzne uwagi, preferencje klienta, info dla zespo\u0142u..."
        />
      </div>
    </Card>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, Calendar, CheckCircle2, XCircle, Archive, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getClientReservationSummary, type ClientReservationSummary } from '@/lib/api/clients'

interface DeleteClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  clientId: string
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteClientModal({
  open,
  onOpenChange,
  clientName,
  clientId,
  onConfirm,
  isDeleting,
}: DeleteClientModalProps) {
  const [summary, setSummary] = useState<ClientReservationSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && clientId) {
      loadSummary()
    } else {
      setSummary(null)
      setError(null)
    }
  }, [open, clientId])

  const loadSummary = async () => {
    try {
      setLoadingSummary(true)
      setError(null)
      const data = await getClientReservationSummary(clientId)
      setSummary(data)
    } catch (e: any) {
      console.error('Failed to load reservation summary:', e)
      setError('Nie udało się załadować podsumowania rezerwacji')
    } finally {
      setLoadingSummary(false)
    }
  }

  const hasActiveReservations = summary ? summary.active > 0 : false
  const canDelete = summary !== null && !hasActiveReservations && !error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl">Usuń klienta</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Zamierzasz usunąć klienta <strong className="text-foreground">{clientName}</strong>.
            Dane osobowe zostaną <strong className="text-foreground">zanonimizowane</strong> (imię, nazwisko, telefon, email, notatki).
          </DialogDescription>
        </DialogHeader>

        {/* Reservation Summary */}
        <div className="space-y-3 py-2">
          {loadingSummary ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Sprawdzanie rezerwacji...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : summary ? (
            <>
              {hasActiveReservations && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Klient ma <strong>{summary.active}</strong> aktywn{summary.active === 1 ? 'ą' : 'ych'} rezerwacj{summary.active === 1 ? 'ę' : 'i'}.
                    Anuluj lub zakończ je przed usunięciem klienta.
                  </span>
                </div>
              )}

              {summary.total > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {summary.active > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Aktywne</p>
                        <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{summary.active}</p>
                      </div>
                    </div>
                  )}
                  {summary.completed > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Zakończone</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{summary.completed}</p>
                      </div>
                    </div>
                  )}
                  {summary.cancelled > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Anulowane</p>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{summary.cancelled}</p>
                      </div>
                    </div>
                  )}
                  {summary.archived > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <Archive className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Zarchiwizowane</p>
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-400">{summary.archived}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!hasActiveReservations && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Tej operacji <strong>nie można cofnąć</strong>. Dane osobowe klienta zostaną trwale zanonimizowane.</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Usuń i zanonimizuj
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

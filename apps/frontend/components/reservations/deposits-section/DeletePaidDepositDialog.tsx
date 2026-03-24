'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Deposit } from '@/lib/api/deposits'
import { formatDate } from './deposits-config'

interface DeletePaidDepositDialogProps {
  deposit: Deposit | null
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  loading: boolean
}

export function DeletePaidDepositDialog({ deposit, open, onClose, onConfirm, loading }: DeletePaidDepositDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Trash2 className="h-5 w-5" />
            </div>
            Usuń opłaconą zaliczkę
          </DialogTitle>
          <DialogDescription className="text-left pt-1">
            Ta zaliczka jest oznaczona jako <span className="font-semibold text-emerald-600 dark:text-emerald-400">opłacona</span>.
            Usunięcie jej spowoduje obniżenie sumy wpłat dla tej rezerwacji.
          </DialogDescription>
        </DialogHeader>

        {deposit && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Kwota</span>
              <span className="font-bold text-red-700 dark:text-red-300">{Number(deposit.amount).toLocaleString('pl-PL')} zł</span>
            </div>
            {deposit.paymentMethod && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Metoda płatności</span>
                <span className="font-medium">{deposit.paymentMethod}</span>
              </div>
            )}
            {deposit.paidAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Data wpłaty</span>
                <span className="font-medium">{formatDate(deposit.paidAt as string)}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Operacja jest rejestrowana w logu audytowym. Używaj tylko w przypadku błędu lub rezygnacji klienta.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Anuluj</Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Usuń zaliczkę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { MoreHorizontal, CheckCircle, XCircle, Undo2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit, PaymentMethod } from '@/lib/api/deposits'
import { toast } from 'sonner'

interface DepositActionsProps {
  deposit: Deposit
  onUpdate: () => void
}

export function DepositActions({ deposit, onUpdate }: DepositActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleMarkAsPaid = async () => {
    try {
      setLoading(true)
      await depositsApi.markAsPaid(deposit.id, { paymentMethod, paidAt })
      toast.success('Zaliczka oznaczona jako opłacona')
      setShowPayDialog(false)
      onUpdate()
    } catch (error) {
      console.error('Error marking deposit as paid:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsUnpaid = async () => {
    try {
      setLoading(true)
      await depositsApi.markAsUnpaid(deposit.id)
      toast.success('Cofnięto status płatności')
      onUpdate()
    } catch (error) {
      console.error('Error marking deposit as unpaid:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      setLoading(true)
      await depositsApi.cancel(deposit.id)
      toast.success('Zaliczka anulowana')
      onUpdate()
    } catch (error) {
      console.error('Error cancelling deposit:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await depositsApi.delete(deposit.id)
      toast.success('Zaliczka usunięta')
      setShowDeleteDialog(false)
      onUpdate()
    } catch (error) {
      console.error('Error deleting deposit:', error)
    } finally {
      setLoading(false)
    }
  }

  const isPending = deposit.status === 'PENDING' || deposit.status === 'OVERDUE'
  const isPaid = deposit.status === 'PAID'
  const isCancelled = deposit.status === 'CANCELLED'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isPending && (
            <DropdownMenuItem onClick={() => setShowPayDialog(true)}>
              <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
              Oznacz jako opłaconą
            </DropdownMenuItem>
          )}
          {isPaid && (
            <DropdownMenuItem onClick={handleMarkAsUnpaid}>
              <Undo2 className="mr-2 h-4 w-4 text-blue-600" />
              Cofnij płatność
            </DropdownMenuItem>
          )}
          {!isCancelled && !isPaid && (
            <DropdownMenuItem onClick={handleCancel}>
              <XCircle className="mr-2 h-4 w-4 text-neutral-600" />
              Anuluj zaliczkę
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Pay Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oznacz zaliczkę jako opłaconą</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Metoda płatności</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="TRANSFER">Przelew</option>
                <option value="CASH">Gotówka</option>
                <option value="BLIK">BLIK</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Data płatności</Label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                Kwota: <strong>{Number(deposit.amount).toLocaleString('pl-PL')} zł</strong>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>Anuluj</Button>
            <Button onClick={handleMarkAsPaid} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Potwierdź płatność
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć zaliczkę?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Zaliczka na kwotę{' '}
              <strong>{Number(deposit.amount).toLocaleString('pl-PL')} zł</strong>{' '}
              zostanie trwale usunięta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

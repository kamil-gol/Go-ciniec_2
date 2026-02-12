'use client'

import { useState } from 'react'
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Undo2,
  Trash2,
  FileDown,
  Banknote,
  ArrowDownUp,
  Smartphone,
  CreditCard,
  Loader2,
} from 'lucide-react'
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
  DialogDescription,
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

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'TRANSFER', label: 'Przelew', icon: ArrowDownUp, color: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'CASH', label: 'Gotówka', icon: Banknote, color: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'BLIK', label: 'BLIK', icon: Smartphone, color: 'border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'CARD', label: 'Karta', icon: CreditCard, color: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
]

export function DepositActions({ deposit, onUpdate }: DepositActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleMarkAsPaid = async () => {
    try {
      setLoading(true)
      await depositsApi.markAsPaid(deposit.id, { paymentMethod, paidAt })
      toast.success('Zaliczka oznaczona jako opłacona', {
        description: 'PDF potwierdzenia został wygenerowany i wysłany na email klienta.',
      })
      setShowPayDialog(false)
      onUpdate()
    } catch (error: any) {
      console.error('Error marking deposit as paid:', error)
      toast.error('Nie udało się oznaczyć zaliczki jako opłaconej')
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
      toast.error('Nie udało się cofnąć płatności')
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
      toast.error('Nie udało się anulować zaliczki')
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
      toast.error('Nie udało się usunąć zaliczki')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true)
      await depositsApi.downloadPdf(deposit.id)
      toast.success('PDF potwierdzenia pobrany')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Nie udało się pobrać PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const isPending = deposit.status === 'PENDING' || deposit.status === 'OVERDUE'
  const isPaid = deposit.status === 'PAID'
  const isCancelled = deposit.status === 'CANCELLED'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {/* PDF Download — only for paid deposits */}
          {isPaid && (
            <>
              <DropdownMenuItem onClick={handleDownloadPdf} disabled={pdfLoading}>
                {pdfLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-rose-600" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4 text-rose-600" />
                )}
                Pobierz PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Mark as paid */}
          {isPending && (
            <DropdownMenuItem onClick={() => setShowPayDialog(true)}>
              <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
              Oznacz jako opłaconą
            </DropdownMenuItem>
          )}

          {/* Undo payment */}
          {isPaid && (
            <DropdownMenuItem onClick={handleMarkAsUnpaid}>
              <Undo2 className="mr-2 h-4 w-4 text-blue-600" />
              Cofnij płatność
            </DropdownMenuItem>
          )}

          {/* Cancel */}
          {!isCancelled && !isPaid && (
            <DropdownMenuItem onClick={handleCancel}>
              <XCircle className="mr-2 h-4 w-4 text-neutral-500" />
              Anuluj zaliczkę
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Delete */}
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń zaliczkę
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ═══ Pay Dialog ═══ */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Potwierdź płatność
            </DialogTitle>
            <DialogDescription>
              Oznacz zaliczkę jako opłaconą. PDF potwierdzenia zostanie automatycznie wygenerowany
              i wysłany na email klienta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Amount display */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Kwota do zapłaty</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {Number(deposit.amount).toLocaleString('pl-PL')} zł
              </p>
              {deposit.reservation?.client && (
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                  {deposit.reservation.client.firstName} {deposit.reservation.client.lastName}
                </p>
              )}
            </div>

            {/* Payment method selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Metoda płatności</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  const isSelected = paymentMethod === method.value
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? `${method.color} border-current ring-2 ring-current/20`
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {method.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Data płatności</Label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>Anuluj</Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Potwierdź płatność
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirm ═══ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Usunąć zaliczkę?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Zaliczka na kwotę{' '}
              <strong className="text-neutral-900 dark:text-neutral-100">
                {Number(deposit.amount).toLocaleString('pl-PL')} zł
              </strong>{' '}
              zostanie trwale usunięta z systemu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

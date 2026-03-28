'use client'

import { useState } from 'react'
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Undo2,
  Trash2,
  FileDown,
  Mail,
  Banknote,
  ArrowDownUp,
  Smartphone,
  CreditCard,
  Loader2,
  Paperclip,
  AlertTriangle,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit, PaymentMethod } from '@/lib/api/deposits'
import { toast } from 'sonner'
import AttachmentPanel from '@/components/attachments/attachment-panel'
import { formatCurrency } from '@/lib/utils'

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
  const [showAttachments, setShowAttachments] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  const handleMarkAsPaid = async () => {
    try {
      setLoading(true)
      await depositsApi.markAsPaid(deposit.id, { paymentMethod, paidAt })
      toast.success('Zaliczka oznaczona jako opłacona')
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

  const handleSendEmail = async () => {
    try {
      setEmailLoading(true)
      const result = await depositsApi.sendEmail(deposit.id)
      toast.success('Email wysłany', { description: result.message })
    } catch (error: any) {
      console.error('Error sending email:', error)
      const msg = error?.response?.data?.message || 'Nie udało się wysłać emaila'
      toast.error(msg)
    } finally {
      setEmailLoading(false)
    }
  }

  const isPending = deposit.status === 'PENDING' || deposit.status === 'OVERDUE'
  const isPaid = deposit.status === 'PAID'
  const isCancelled = deposit.status === 'CANCELLED'
  const clientEmail = deposit.reservation?.client?.email
  const clientName = deposit.reservation?.client
    ? `${deposit.reservation.client.firstName} ${deposit.reservation.client.lastName}`
    : null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Akcje zaliczki">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-lg">
          {isPending && (
            <DropdownMenuItem
              onClick={() => setShowPayDialog(true)}
              className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800"
            >
              <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
              Oznacz jako opłaconą
            </DropdownMenuItem>
          )}

          {isPaid && (
            <DropdownMenuItem
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800"
            >
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-rose-600" />
              ) : (
                <FileDown className="mr-2 h-4 w-4 text-rose-600" />
              )}
              Pobierz PDF
            </DropdownMenuItem>
          )}

          {isPaid && clientEmail && (
            <DropdownMenuItem
              onClick={handleSendEmail}
              disabled={emailLoading}
              className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800"
            >
              {emailLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Mail className="mr-2 h-4 w-4 text-blue-600" />
              )}
              Wyślij email
            </DropdownMenuItem>
          )}

          {isPaid && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleMarkAsUnpaid}
                className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800"
              >
                <Undo2 className="mr-2 h-4 w-4 text-amber-600" />
                Cofnij płatność
              </DropdownMenuItem>
            </>
          )}

          {!isCancelled && !isPaid && (
            <DropdownMenuItem
              onClick={handleCancel}
              className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800"
            >
              <XCircle className="mr-2 h-4 w-4 text-neutral-500" />
              Anuluj zaliczkę
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Attachments — opens Sheet */}
          <DropdownMenuItem
            onClick={() => setShowAttachments(true)}
            className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800"
          >
            <Paperclip className="mr-2 h-4 w-4 text-violet-600" />
            Załączniki
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń zaliczkę
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Pay Dialog */}
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
              Oznacz zaliczkę jako opłaconą. Możesz później wysłać email z potwierdzeniem z menu akcji.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Kwota do zapłaty</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(deposit.amount)}
              </p>
              {clientName && (
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                  {clientName}
                </p>
              )}
            </div>

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

      {/* Attachments Sheet — slides in from right */}
      <Sheet open={showAttachments} onOpenChange={setShowAttachments}>
        <SheetContent side="right" className="sm:max-w-xl w-full p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <Paperclip className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              Załączniki zaliczki
            </SheetTitle>
            <SheetDescription>
              {clientName
                ? `${clientName} — ${formatCurrency(deposit.amount)}`
                : `Zaliczka ${formatCurrency(deposit.amount)}`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <AttachmentPanel
              entityType="DEPOSIT"
              entityId={deposit.id}
              title="Załączniki"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Usunąć zaliczkę?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {isPaid && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Ta zaliczka jest oznaczona jako <strong>OPŁACONA</strong>. Upewnij się, że usuwasz ją celowo (np. korekta błędu lub rezygnacja klienta).
                    </p>
                  </div>
                )}
                <p>
                  Ta operacja jest nieodwracalna. Zaliczka na kwotę{' '}
                  <strong className="text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(deposit.amount)}
                  </strong>{' '}
                  zostanie trwale usunięta z systemu.
                </p>
              </div>
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
